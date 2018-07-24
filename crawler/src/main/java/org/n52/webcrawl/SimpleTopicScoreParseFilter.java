package org.n52.webcrawl;

import com.digitalpebble.stormcrawler.Metadata;
import com.digitalpebble.stormcrawler.parse.ParseData;
import com.digitalpebble.stormcrawler.parse.ParseFilter;
import com.digitalpebble.stormcrawler.parse.ParseResult;
import com.fasterxml.jackson.databind.JsonNode;
import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.analysis.core.SimpleAnalyzer;
import org.apache.lucene.index.memory.MemoryIndex;
import org.apache.lucene.queryparser.classic.ParseException;
import org.apache.lucene.queryparser.classic.QueryParser;
import org.w3c.dom.DocumentFragment;

import org.slf4j.LoggerFactory;

import java.util.*;

/**
 * Filter for a ParseBolt, extracting presence of topics (consisting of lucene queries).
 * The presence is quantified via the lucene query score, no advanced NLP techniques are applied!
 * Topic definitions are retrieved from a JSON file
 * TODO: in SC 1.10 we can use JSONResourceWrapper to get them from an Elasticsearch index!
 */
public class SimpleTopicScoreParseFilter extends ParseFilter {
    private static final org.slf4j.Logger LOG = LoggerFactory
            .getLogger(SimpleTopicScoreParseFilter.class);

    private MemoryIndex index;

    private Analyzer analyzer;

    protected final Map<String, ArrayList<String>> topics = new HashMap<>();

    @Override
    public void filter(String URL, byte[] content, DocumentFragment doc, ParseResult parse) {
        ParseData parseData = parse.get(URL);
        createIndex(parseData.getText());

        Metadata md = parseData.getMetadata();

        Iterator<String> iter = topics.keySet().iterator();
        while (iter.hasNext()) {
            String topic = iter.next();
            ArrayList<String> queries = topics.get(topic);

            // combined score of all queries = maximum match score
            double topicScore = 0.0;
            for (String query : queries) {
                try {
                    float score = search(query);
                    topicScore = Math.max(topicScore, score);
                } catch (ParseException e) {
                    LOG.error("Unable to parse query '{}'", query);
                }
            }

            md.addValue(topic, Double.toString(topicScore));
        }

        parse.set(URL, md);
    }

    @Override
    public void configure(Map stormConf, JsonNode filterParams) {
        java.util.Iterator<Map.Entry<String, JsonNode>> iter = filterParams
                .fields();
        while (iter.hasNext()) {
            Map.Entry<String, JsonNode> entry = iter.next();
            String key = entry.getKey();
            JsonNode node = entry.getValue();
            if (node.isArray()) {
                for (JsonNode expression : node) {
                    addTopic(key, expression);
                }
            } else {
                addTopic(key, entry.getValue());
            }
        }
    }

    private void addTopic(String topic, JsonNode queryJson) {
        String query = queryJson.asText();
        ArrayList<String> parsedQueries = topics.get(topic);
        if (parsedQueries == null) {
            parsedQueries = new ArrayList<>();
            topics.put(topic, parsedQueries);
        }
        parsedQueries.add(query);
    }

    /**
     * Searches the text previously indexed with createIndex() with the given query
     * @param query
     * @return
     * @throws ParseException
     */
    protected float search(String query) throws ParseException {
        QueryParser parser = new QueryParser("content", analyzer);
        float score = index.search(parser.parse(query));
        return score;
    }

    /**
     * Creates a lucene index to be searched with search()
     * @param text The content to index
     * @return
     */
    protected void createIndex(String text) {
        analyzer = new SimpleAnalyzer();
        index = new MemoryIndex();
        index.addField("content", text, analyzer);
    }
}
