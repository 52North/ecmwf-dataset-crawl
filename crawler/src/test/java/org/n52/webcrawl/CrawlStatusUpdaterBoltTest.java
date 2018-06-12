package org.n52.webcrawl;

import com.digitalpebble.stormcrawler.Metadata;
import com.digitalpebble.stormcrawler.util.ConfUtils;
import org.junit.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.Assert.*;

public class CrawlStatusUpdaterBoltTest {

    // getIndexName() is the only changed behaviour,
    // other stuff should be tested by com.digitalpebble.stormcrawler.elasticsearch
    @Test
    public void testGetIndexName() {
        String statusIndex = "crawlstatus-*";
        CrawlStatusUpdaterBolt bolt = new CrawlStatusUpdaterBolt(statusIndex);

        Metadata md = new Metadata();
        md.setValue("crawl", "tEstCrawl");

        assertEquals(bolt.getIndexName(md), "crawlstatus-testcrawl");
        assertEquals(bolt.getIndexName(md), "crawlstatus-testcrawl");

        statusIndex = "crawlstatus";
        CrawlStatusUpdaterBolt bolt2 = new CrawlStatusUpdaterBolt(statusIndex);
        assertEquals(bolt.getIndexName(md), "crawlstatus");
    }

    @Test
    public void testConstructor() {
        CrawlStatusUpdaterBolt bolt1 = new CrawlStatusUpdaterBolt();
        CrawlStatusUpdaterBolt bolt2 = new CrawlStatusUpdaterBolt("indexname");
    }
}