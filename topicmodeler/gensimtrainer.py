from os import listdir, path
from collections import defaultdict
from gensim import corpora, models, similarities

# for tokenization
from nltk.tokenize import word_tokenize
from nltk import download
download('punkt')

# for gensim output
import logging
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

class Document:
    category = None
    text = None
    language = None
    def __init__(self, text, cat, lang):
        self.text = text
        self.category = cat
        self.language = lang

def getStopwords(filepath, lang):
    with open(path.join(filepath, lang + '.txt')) as f:
        return f.read().split()

def readDocuments(docDir, lang):
    docs = []
    for docClass in listdir(path.join(docDir, lang)):
        for doc in listdir(path.join(docDir, lang, docClass)):
            p = path.join(docDir, lang, docClass, doc)
            if path.isdir(p):
                continue
            with open(p) as docFile:
                docs.append(Document(docFile.read(), docClass, lang))
    return docs


def docs2corpus(documents, stoplist):
    # remove common words and tokenize
    # TODO: lemmatize, better stopwords, ...?
    texts = []
    for doc in documents:
        doc.tokens = [word for word in word_tokenize(doc.text.lower()) if word not in stoplist]
        texts.append(doc.tokens)

    # remove words that appear only once
    frequency = defaultdict(int)
    for text in texts:
        for token in text:
            frequency[token] += 1
    alltokens = [[token for token in text if frequency[token] > 1]
        for text in texts]

    # build a dictionary from all tokens
    dictionary = corpora.Dictionary(alltokens)

    # convert each document to vectorspace
    for doc in documents:
        doc.vectorspace = dictionary.doc2bow(doc.tokens)
    return dictionary, documents

def calcLsi(corpus):
    # transform plain vector space into tfidf space
    tfidf = models.TfidfModel(corpus)
    corpus_tfidf = tfidf[corpus]

    # reduce dimensionality from num_topics to 10 using LSI. (might try LDA?)
    dim = 8
    lsi = models.LsiModel(corpus_tfidf, id2word=dictionary, num_topics=dim) # initialize an LSI transformation
    lsi.print_topics(dim)

    return lsi, lsi[corpus_tfidf] # create a double wrapper over the original corpus: bow->tfidf->fold-in-lsi

def sortVectors(vectors):
    return sorted(vectors, key=lambda item: -item[1])

# get data
docs = readDocuments('./crawledPages', 'en')
stopwords = getStopwords('./stopwords', 'en')

# transform to vectorspace
dictionary, docs = docs2corpus(docs, stopwords)

# splitting the docs up by handcrafted topics. this seems to be an antipattern, this classifcation is partly the goal of Topic modeling!
corpusAgency = [doc.vectorspace for doc in docs if doc.category == 'agencysite'] # "corpus" contains scores for each token per doc
print('agencysite', [len(d) for d in corpusAgency])
lsi, topicsAgency = calcLsi(corpusAgency) # "topicsAgency" contains scores for each topic per doc

docsNocontent = [doc for doc in docs if doc.category == 'nocontent']
corpusNocontent = [doc.vectorspace for doc in docsNocontent]
print('nocontent', [len(d) for d in corpusNocontent])
lsi, topicsNocontent = calcLsi(corpusNocontent)

corpus = [doc.vectorspace for doc in docs]
lsi, topics = calcLsi(corpus)

# now compute similiarity of hypothetical external doc with current topics and/or docs (0815 index query home made)

# need to convert query doc first
# doc = 'Compatible browser required'
doc = 'This page can only be viewed with Javascript enabled'
doc = "Water levels are rising in all rivers in my state"
vec_bow = dictionary.doc2bow(doc.lower().split())
vec_lsi = lsi[vec_bow] # convert the query to LSI space. here we can compare the query against the topics (just like topicsAgency)
print(sortVectors(vec_lsi))

# index = similarities.MatrixSimilarity(topics) # create index from topicscores. can also be a subset of documents!
# sims = sortVectors(enumerate(index[vec_lsi])) # perform a similarity query against the corpus
# sims = [(docs[item[0]].text[:80], item[1]) for item in sims]
# print(sims)


# we see, this works in principle. the topics are BAD though. should be more distinct, fixable with bigger trainingset?
# issue: we likely need one corpus for each language?
# todo: how to map topics to "realworld topics"?
# todo: see if we can scrape entire data portals, see if we have overfitting or can avoid that?
