from os import listdir, path
from collections import defaultdict
from gensim import corpora, models, similarities, utils

# for tokenization
from nltk.tokenize import word_tokenize
from nltk.stem import RegexpStemmer
from nltk.stem.snowball import EnglishStemmer
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
    dictionary = corpora.Dictionary()
    stemmer = EnglishStemmer()
    numberFilter = RegexpStemmer('\d+\.?\d*')

    # remove common words and tokenize
    # TODO: stemmer, better stopwords, ...?
    # filter numbers, special characters
    print("  tokenizing & stemming...")
    texts = []
    for doc in documents:
        doc.tokens = [stemmer.stem(numberFilter.stem(word))
            for word in word_tokenize(doc.text) if word not in stoplist]
        texts.append(doc.tokens)
        # print(doc.tokens)

    # # remove words that appear only once
    # frequency = defaultdict(int)
    # for text in texts:
    #     for token in text:
    #         frequency[token] += 1
    # alltokens = [[token for token in text if frequency[token] > 1]
    #     for text in texts]

    # build a dictionary from all tokens
    print("  dictionary...")
    dictionary.add_documents([doc.tokens for doc in documents])
    dictionary.filter_extremes(no_below=10, no_above=1.0) # don't use words included in less than 10 documents
    dictionary.filter_n_most_frequent(remove_n=300) # remove 300 tokens which occur in the most documents
    dictionary.compactify()

    # convert each document to vectorspace
    print("  bag of words...")
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

#################################3
# get data
print('reading all the documents...')
docs = readDocuments('./trainingdata/dataportals', 'en')
stopwords = getStopwords('./stopwords', 'en')

###################################333
# transform to vectorspace
print('building dictionary & converting docs to vectorspace...')
dictionary, docs = docs2corpus(docs, stopwords)
# dictionary.save('./dataportals.dict')

print(dictionary)
# exit()

############################################
print('building LSI model...')
corpus = [doc.vectorspace for doc in docs]
lsi, topics = calcLsi(corpus)

# splitting the docs up by handcrafted topics. this seems to be an antipattern, this classifcation is partly the goal of Topic modeling!
# corpusAgency = [doc.vectorspace for doc in docs if doc.category == 'agencysite'] # "corpus" contains scores for each token per doc
# print('agencysite', [len(d) for d in corpusAgency])
# lsi, topicsAgency = calcLsi(corpusAgency) # "topicsAgency" contains scores for each topic per doc

# docsNocontent = [doc for doc in docs if doc.category == 'nocontent']
# corpusNocontent = [doc.vectorspace for doc in docsNocontent]
# print('nocontent', [len(d) for d in corpusNocontent])
# lsi, topicsNocontent = calcLsi(corpusNocontent)

##########################
# now compute similiarity of hypothetical external doc with current topics and/or docs (0815 index query home made)
print('testing against example document...')

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
