package org.n52.webcrawl;

import com.digitalpebble.stormcrawler.Metadata;
import org.apache.storm.topology.BasicOutputCollector;
import org.apache.storm.topology.OutputFieldsDeclarer;
import org.apache.storm.topology.base.BaseBasicBolt;
import org.apache.storm.tuple.Fields;
import org.apache.storm.tuple.Values;
import org.apache.storm.tuple.Tuple;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Sets the given metadata attribute `decisionField` to "false", if `checkField` is less than the given `threshold`
 * To be used in conjunction with stormcrawler MetadataFilter.
 */
public class ClassificationThresholdBolt extends BaseBasicBolt {
    protected String decisionField, checkField;
    protected float threshold;

    public ClassificationThresholdBolt(String decisionField, String checkField, float threshold) {
        this.decisionField = decisionField;
        this.checkField = checkField;
        this.threshold = threshold;
    }

    @Override
    public void execute(Tuple input, BasicOutputCollector collector) {
        Metadata m = (Metadata) input.getValueByField("metadata");

        String valString = m.getFirstValue(this.checkField);
        Float val = null;

        if (valString != null)
            val = Float.parseFloat(valString);

        if (val != null && val <= this.threshold)
            m.setValue(decisionField, "false");

        collector.emit(new Values(input.getValueByField("url"), m, input.getValueByField("text")));
    }

    @Override
    public void declareOutputFields(OutputFieldsDeclarer declarer) {
        declarer.declare(new Fields("url", "metadata", "text"));
    }
}
