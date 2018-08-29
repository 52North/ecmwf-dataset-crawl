package org.n52.webcrawl;

import java.util.*;
import org.apache.commons.codec.binary.Base64;
import com.digitalpebble.stormcrawler.Metadata;
import org.apache.storm.topology.BasicOutputCollector;
import org.apache.storm.topology.OutputFieldsDeclarer;
import org.apache.storm.topology.base.BaseBasicBolt;
import org.apache.storm.tuple.Fields;
import org.apache.storm.tuple.Tuple;
import org.slf4j.LoggerFactory;
import org.w3c.dom.DocumentFragment;

/**
 * Prepares tuples to be emitted through the multilang protocol to eg python bolts
 * by ensuring they are serialized / encoded well.
 * (storm.multilang.JsonSerializer just calls .toString() for any non-trivial object)
 *
 * Allows to filter tuple fields so the RPC overhead is minimized
 * filters tuples to only the specified fields.
 *
 * Also transforms a field "metadata" into a  Map<String, List<String>>
 * for serialization.
 */
public class MultilangPreprocessBolt extends BaseBasicBolt {
    protected String[] fields;

    private static final org.slf4j.Logger LOG = LoggerFactory
            .getLogger(MultilangPreprocessBolt.class);

    public MultilangPreprocessBolt(String[] fields) { this.fields = fields; }

    @Override
    public void execute(Tuple input, BasicOutputCollector collector) {
        ArrayList<Object> output = new ArrayList<>(this.fields.length);
        for (String fieldName : this.fields) {
            Object value = input.getValueByField(fieldName);

            // metadata
            if (value instanceof Metadata) {
                // convert Metadata to Map<String, List<String>>
                Map<String, String[]> m = ((Metadata) value).asMap();
                Map<String, List<String>> m2 = new HashMap<>();
                for (String k : m.keySet())
                    m2.put(k, Arrays.asList(m.get(k)));
                value = m2;
            }

            // content
            else if (value instanceof byte[]) {
                value = Base64.encodeBase64String((byte[]) value);
            }

            // outlinks
            else if (value instanceof Set) {
                List<String> l = new ArrayList<>();
                l.addAll((Set<String>) value);
                value = l;
            }

            // docfragment
            else if (value instanceof DocumentFragment) {
                // encode XML representation as base64 for safe transport via JSON
                // yeah, i know. FIXME: more compact serialization (or avoid it in the first place)
                byte[] xml = value.toString().getBytes();
                value =  Base64.encodeBase64String(xml);
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
