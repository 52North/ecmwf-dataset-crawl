package org.n52.webcrawl;

import com.digitalpebble.stormcrawler.Metadata;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.io.IOUtils;
import org.apache.storm.topology.BasicOutputCollector;
import org.apache.storm.topology.OutputFieldsDeclarer;
import org.apache.storm.topology.base.BaseBasicBolt;
import org.apache.storm.tuple.Fields;
import org.apache.storm.tuple.Tuple;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.DocumentFragment;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import java.io.IOException;
import java.io.InputStream;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * fix types broken from multilang JSON-serialization for further processing with stormcrawler
 */
public class MultilangPostprocessBolt extends BaseBasicBolt {
    protected String[] fields;
    protected static DocumentBuilder xmlBuilder;

    private static final org.slf4j.Logger LOG = LoggerFactory
            .getLogger(MultilangPostprocessBolt.class);

    public MultilangPostprocessBolt(String[] fields) {
        this.fields = fields;
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            xmlBuilder = factory.newDocumentBuilder();
        } catch (ParserConfigurationException e) {
            LOG.error("could not create XML builder", e);
        }
    }

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

            else if (fieldName.equals("content")) {
                value = Base64.decodeBase64((String) value);
            }

            else if (fieldName.equals("docfragment")) {
                try {
                    value = base64ToDocFragment((String) value);
                } catch (Exception e) {
                    LOG.error("could not parse XML string to DocumentFragment", e, value);
                }
            }

            output.add(value);
        }
        collector.emit(output);
    }

    @Override
    public void declareOutputFields(OutputFieldsDeclarer declarer) {
        declarer.declare(new Fields(fields));
    }

    private DocumentFragment base64ToDocFragment (String input) throws IOException, SAXException {
        byte[] xml = Base64.decodeBase64(input);
        String wrapped = "<dummy>" + xml.toString() + "</dummy>";
        Document parsed = xmlBuilder.parse(IOUtils.toInputStream(wrapped, "UTF-8"));
        DocumentFragment fragment = parsed.createDocumentFragment();

        // Here, the document element is the <dummy/> element.
        NodeList children = parsed.getDocumentElement().getChildNodes();

        // Move dummy's children over to the document fragment
        while (children.getLength() > 0) {
            fragment.appendChild(children.item(0));
        }

        return fragment;
    }
}
