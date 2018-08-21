package org.n52.webcrawl;

import com.digitalpebble.stormcrawler.Metadata;
import org.apache.storm.topology.BasicOutputCollector;
import org.apache.storm.topology.OutputFieldsDeclarer;
import org.apache.storm.topology.base.BaseBasicBolt;
import org.apache.storm.tuple.Fields;
import org.apache.storm.tuple.Tuple;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * fix types broken from multilang JSON-serialization for further processing with stormcrawler
 */
public class MultilangPostprocessBolt extends BaseBasicBolt {
    protected String[] fields;

    public MultilangPostprocessBolt(String[] fields) { this.fields = fields; }

    @Override
    public void execute(Tuple input, BasicOutputCollector collector) {
        ArrayList<Object> output = new ArrayList<>(this.fields.length);
        for (String fieldName : this.fields) {
            Object value = input.getValueByField(fieldName);

            // JSONObject -> Map<String, List<String> -> Metadata
            if (fieldName.equals("metadata")) {
                Map<String, List<String>> m1 = (Map<String, List<String>>) value;
                Metadata meta = new Metadata();
                for (String k : m1.keySet()) {
                    meta.addValues(k, m1.get(k));
                }
                value = meta;
            }

            output.add(value);
        }
        collector.emit(output);
    }

    @Override
    public void declareOutputFields(OutputFieldsDeclarer declarer) {
        declarer.declare(new Fields(fields));
    }
}
