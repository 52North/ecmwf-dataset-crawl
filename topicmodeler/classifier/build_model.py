from tempfile import mkdtemp
import sys
from time import time
from os import path
from shutil import rmtree

import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import randint as sp_randint
from sklearn.datasets import load_files
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_selection import SelectKBest, chi2
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.calibration import CalibratedClassifierCV

from EnglishAnalyzer import EnglishAnalyzer

# 1. load data
# 2. split data into train, validation, test set
#  - TODO: balance classes? seems to be contraproductive..
# 3. build pipeline (with cache) of
#   - tfidf vectorizer (with custom stemming, stopword list)
#   - feature selection (chi squared and/or RFECV)
#   - LinearSVC (works well, gets better with more data, well understood for corpora)
# 4. find optimal hyperparameters via randomsearch
#   - n_features
#   - stopwordlist
#   - SCV C param
#   - ???
# 5. eval resulting model with test dataset
# 6. calibrate classifier with testdata (sigmold)

# Utility function to report best scores
def report(results, n_top=5):
    for i in range(1, n_top + 1):
        candidates = np.flatnonzero(results['rank_test_score'] == i)
        for candidate in candidates:
            print("Model with rank: {0}".format(i))
            print("Mean validation score: {0:.3f} (std: {1:.3f})".format(
                  results['mean_test_score'][candidate],
                  results['std_test_score'][candidate]))
            print("Parameters: {0}".format(results['params'][candidate]))
            print("")

print("Loading dataset")
data = load_files("../trainingdata/traintest3_lots_bin", encoding='utf-8', shuffle=True)
target_names = data.target_names

print("splitting dataset")
X_train, X_test, y_train, y_test = train_test_split(data.data, data.target, test_size=0.3)

print("preparing vectorizer")
with open(path.join("./stopwords/en.txt")) as f:
    extra_stopwords = f.read().split()
a = EnglishAnalyzer(extra_stopwords)

print("starting hyperparam optim using train and test datasets")
cachedir = mkdtemp()
pipeline = Pipeline([
    ('vectorizer', TfidfVectorizer(sublinear_tf=True, max_df=0.5, analyzer=a.analyze)),
    ('dim_reduce', SelectKBest(chi2, k=15)), # FIXME: actually we need to select X best features PER CLASS!! (if multiclass)
    ('classifier', LinearSVC(C=1.0, class_weight=None)),
], memory=cachedir)


param_dist = {
    "vectorizer__min_df": [0.0, 0.15],
    "vectorizer__max_df": [0.2, 0.5, 0.8],
    "dim_reduce__k": sp_randint(10, 60),
    "classifier__C": [0.05, 0.5, 1.0],
    "classifier__class_weight": [None, 'balanced'],
}
n_iter_search = 1
random_search = RandomizedSearchCV(pipeline, param_distributions=param_dist,
                                   n_iter=n_iter_search, n_jobs=-1)
random_search.fit(X_train, y_train)

print("optimal hyperparams:")
report(random_search.cv_results_)
optim_clf = random_search.best_estimator_

print("evaluating resulting model with test dataset")
from sklearn import metrics
predicted = optim_clf.predict(X_test)
print(metrics.classification_report(y_test, predicted, target_names=data.target_names))
print(metrics.confusion_matrix(y_test, predicted))

#print("calibrating classifier for linear predict probabilities")
#clf = CalibratedClassifierCV(optim_clf, method="sigmoid", cv="prefit")
#clf.fit(X_test, y_test)
clf = optim_clf

from sklearn.externals import joblib
joblib.dump(clf, 'english.model')

rmtree(cachedir)
