import logging
logging.basicConfig(filename='/tmp/pythonbolt.log',level=logging.DEBUG)
logging.disable(logging.ERROR)

import os.path
import sys
scriptdir = os.path.dirname(os.path.abspath(__file__))
scriptdir = os.path.join(scriptdir, '..')
sys.path.append(scriptdir)
#os.environ['SKLEARN_SITE_JOBLIB'] = 'true'

import storm
from sklearn.externals import joblib

class Metadata(dict):
    # metadata only supports lists of strings
    def __setitem__(self, key, value):
        if type(value) != list:
            value = [value]
        x = list(map(str, value))
        super(Metadata, self).__setitem__(key, x)

############# END BOOTSTRAP ################

class DatasetClassifierBolt(storm.BasicBolt):
    '''
    Classifies ENGLISH language website text using a LinearSVC into
    "contains/references a dataset" or "unrelated"

    input:  ["url", "metadata", "text", "content", "outlinks"]
    output: ["url", "metadata", "text", "content", "outlinks"]
    '''

    clf = None
    classMapping = {
        0: 'dataset',
        1: 'unrelated',
    }

    def initialize(self, conf, context):
        self.clf = joblib.load('dataset_classifier/english.model')
        storm.logDebug('classifier bolt started')

    def process(self, tup):
        # IDEA: do language classification here already?
        # IDEA: keep classifiers for several languages in a map
        # IDEA: batch N classifications (of the same language) for speed?

        url, meta, text, content, outlinks = tup.values
        metadata = Metadata(meta)
        out = [url, metadata, text, content, outlinks]

        try:
            lang = metadata['n52.language'][0]
        except KeyError:
            lang = 'unknown'

        if lang != 'en':
            msg = 'ignoring tuple, as document language {} is not supported'.format(lang)
            logging.debug(msg)
            storm.logDebug(msg)
        else:
            confidence, clazz = self.classify([text])[0]
            metadata["n52.classify.class"] = clazz
            metadata["n52.classify.confidence"] = confidence
            logging.debug([confidence, clazz, text[100:200], url])

        storm.emit(out, anchors=[tup])

    def classify(self, documents):
        tuples = []

        # returns the distance from the hyperplane:
        # y > 0 -> unrelated. y < 0: dataset
        scores = self.clf.decision_function(documents)

        # requires probability=True on classifier during trainingtime
        # probabilities = predict_proba(documents)

        for confidence in scores.tolist():
            confi = -confidence #max(0.0, -confidence) # return 0 if unrelated
            clazz = self.classMapping[1]
            if confidence < 0.0:
                clazz = self.classMapping[0]
            tuples.append([ confi, clazz ])

        return tuples

DatasetClassifierBolt().run()

