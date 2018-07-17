from sklearn.externals import joblib
from sklearn.datasets import load_files

# 1. load model
# 2. classify input text, return scores

clf = joblib.load('english.model')
documents = load_files("../trainingdata/traintest2_en", encoding='utf-8', shuffle=True).data
predictions = clf.predict(documents)
print(predictions)
