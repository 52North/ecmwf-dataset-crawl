import matplotlib.pyplot as plt
from sklearn.svm import LinearSVC
from sklearn.model_selection import StratifiedKFold
from sklearn.feature_selection import RFECV, RFE
from sklearn.datasets import make_classification

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

X_train, X_test, y_train, y_test, target_names, feature_names = saved_objects[0]
print('data loaded')


# first do preselection of features via chi squared, to reduce runtime of next step
from sklearn.feature_selection import SelectKBest, chi2
ch2 = SelectKBest(chi2, k=200)
X_train = ch2.fit_transform(X_train, y_train)
X_test = ch2.transform(X_test)
# keep selected feature names
feature_names = [feature_names[i] for i
                    in ch2.get_support(indices=True)]

# Create the RFE object and compute a cross-validated score.
svc = LinearSVC()
# # The "accuracy" scoring is proportional to the number of correct classifications
# rfecv = RFECV(estimator=svc, step=1, cv=StratifiedKFold(3),
#               scoring='f1')
#             #   scoring='accuracy')
# rfecv.fit(X_train, y_train) # FIXME: in crossvalidation, we don't split the data into train/test ourselves!

# # the maximum tends to be not the correct value
# print("Optimal number of features : %d" % rfecv.n_features_)
# print([feature_names[i] for i in rfecv.get_support(indices=True)])

# Plot number of features VS. cross-validation scores
# plt.figure()
# plt.xlabel("Number of features selected")
# plt.ylabel("Cross validation score (nb of correct classifications)")
# plt.plot(range(1, len(rfecv.grid_scores_) + 1), rfecv.grid_scores_)
# plt.show()

# then reselect the right terms with a specified number, manually chosen based on the plot

rfe = RFE(estimator=svc, n_features_to_select=10)
rfe.fit(X_train, y_train) # FIXME: in crossvalidation, we don't split the data into train/test ourselves!
print("Optimal number of features : %d" % rfe.n_features_)
print([feature_names[i] for i in rfe.get_support(indices=True)])
