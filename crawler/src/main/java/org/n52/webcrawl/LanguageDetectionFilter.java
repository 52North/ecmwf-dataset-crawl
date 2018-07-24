package org.n52.webcrawl;

import java.io.ByteArrayInputStream;
import java.util.Map;

import org.apache.tika.language.LanguageIdentifier;
import org.apache.tika.language.detect.LanguageConfidence;
import org.apache.tika.language.detect.LanguageDetector;

import org.apache.tika.language.detect.LanguageResult;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.parser.Parser;
import org.apache.tika.sax.BodyContentHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.DocumentFragment;

import com.digitalpebble.stormcrawler.Metadata;
import com.digitalpebble.stormcrawler.parse.ParseData;
import com.digitalpebble.stormcrawler.parse.ParseFilter;
import com.digitalpebble.stormcrawler.parse.ParseResult;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Detects the document language using Tika. Expects metadata["text"] to be set!
 */
public class LanguageDetectionFilter extends ParseFilter {

    private static final Logger LOG = LoggerFactory
            .getLogger(LanguageDetectionFilter.class);

    @Override
    public void filter(String URL, byte[] content, DocumentFragment doc, ParseResult parse) {
        ParseData parseData = parse.get(URL);
        Metadata metadata = parseData.getMetadata();

        try {
            String text = metadata.getFirstValue("text");
            if (text == null) return;
            LanguageIdentifier result = new LanguageIdentifier(text);
//            if (result.isReasonablyCertain()) {
                metadata.addValue("language", result.getLanguage());
//            }

            // new tika method, considering the whole document? "fails with no language detectors available"
//            Parser parser = new AutoDetectParser();
//            BodyContentHandler handler = new BodyContentHandler();
//            org.apache.tika.metadata.Metadata tikaMetadata = new org.apache.tika.metadata.Metadata();
//            parser.parse(new ByteArrayInputStream(content), handler, tikaMetadata, new ParseContext());
//            LanguageDetector detector = LanguageDetector.getDefaultLanguageDetector();
//            detector.loadModels().addText(handler.toString());
//            LanguageResult result = detector.detect();
//            if (result.getConfidence().compareTo(LanguageConfidence.LOW) > 0) {
//                metadata.addValue("language", result.getLanguage());
//            }
            LOG.debug(URL, result.toString());
        } catch (Exception e) {
            LOG.error("Unable to detect language: {}", e.getMessage());
        }
    }

    @Override
    public void configure(Map stormConf, JsonNode filterParams) { }
}
