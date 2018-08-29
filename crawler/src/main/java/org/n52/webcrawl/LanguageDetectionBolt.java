package org.n52.webcrawl;


import org.apache.storm.topology.BasicOutputCollector;
import org.apache.storm.topology.OutputFieldsDeclarer;
import org.apache.storm.topology.base.BaseBasicBolt;
import org.apache.storm.tuple.Fields;
import org.apache.storm.tuple.Tuple;
import org.apache.storm.tuple.Values;
import org.apache.tika.language.LanguageIdentifier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.digitalpebble.stormcrawler.Metadata;

/**
 * Detects the document language using Tika. Expects metadata["text"] to be set!
 */
public class LanguageDetectionBolt extends BaseBasicBolt {

    private final String languageField = "n52.language";
    private final boolean ignoreConfidence = true;

    private static final Logger LOG = LoggerFactory
            .getLogger(LanguageDetectionBolt.class);

    @Override
    public void execute(Tuple input, BasicOutputCollector collector) {
        String text = input.getStringByField("text");
        Metadata metadata = (Metadata) input.getValueByField("metadata");

        try {
            if (text == null) return;

            LanguageIdentifier result = new LanguageIdentifier(text);
            if (ignoreConfidence || result.isReasonablyCertain())
                metadata.addValue(languageField, result.getLanguage());
        } catch (Exception e) {
            LOG.warn("Unable to detect language: {}", e.getMessage());
        }

//        collector.emit(new Values(input.getValueByField("url"), m, input.getValueByField("text")));
        collector.emit(input.getValues());
    }

    @Override
    public void declareOutputFields(OutputFieldsDeclarer declarer) {
        // this bolt outputs the fetched URL with metadata and text, html, bytecontent, and a list of URLs (outlinks)
        declarer.declare(new Fields("url", "metadata", "text", "content", "docfragment", "outlinks"));
    }
}
