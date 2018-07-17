import logging
logging.basicConfig(filename='/tmp/pythonbolt.log',level=logging.DEBUG)
logging.disable(logging.ERROR)

import os.path
import sys
scriptdir = os.path.dirname(os.path.abspath(__file__))
scriptdir = os.path.join(scriptdir, '..')
sys.path.append(scriptdir)
#os.environ['SKLEARN_SITE_JOBLIB'] = 'true'


############# END BOOTSTRAP ################


import storm
from sklearn.externals import joblib

clf = joblib.load('dataset_classifier/english.model')

classMapping = {
    0: 'dataset',
    1: 'unrelated',
}

class DatasetClassifierBolt(storm.BasicBolt):
    def initialize(self, conf, context):
        storm.logDebug('classifier bolt started')

    def process(self, tup):
        doc_text = tup.values[0]
        #language = tup.values[1] # TODO
        language = 'de'

        if language is not 'en':
            msg = 'ignoring tuple as document language {} is not supported'.format(language)
            logging.debug(msg)
            storm.logDebug(msg)
            return

        # predicted_classes = clf.predict([doc_text])
        # pred = classMapping[predicted_classes.tolist()[0]]

        # returns the distance from the hyperplane:
        # y > 0 -> unrelated. y < 0: dataset
        # return 0 if unrelated
        confidence = clf.decision_function([doc_text])
        pred = confidence.tolist()[0]
        pred = min(0.0, -pred)

        # requires probability=True on classifier during trainingtime
        # proba = predict_proba([doc_text])

        logging.debug([doc_text[0:200], pred])
        storm.logDebug('Classify result: {}'.format(pred))
        storm.emit([ pred ], anchors=[tup])

DatasetClassifierBolt().run()
