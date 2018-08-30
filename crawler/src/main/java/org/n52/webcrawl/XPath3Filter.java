package org.n52.webcrawl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import javax.xml.transform.dom.DOMSource;
import net.sf.saxon.s9api.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.DocumentFragment;

import com.digitalpebble.stormcrawler.Metadata;
import com.digitalpebble.stormcrawler.parse.ParseData;
import com.digitalpebble.stormcrawler.parse.ParseFilter;
import com.digitalpebble.stormcrawler.parse.ParseResult;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Reads a XPATH pattern from the config file and stores the value as metadata.
 * Unlike XPathFilter from StormCrawler, this supports XPath 3.0 via Saxon.
 * On the other hand it validates documents, and fails for incorrect XML
 */
public class XPath3Filter extends ParseFilter {

    private Processor processor = new Processor(false);

    private static final Logger LOG = LoggerFactory
            .getLogger(XPath3Filter.class);

    protected final Map<String, List<LabelledExpression>> expressions = new HashMap<>();

    class LabelledExpression {
        String key;
        private XPathExecutable expression;

        private LabelledExpression(String key, String expression) throws SaxonApiException {
            this.key = key;
            this.expression = processor.newXPathCompiler().compile(expression);
        }

        List<String> evaluate(XdmNode doc)
                throws SaxonApiException {
            XPathSelector selector = expression.load();
            selector.setContextItem(doc);
            XdmValue evalResult = selector.evaluate();

            List<String> values = new LinkedList<>();
            for (int i = 0; i < evalResult.size(); i++)
                values.add(evalResult.itemAt(i).getStringValue());
            return values;
        }
    }

    @Override
    public void filter(String URL, byte[] content, DocumentFragment doc, ParseResult parse) {
        XdmNode xdm;
        try {
            // instead of reparsing the content to XDM we wrap the DOM so that saxon can use it.
            // XDM parser is very strict and thus not suitable for webcrawling tagsoup.
            // System.out.println(doc.toString());
            DOMSource wrapped = new DOMSource(doc);
            xdm = processor.newDocumentBuilder().build(wrapped);
        } catch (SaxonApiException e) {
            LOG.error("Error parsing content as XML: {}", e);
            return;
        }

        ParseData parseData = parse.get(URL);
        Metadata metadata = parseData.getMetadata();

        // applies the XPATH expression in the order in which they are produced
        for (List<LabelledExpression> leList : expressions.values()) {
            for (LabelledExpression le : leList) {
                try {
                    List<String> values = le.evaluate(xdm);
                    if (values != null && !values.isEmpty()) {
                        metadata.addValues(le.key, values);
//                        break;
                    }
                } catch (SaxonApiException e) {
                    LOG.error("Error evaluating {}: {}", le.key, e.getMessage());
                }
            }
        }
    }

    @SuppressWarnings("rawtypes")
    @Override
    public void configure(Map stormConf, JsonNode filterParams) {
        java.util.Iterator<Entry<String, JsonNode>> iter = filterParams
                .fields();
        while (iter.hasNext()) {
            Entry<String, JsonNode> entry = iter.next();
            String key = entry.getKey();
            JsonNode node = entry.getValue();
            if (node.isArray()) {
                for (JsonNode expression : node) {
                    addExpression(key, expression);
                }
            } else {
                addExpression(key, entry.getValue());
            }
        }
    }

    private void addExpression(String key, JsonNode expression) {
        String xpathvalue = expression.asText();
        try {

            List<LabelledExpression> lexpressionList = expressions.get(key);
            if (lexpressionList == null) {
                lexpressionList = new ArrayList<>();
                expressions.put(key, lexpressionList);
            }
            LabelledExpression lexpression = new LabelledExpression(key, xpathvalue);
            lexpressionList.add(lexpression);

        } catch (SaxonApiException e) {
            throw new RuntimeException("Can't compile expression : "
                    + xpathvalue, e);
        }
    }

    @Override
    public boolean needsDOM() {
        return true;
    }
}
