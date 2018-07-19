package org.n52.webcrawl;

import java.util.*;

import com.digitalpebble.stormcrawler.Metadata;
import org.apache.storm.topology.BasicOutputCollector;
import org.apache.storm.topology.OutputFieldsDeclarer;
import org.apache.storm.topology.base.BaseBasicBolt;
import org.apache.storm.tuple.Fields;
import org.apache.storm.tuple.Tuple;

/**
 * Prepares tuples to be emitted to eg python bolts through the multilang protocol
 * by ensuring they are serialized well.
 * Allows to filter tuple fields so the RPC overhead is minimized
 * filters tuples to only the specified fields.
 *
 * Also transforms a field "metadata" into a  Map<String, List<String>>
 * for serialization.
 */
public class MultilangPreprocessBolt extends BaseBasicBolt {
    protected String[] fields;

    public MultilangPreprocessBolt(String[] fields) { this.fields = fields; }

    @Override
    public void execute(Tuple input, BasicOutputCollector collector) {
        ArrayList<Object> output = new ArrayList<>(this.fields.length);
        for (String fieldName : this.fields) {
            Object value = input.getValueByField(fieldName);

            // convert Metadata to Map<String, List<String>>, as storm.multilang.JsonSerializer would just stringify it.
            if (value instanceof Metadata) {
                Map<String, String[]> m = ((Metadata) value).asMap();
                Map<String, List<String>> m2 = new HashMap<>();
                for (String k : m.keySet())
                    m2.put(k, Arrays.asList(m.get(k)));
                value = m2;
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

