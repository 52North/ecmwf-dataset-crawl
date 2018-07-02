import numpy as np
from tempfile import mkdtemp
import sys
from time import time
import matplotlib.pyplot as plt

from scipy.stats import randint as sp_randint

from sklearn.datasets import load_files
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_selection import SelectKBest, chi2
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC
from sklearn.model_selection import train_test_split, RandomizedSearchCV


# 1. load data
# 2. split data into train, validation, test set
#  - balance classes?
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
data = load_files("./trainingdata/traintest2_en", encoding='utf-8', shuffle=True)
target_names = data.target_names # TODO: scrape more categories / page types

print("splitting dataset")
X_train, X_test, y_train, y_test = train_test_split(data.data, data.target, test_size=0.3)

print("starting hyperparam optim using train and test datasets")
cachedir = mkdtemp()
pipeline = Pipeline([
    ('vectorizer', TfidfVectorizer(sublinear_tf=True, max_df=0.5, stop_words='english')), # TODO: customize tokenizer, stemmer, stopwords
    ('dim_reduce', SelectKBest(chi2, k=15)),
    ('classifier', LinearSVC(C=1.0)),
], memory=cachedir)


param_dist = {
    "vectorizer__sublinear_tf": [True, False],
    "vectorizer__max_df": [0.2, 0.8],
    "dim_reduce__k": sp_randint(8, 50),
    # TODO: find more params?
}
n_iter_search = 20
random_search = RandomizedSearchCV(pipeline, param_distributions=param_dist,
                                   n_iter=n_iter_search, n_jobs=-1)
optim_clf = random_search.fit(X_train, y_train)

print("optimal hyperparams:")
report(random_search.cv_results_)

print("evaluating resulting model with test dataset")
from sklearn import metrics
predicted = optim_clf.predict(X_test)
print(metrics.classification_report(y_test, predicted, target_names=data.target_names))
print(metrics.confusion_matrix(y_test, predicted))

# rmtree(cachedir)
