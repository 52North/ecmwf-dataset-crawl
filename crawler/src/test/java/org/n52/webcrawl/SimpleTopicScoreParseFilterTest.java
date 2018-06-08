package org.n52.webcrawl;

import com.digitalpebble.stormcrawler.Metadata;
import com.digitalpebble.stormcrawler.bolt.JSoupParserBolt;
import com.digitalpebble.stormcrawler.parse.ParsingTester;
import org.apache.lucene.queryparser.classic.ParseException;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SimpleTopicScoreParseFilterTest extends ParsingTester {
    SimpleTopicScoreParseFilter filter;

    @Before
    public void setupParserBolt() {
        bolt = new JSoupParserBolt();
        setupParserBolt(bolt);

    }

    @Test
    public void checkMetadata() throws IOException {
        Map config = new HashMap();
        prepareParserBolt("topicscore.parsefilters.json", config);
        parse("https://nroo.de", "topicscore.testpage.html");

        List<List<Object>> tuples = output.getEmitted();
        Assert.assertEquals(1, tuples.size());
        Metadata md = (Metadata) tuples.get(0).get(2);

        System.out.println(md.toString());
        String scoreKey = "topicscores.dataset";
        Assert.assertTrue("MD contains scores", md.asMap().containsKey(scoreKey));
        Assert.assertTrue("scores are strings", md.getFirstValue(scoreKey) instanceof String);
        Assert.assertTrue("strings contain float values > 0 for matches", Float.parseFloat(md.getFirstValue(scoreKey)) > 0.0);

        scoreKey = "topicscores.download";
        Assert.assertTrue("strings contain float values == 0 for non-matches", Float.parseFloat(md.getFirstValue(scoreKey)) == 0.0);
    }

    @Before
    public void setupInstance() {
        filter = new SimpleTopicScoreParseFilter();
        filter.createIndex("This text is all about testing.");
    }

    @Test
    public void testScore() throws ParseException {
        Assert.assertTrue("match returns > 0", filter.search("te?t") > 0);
        Assert.assertTrue("no match returns 0", filter.search("no match") == 0);
    }

    @Test(expected = ParseException.class)
    public void testQueryException() throws ParseException {
        filter.search("wat90)(&*r23j4kewelhfla38w??#@?!$3");
    }
}