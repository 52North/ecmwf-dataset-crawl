package org.n52.webcrawl;

import com.digitalpebble.stormcrawler.Metadata;
import com.digitalpebble.stormcrawler.parse.ParseData;
import com.digitalpebble.stormcrawler.parse.ParseFilter;
import com.digitalpebble.stormcrawler.parse.ParseResult;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.DocumentFragment;

import java.util.ArrayList;
import java.util.Map;

/**
 * Clears all outlinks, when a numeric metadata field value is below a given threshold
 */
public class MdThresholdOutlinkFilter extends ParseFilter {

    private static final Logger LOG = LoggerFactory
            .getLogger(MdThresholdOutlinkFilter.class);

    private String mdField = "";
    private boolean filterIfHigher = false;
    private float threshold = Float.NEGATIVE_INFINITY;

    @Override
    public void configure(Map stormConf, JsonNode paramNode) {
        JsonNode node;

        // required
        node = paramNode.get("metadataField");
        if (node != null && node.isTextual()) mdField = node.textValue();
        else LOG.error("metadataField parameter not found");

        // required
        node = paramNode.get("threshold");
        if (node != null && node.isNumber()) threshold = node.floatValue();
        else LOG.error("threshold parameter not found");

        // optional
        node = paramNode.get("filterIfHigher");
        if (node != null && node.isBoolean()) filterIfHigher = node.booleanValue();
    }

    @Override
    public void filter(String URL, byte[] content, DocumentFragment doc, ParseResult parse) {
        ParseData parseData = parse.get(URL);
        Metadata m = parseData.getMetadata();

        String valString = m.getFirstValue(mdField);
        if (valString == null) {
            LOG.debug("metadata field {} not found for threshold check of {}", mdField, URL);
            return;
        }

        Float val = Float.parseFloat(valString);
        boolean shouldFilter = filterIfHigher
            ? val >= threshold
            : val <= threshold;

        // if threshold is not met, clear all outlinks
        if (shouldFilter) {
            parse.setOutlinks(new ArrayList<>());
            LOG.info("discarding outlinks due to {} = {} ({})", mdField, threshold, URL);
        }
    }
}
