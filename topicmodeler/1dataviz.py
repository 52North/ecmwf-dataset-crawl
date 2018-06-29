from __future__ import print_function

import logging
import numpy as np
from optparse import OptionParser
import sys
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

# Display progress logs on stdout
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s %(levelname)s %(message)s')


# parse commandline arguments
op = OptionParser()
op.add_option("--report",
              action="store_true", dest="print_report", default=True,
              help="Print a detailed classification report.")
op.add_option("--chi2_select",
              action="store", type="int", dest="select_chi2", default = 20,
              help="Select some number of features using a chi-squared test")
op.add_option("--confusion_matrix",
              action="store_true", dest="print_cm", default=True,
              help="Print the confusion matrix.")
op.add_option("--top10",
              action="store_true", dest="print_top10", default=True,
              help="Print ten most discriminative terms per class"
                   " for every classifier.")
op.add_option("--use_hashing",
              action="store_true",
              help="Use a hashing vectorizer.")
op.add_option("--n_features",
              action="store", type=int, default=2 ** 16,
              help="n_features when using the hashing vectorizer.")


def is_interactive():
    return not hasattr(sys.modules['__main__'], '__file__')

# work-around for Jupyter notebook and IPython console
argv = [] if is_interactive() else sys.argv[1:]
(opts, args) = op.parse_args(argv)
if len(args) > 0:
    op.error("this script takes no arguments.")
    sys.exit(1)

print(__doc__)
op.print_help()
print()


# #############################################################################
# Load some categories from the training set
import pickle
saved_objects = []
with (open("./dataset_vectorized.dat", "rb")) as openfile:
    while True:
        try:
            saved_objects.append(pickle.load(openfile))
        except EOFError:
            break

X_train, X_test, y_train, y_test, class_names, feature_names = saved_objects[0]
print('data loaded')

# print("building term clusters via TSNE, this will take a while")
# from yellowbrick.text import TSNEVisualizer
# tsne = TSNEVisualizer(labels = class_names)
# tsne.fit(X_train, y_train)
# tsne.poof()

if opts.select_chi2: # wow, this extracts (mostly) the right keywords magically. how? whats happening here?
    # idea: this is a feature selection technique, try dimensionality reduction instead, maybe we don't loose as much info? (LDA?)
    # or: use word occurence vector with BernoulliNB?

    # idea: further optimize by blacklisting some tokens here? e.g. council, recreation, parks, expenditure..
    # or is this an antipattern, and we should make sure the data is not as overfitted?

    # idea: normalize input data -> stem tokens (how to integrate into this workflow?)

    # idea: cross validation, hyperparam optim?

    print("Extracting %d best features by a chi-squared test" %
          opts.select_chi2)
    t0 = time()
    ch2 = SelectKBest(chi2, k=opts.select_chi2)
    X_train = ch2.fit_transform(X_train, y_train)
    X_test = ch2.transform(X_test)
    if feature_names:
        # keep selected feature names
        feature_names = [feature_names[i] for i
                         in ch2.get_support(indices=True)]
    print("done in %fs" % (time() - t0))
    print()

if feature_names:
    feature_names = np.asarray(feature_names)

X = np.asarray(X_train.todense())
y = y_train

from yellowbrick.features import RadViz
visualizer = RadViz(classes=class_names, features=feature_names)
visualizer.fit(X, y)  # Fit the data to the visualizer
visualizer.transform(X)     # Transform the data
visualizer.poof()           # Draw/show/poof the data

from yellowbrick.features import Rank1D
visualizer = Rank1D(features=feature_names, algorithm='shapiro')
visualizer.fit(X, y)                # Fit the data to the visualizer
visualizer.transform(X)             # Transform the data
visualizer.poof()                   # Draw/show/poof the data

from yellowbrick.features import ParallelCoordinates
visualizer = ParallelCoordinates(classes=class_names, features=feature_names, sample=0.06, rotation='vertical')
visualizer.fit(X, y)      # Fit the data to the visualizer
visualizer.transform(X)   # Transform the data
visualizer.poof()         # Draw/show/poof the data


def trim(s):
    """Trim string to fit on terminal (assuming 80-column display)"""
    return s if len(s) <= 120 else s[:117] + "..."
