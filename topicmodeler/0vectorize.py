from __future__ import print_function

import logging
import numpy as np
from optparse import OptionParser
import sys
from os import path
from time import time
import matplotlib.pyplot as plt

from sklearn.datasets import fetch_20newsgroups, load_files
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_extraction.text import HashingVectorizer
from sklearn.feature_selection import SelectFromModel
from sklearn.feature_selection import SelectKBest, chi2
from sklearn.linear_model import RidgeClassifier
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC
from sklearn.linear_model import SGDClassifier
from sklearn.linear_model import Perceptron
from sklearn.linear_model import PassiveAggressiveClassifier
from sklearn.naive_bayes import BernoulliNB, MultinomialNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neighbors import NearestCentroid
from sklearn.ensemble import RandomForestClassifier
from sklearn.utils.extmath import density
from sklearn import metrics
from sklearn.model_selection import train_test_split

from classifier.CustomVectorizer import EnglishAnalyzer

# Display progress logs on stdout
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s %(levelname)s %(message)s')


# parse commandline arguments
op = OptionParser()
op.add_option("--dataset",
              action="store",
              dest="dataset",
              type="string",
              help="The subdirectory of trainingdata to use.")
op.add_option("--use_hashing",
              action="store_true",
              help="Use a hashing vectorizer.")

(opts, args) = op.parse_args(sys.argv[1:])

if opts.dataset is None:
    print("plz specify a dataset")
    print(op.format_help())
    exit(1)

# #############################################################################
# Load some categories from the training set
print("Loading dataset")
data = load_files("./trainingdata/" + opts.dataset, encoding='utf-8', shuffle=True)
target_names = data.target_names # TODO: scrape more categories / page types

print("splitting dataset")
X_train, X_test, y_train, y_test = train_test_split(data.data, data.target, test_size=0.15)
print('data loaded')

# print("extracting and visualising term frequency")
# from yellowbrick.text import FreqDistVisualizer
# from sklearn.feature_extraction.text import CountVectorizer
# vectorizer = CountVectorizer()
# docs       = vectorizer.fit_transform(data.data)
# features   = vectorizer.get_feature_names()
# visualizer = FreqDistVisualizer(features=features)
# visualizer.fit(docs)
# visualizer.poof()

print("reading stopword list..")
with open(path.join("./classifier/stopwords/en.txt")) as f:
    extra_stopwords = f.read().split()

print("Extracting features from the training data using a sparse vectorizer")
t0 = time()
if opts.use_hashing:
    vectorizer = HashingVectorizer(stop_words='english', alternate_sign=False,
                                   n_features=opts.n_features)
    X_train = vectorizer.transform(X_train)
else:
    vectorizer = TfidfVectorizer(sublinear_tf=True, max_df=0.5,
                                 analyzer=EnglishAnalyzer(extra_stopwords).analyze)
    X_train = vectorizer.fit_transform(X_train)
duration = time() - t0
print("n_samples: %d, n_features: %d" % X_train.shape)
print()

print("Extracting features from the test data using the same vectorizer")
t0 = time()
X_test = vectorizer.transform(X_test)
duration = time() - t0
print("n_samples: %d, n_features: %d" % X_test.shape)
print()

# mapping from integer feature name to original token string
if opts.use_hashing:
    feature_names = None
else:
    feature_names = vectorizer.get_feature_names()

print("writing to file...")
import pickle
with open('./dataset_vectorized.dat', 'wb') as outfile:
    saved_data = [
        X_train,
        X_test,
        y_train,
        y_test,
        target_names,
        feature_names,
    ]
    pickle.dump(saved_data, outfile, protocol=pickle.HIGHEST_PROTOCOL)
