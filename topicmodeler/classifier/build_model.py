from tempfile import mkdtemp
import sys
from time import time
from os import path
from shutil import rmtree

import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import randint as sp_randint, uniform
from sklearn.datasets import load_files
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_selection import SelectKBest, chi2
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC, SVC
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

def show_most_informative_features_multi(vectorizer, clf, dim_reducer, class_labels, n=15):
    print("Top {} keywords per class:".format(n))
    feature_names = vectorizer.get_feature_names()
    feature_names = [feature_names[i] for i in dim_reducer.get_support(indices=True)]
    for i, label in enumerate(class_labels):
        coefsSorted = np.argsort(clf.coef_[i])
        coefsSorted = coefsSorted[-n:]
        print("%s:\t%s" % (label, " ".join([feature_names[c] for c in coefsSorted])))
    print("")

def show_most_informative_features_binary(vectorizer, clf, dim_reducer, class_labels, n=15):
    print("Top {} keywords per class:".format(n))
    feature_names = vectorizer.get_feature_names()
    feature_names = [feature_names[i] for i in dim_reducer.get_support(indices=True)]
    coefs_with_fns = sorted(zip(clf.coef_[0], feature_names))
    top = zip(coefs_with_fns[:n], coefs_with_fns[:-(n + 1):-1])
    print("\t\t%-15s\t\t\t%-15s" % (class_labels[0], class_labels[1]))
    for (coef_1, fn_1), (coef_2, fn_2) in top:
        print("\t%.4f\t%-15s\t\t%.4f\t%-15s" % (coef_1, fn_1, coef_2, fn_2))
    print("")

print("Loading dataset")
data = load_files("../trainingdata/combined_binary_doubleweight", encoding='utf-8', shuffle=True)  # 0.87 0.86 0.86
#data = load_files("../trainingdata/combined_binary", encoding='utf-8', shuffle=True)               # 0.82 0.81 0.81
#data = load_files("../trainingdata/combined_triple", encoding='utf-8', shuffle=True) # BAAAAD        0.7 0.7 0.65
#data = load_files("../trainingdata/new_triple", encoding='utf-8', shuffle=True) # alright for multi  0.85 0.85 0.85
#data = load_files("../trainingdata/new_binary", encoding='utf-8', shuffle=True)                #   ~ 0.90 0.8
#data = load_files("../trainingdata/new_binary_doubleweight", encoding='utf-8', shuffle=True)

print("splitting dataset")
X_train, X_test, y_train, y_test = train_test_split(data.data, data.target, test_size=0.3)

print("preparing vectorizer")
with open(path.join("./stopwords/en.txt")) as f:
    extra_stopwords = f.read().split()

cv = 6
print("starting hyperparam optim using train dataset with {}-fold cross validation".format(cv))
cachedir = mkdtemp()
pipeline = Pipeline([
    ('vectorizer', TfidfVectorizer(sublinear_tf=True)),
    ('dim_reduce', SelectKBest(chi2, k=15)), # FIXME: actually we need to select X best features PER CLASS!! (if multiclass)
    #('dim_reduce', SelectKBest(k=15)),
    ('classifier', LinearSVC(C=1.0, class_weight='balanced')),
    #('classifier', SVC(kernel='linear', class_weight='balanced')),
], memory=cachedir)

param_dist = {
    "vectorizer__analyzer": [
        EnglishAnalyzer(extra_stopwords).analyze, # bag of words only
        EnglishAnalyzer(extra_stopwords, ngram_range=(1,2)).analyze, # also add bigrams as features
    ],
    "vectorizer__min_df": [0.05, 0.2],
    "vectorizer__max_df": [0.7, 1.0],
    "dim_reduce__k": sp_randint(10, 40),
    "classifier__C": uniform(0.05, 0.95),
}
n_iter_search = 36
random_search = RandomizedSearchCV(
    pipeline, param_distributions=param_dist,
    iid=False, cv=cv,
    n_iter=n_iter_search, n_jobs=-1)
random_search.fit(X_train, y_train)

print("optimal hyperparams:")
report(random_search.cv_results_)
optim_clf = random_search.best_estimator_

featureprint = show_most_informative_features_binary
if len(data.target_names) > 2:
    featureprint = show_most_informative_features_multi
featureprint(
    optim_clf.named_steps["vectorizer"],
    optim_clf.named_steps["classifier"],
    optim_clf.named_steps["dim_reduce"],
    data.target_names
)

print("evaluating resulting model with test dataset")
from sklearn import metrics
predicted = optim_clf.predict(X_test)
print(metrics.classification_report(y_test, predicted, target_names=data.target_names))
print(metrics.confusion_matrix(y_test, predicted))

clf = optim_clf
#print("calibrating classifier for linear predict probabilities")
#clf = CalibratedClassifierCV(optim_clf, method="sigmoid", cv="prefit")
#clf.fit(X_test, y_test) # FIXME

print("writing model to file")
from sklearn.externals import joblib
joblib.dump(clf, 'english.model')

rmtree(cachedir)
