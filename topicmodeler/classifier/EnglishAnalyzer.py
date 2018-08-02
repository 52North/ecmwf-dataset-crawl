import re
from nltk.stem.snowball import EnglishStemmer
from sklearn.feature_extraction.text import strip_accents_ascii
from sklearn.feature_extraction.stop_words import ENGLISH_STOP_WORDS

class EnglishAnalyzer(object):
    extra_stop_words = None
    ngram_range = (1,1)
    alphafilter   = re.compile(r"(?u)[^a-z ]+")
    token_pattern = re.compile(r"(?u)\b\w\w+\b")
    stemmer = None

    def __init__(self, extra_stop_words=None, ngram_range=(1,1)):
        self.stemmer = EnglishStemmer()
        self.ngram_range = ngram_range

        self.stop_words = ENGLISH_STOP_WORDS
        if extra_stop_words is not None:
            self.stop_words = self.stop_words | set(extra_stop_words)

    def analyze(self, doc):
        '''
        replaces the analyze function of any sk-learn text vectorizer with improved text handling, namely:
        - filter only alphabetic words
        - stem words
        - enhanced stopwords
        '''
        return self.word_ngrams(self.filter_stem(
            self.tokenize(self.preprocess(doc))
        ), self.ngram_range)

    def preprocess(self, doc):
        return self.alphafilter.sub(' ', strip_accents_ascii(doc.lower()))

    def tokenize(self, doc):
        return self.token_pattern.findall(doc)

    def filter_stem(self, tokens):
        return [self.stemmer.stem(w) for w in tokens if w not in self.stop_words]

    def word_ngrams(self, tokens, ngram_range):
        # handle token n-grams, copied from
        # https://github.com/scikit-learn/scikit-learn/blob/master/sklearn/feature_extraction/text.py#L146-L175

        min_n, max_n = self.ngram_range
        if max_n != 1:
            original_tokens = tokens
            if min_n == 1:
                # no need to do any slicing for unigrams
                # just iterate through the original tokens
                tokens = list(original_tokens)
                min_n += 1
            else:
                tokens = []

            n_original_tokens = len(original_tokens)

            # bind method outside of loop to reduce overhead
            tokens_append = tokens.append
            space_join = " ".join

            for n in range(min_n,
                            min(max_n + 1, n_original_tokens + 1)):
                for i in range(n_original_tokens - n + 1):
                    tokens_append(space_join(original_tokens[i: i + n]))

        return tokens
