// temporarily "stolen" from https://github.com/HPI-BP2017N2/Crawler/blob/master/src/main/java/de/hpi/bpStormcrawler/BPIndexerBolt.java

package org.n52.webcrawl;

import static org.elasticsearch.common.xcontent.XContentFactory.jsonBuilder;

import java.util.Date;
import java.util.Map;

import com.digitalpebble.stormcrawler.elasticsearch.bolt.IndexerBolt;
//import lombok.AccessLevel;
//import lombok.Getter;
//import lombok.Setter;
//import lombok.extern.slf4j.Slf4j;
import org.apache.storm.task.OutputCollector;
import org.apache.storm.task.TopologyContext;
import org.apache.storm.topology.OutputFieldsDeclarer;
import org.apache.storm.tuple.Fields;
import org.apache.storm.tuple.Tuple;
import org.apache.storm.tuple.Values;

import com.digitalpebble.stormcrawler.Metadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Sends documents to ElasticSearch. Indexes all the fields from the tuples or a
 * Map &lt;String,Object&gt; from a named field.
 */
//@SuppressWarnings("serial")
//@Getter (AccessLevel.PRIVATE)
//@Setter (AccessLevel.PRIVATE)
//@Slf4j
public class N52IndexerBolt extends IndexerBolt {
    private OutputCollector _collector;


    /** This method is called once and prepares the component to be used. It configures the component.
     * @param conf The storm configuration in .yaml files
     * @param context the topology context gives information about the components place in the topology
     * @param collector the collector for the output fields
     */
    @Override
    public void prepare(Map conf, TopologyContext context, OutputCollector collector) {
        super.prepare(conf, context, collector);
        _collector = collector;
    }

    /** This message is executed every time a tuple arrives.
     * It does the indexing part which is executed by the parent class
     *
     * Also it extracts the important fields which we want to store later on from the given tuple.
     *
     * @param tuple The tuple that arrives from another component or storm itself
     */
    @Override
    public void execute(Tuple tuple) {
        super.execute(tuple);

        String uniformedUrl = getUniformedUrl(tuple);
        Metadata metadata = (Metadata) tuple.getValueByField("metadata");
        String crawlId = metadata.getFirstValue("crawl"); // TODO: not populated yet?
        String content = new String(tuple.getBinaryByField("content"));

        //TODO extract the fetchedTime from metadata (the field name is date)
        long date = new Date().getTime();

        _collector.emit("storage", tuple, new Values("asdf", date, uniformedUrl, content));
    }

    private String getUniformedUrl(Tuple tuple) {
        return valueForURL(tuple);
    }

    /**
     * We declare how a tuple this component emits looks like. We already also specify the streamId in which we emmit
     * this tuple into
     * @param declarer is the declarer which is used to configure which tuples the component emmits
     */
    @Override
    public void declareOutputFields(OutputFieldsDeclarer declarer) {
        super.declareOutputFields(declarer);
        declarer.declareStream("storage", new Fields("crawl", "fetchedDate", "url", "content"));
    }


}