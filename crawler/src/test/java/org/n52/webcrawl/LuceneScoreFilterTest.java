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

public class LuceneScoreFilterTest extends ParsingTester {

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

    @Test
    public void testMatch() throws ParseException {
        LuceneScoreFilter filter = new LuceneScoreFilter();
        filter.createIndex("This text is all about testing.");
        Assert.assertTrue("match returns > 0", filter.search("te?t") > 0);
        Assert.assertTrue("no match returns 0", filter.search("no match") == 0);
    }

    @Test(expected = ParseException.class)
    public void testQueryException() throws ParseException {
        LuceneScoreFilter filter = new LuceneScoreFilter();
        filter.createIndex("asdf");
        filter.search("wat90)(&*r23j4kewelhfla38w??#@?!$3");
    }

    @Test
    public void testScoring() throws ParseException {
        String text1 = "This text is all about testing Lucene scores.";
        String text2 = "This text is all about testing.";
        String text3 = "This test is all about texting.";

        printQuery(text1, "test~");
        printQuery(text1, "text~");
        printQuery(text1, "te?t");
        printQuery(text1, "text*~");
        printQuery(text1, "test*~");
        printQuery(text1, "te?t*");

        printQuery(text1, "te?t~ about");
        printQuery(text1, "text abut~");

        printQuery(text1, "this text is all about testing");
        printQuery(text1, "This text is all about testing Lucene Scores.");

        printQuery(text2, "This text is all about testing.");
        printQuery(text3, "This text is all about testing.");
        printQuery(text3, "This test is all about texting.");

        text1 = "eins zwei drei";
        printQuery(text1, "eins");
        printQuery(text1, "zwei");
        printQuery(text1, "eins zwei");
        printQuery(text1, "eins drei");
        printQuery(text1, "zwei drei");
        printQuery(text1, "drei zwei eins");
        printQuery(text1, "eins zwei drei");

        text2 = "eins zwei drei vier fünf sechs";
        printQuery(text2, "eins zwei drei");
        printQuery(text2, "zwei drei");
        printQuery(text2, "eins zwei drei vier fuenf sechs");
        printQuery(text2, "eins zwei drei vier fünf sechs");

        printQuery("data-sets datasets data-set dataset", "datasets~");
    }

    float printQuery(String text, String query) throws ParseException {
        LuceneScoreFilter filter = new LuceneScoreFilter();
        filter.createIndex(text);
        float score = filter.search(query);
        System.out.println("\ntext:\t" + text + "\nquery:\t" + query + "\nscore:\t" + score);
        return score;
    }
}

