package org.n52.webcrawl;

import java.io.IOException;
import java.util.List;

import org.apache.storm.topology.BasicOutputCollector;
import org.apache.storm.topology.OutputFieldsDeclarer;
import org.apache.storm.topology.base.BaseBasicBolt;
import org.apache.storm.tuple.Fields;
import org.apache.storm.tuple.Tuple;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.digitalpebble.stormcrawler.Metadata;

import com.optimaize.langdetect.DetectedLanguage;
import com.optimaize.langdetect.LanguageDetector;
import com.optimaize.langdetect.LanguageDetectorBuilder;
import com.optimaize.langdetect.ngram.NgramExtractors;
import com.optimaize.langdetect.profiles.LanguageProfile;
import com.optimaize.langdetect.profiles.LanguageProfileReader;
import com.optimaize.langdetect.text.CommonTextObjectFactories;
import com.optimaize.langdetect.text.TextObject;
import com.optimaize.langdetect.text.TextObjectFactory;


/**
 * Detects the document language using https://github.com/optimaize/language-detector.
 * Expects metadata["text"] to be set!
 */
public class LanguageDetectionBolt extends BaseBasicBolt {

    private final String languageField = "n52.language";
    private float minProb = 0.999f;

    private static LanguageDetector languageDetector;
    private static final TextObjectFactory textObjectFactory = CommonTextObjectFactories
        .forDetectingOnLargeText();

    static {
        try {
            // load all languages:
            List<LanguageProfile> languageProfiles = new LanguageProfileReader().readAllBuiltIn();
            // build language detector:
            languageDetector = LanguageDetectorBuilder
                .create(NgramExtractors.standard())
                .withProfiles(languageProfiles).build();
        } catch (IOException e) {
            throw new RuntimeException("Error while loading language profiles", e);
        }
    }


    private static final Logger LOG = LoggerFactory
            .getLogger(LanguageDetectionBolt.class);

    @Override
    public void execute(Tuple input, BasicOutputCollector collector) {
        String text = input.getStringByField("text");
        Metadata metadata = (Metadata) input.getValueByField("metadata");

        TextObject textObject = textObjectFactory.forText(text);
        synchronized (languageDetector) {
            List<DetectedLanguage> probs = languageDetector.getProbabilities(textObject);
            if (probs == null || probs.size() == 0)
                return;

            for (DetectedLanguage lang : probs) {
                if (lang.getProbability() >= minProb) {
                    String code = lang.getLocale().getLanguage();
                    metadata.addValue(languageField, code);
                }
            }
        }

        collector.emit(input.getValues());
    }

    @Override
    public void declareOutputFields(OutputFieldsDeclarer declarer) {
        // this bolt outputs the fetched URL with metadata and text, html, bytecontent, and a list of URLs (outlinks)
        declarer.declare(new Fields("url", "metadata", "text", "content", "docfragment", "outlinks"));
    }
}
