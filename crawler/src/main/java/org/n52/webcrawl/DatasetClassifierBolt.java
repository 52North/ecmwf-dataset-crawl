package org.n52.webcrawl;

import org.apache.storm.task.ShellBolt;
import org.apache.storm.topology.IRichBolt;
import org.apache.storm.topology.OutputFieldsDeclarer;
import org.apache.storm.tuple.Fields;

import java.util.Map;

public class DatasetClassifierBolt extends ShellBolt implements IRichBolt {

    public DatasetClassifierBolt() {
        super("python3", "dataset_classifier_bolt.py");
    }

    @Override
    public void declareOutputFields(OutputFieldsDeclarer declarer) {
        declarer.declare(new Fields("dataset_score"));
    }

    @Override
    public Map<String, Object> getComponentConfiguration() {
        return null;
    }
}
