package org.n52.webcrawl;

import com.digitalpebble.stormcrawler.ConfigurableTopology;
import com.digitalpebble.stormcrawler.Constants;
import com.digitalpebble.stormcrawler.bolt.FetcherBolt;
import com.digitalpebble.stormcrawler.bolt.JSoupParserBolt;
import com.digitalpebble.stormcrawler.bolt.SiteMapParserBolt;
import com.digitalpebble.stormcrawler.bolt.URLPartitionerBolt;
import com.digitalpebble.stormcrawler.elasticsearch.bolt.DeletionBolt;
import com.digitalpebble.stormcrawler.elasticsearch.bolt.IndexerBolt;
import com.digitalpebble.stormcrawler.elasticsearch.metrics.MetricsConsumer;
import com.digitalpebble.stormcrawler.elasticsearch.metrics.StatusMetricsBolt;
import com.digitalpebble.stormcrawler.elasticsearch.persistence.StatusUpdaterBolt;
import com.digitalpebble.stormcrawler.util.ConfUtils;
import org.apache.storm.metric.LoggingMetricsConsumer;
import org.apache.storm.topology.TopologyBuilder;
import org.apache.storm.tuple.Fields;

/**
 * Dummy topology to play with the spouts and bolts on ElasticSearch
 */
public class CrawlTopology extends ConfigurableTopology {

    public static void main(String[] args) throws Exception {
        ConfigurableTopology.start(new CrawlTopology(), args);
    }

    @Override
    protected int run(String[] args) {
        TopologyBuilder builder = new TopologyBuilder();

        int numWorkers = ConfUtils.getInt(getConf(), "topology.workers", 1);

        // set to the real number of shards ONLY if es.status.routing is set to
        // true in the configuration
        int numShards = 1;

        builder.setSpout("spout", new ConfigurableEsSpout("status-*"), numShards);

        builder.setBolt("status_metrics", new StatusMetricsBolt())
                .shuffleGrouping("spout");

        builder.setBolt("partitioner", new URLPartitionerBolt(), numWorkers)
                .shuffleGrouping("spout");

        builder.setBolt("fetch", new FetcherBolt(), numWorkers).fieldsGrouping(
                "partitioner", new Fields("key"));

        builder.setBolt("sitemap", new SiteMapParserBolt(), numWorkers)
                .localOrShuffleGrouping("fetch");

        builder.setBolt("parse", new JSoupParserBolt(), numWorkers)
                .localOrShuffleGrouping("sitemap");

        builder.setBolt("indexer", new IndexerBolt(), numWorkers)
                .localOrShuffleGrouping("parse");

        Fields furl = new Fields("url");

        builder.setBolt("status", new StatusUpdaterBolt(), numWorkers)
                .fieldsGrouping("fetch", Constants.StatusStreamName, furl)
                .fieldsGrouping("sitemap", Constants.StatusStreamName, furl)
                .fieldsGrouping("parse", Constants.StatusStreamName, furl)
                .fieldsGrouping("indexer", Constants.StatusStreamName, furl);

        builder.setBolt("deleter", new DeletionBolt(), numWorkers)
                .localOrShuffleGrouping("status",
                        Constants.DELETION_STREAM_NAME);

        conf.registerMetricsConsumer(MetricsConsumer.class);
        conf.registerMetricsConsumer(LoggingMetricsConsumer.class);

        return submit("crawl", conf, builder);
    }
}
