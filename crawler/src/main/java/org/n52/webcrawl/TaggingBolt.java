package org.n52.webcrawl;

import com.digitalpebble.stormcrawler.Metadata;
import org.apache.storm.topology.BasicOutputCollector;
import org.apache.storm.topology.OutputFieldsDeclarer;
import org.apache.storm.topology.base.BaseBasicBolt;
import org.apache.storm.tuple.Fields;
import org.apache.storm.tuple.Tuple;
import org.apache.storm.tuple.Values;

import java.util.*;

/**
 * Postprocessing bolt finalizing the metadata pipeline before indexing.
 * - compiles a list of tags for the result based on previously extracted content
 * - TODO: cleans extracted text?
 */
public class TaggingBolt extends BaseBasicBolt {
    @Override
    public void execute(Tuple input, BasicOutputCollector collector) {
        Metadata m = (Metadata) input.getValueByField("metadata");

        List<String> keywords = generateKeywords(m);
        m.setValues("n52.keywords", keywords.toArray(new String[keywords.size()]));

        collector.emit(new Values(input.getValueByField("url"), m, input.getValueByField("text")));
    }

    /**
     * merge keywords from keywords.* with parse.keywords into keywords
     * used to summarize structure of page in frontend result list
     * @param m
     * @return
     */
    private List<String> generateKeywords (Metadata m) {
        List<String> keywords = new ArrayList<>();

        if (m.getFirstValue("n52.extracted.data_portal") != null) keywords.add("dataportal");
        if (m.getFirstValue("n52.extracted.data_api") != null)    keywords.add("api");
        if (m.getFirstValue("n52.extracted.data_link") != null)   keywords.add("datalink");
        if (m.getFirstValue("n52.extracted.data_pdf") != null)   keywords.add("pdf");

        String keyword;
        keyword = m.getFirstValue("n52.keywords.dataset");
        if (keyword != null && !keyword.equals("0.0")) keywords.add("dataset");
        keyword = m.getFirstValue("n52.keywords.historic");
        if (keyword != null && !keyword.equals("0.0")) keywords.add("historic");
        keyword = m.getFirstValue("n52.keywords.realtime");
        if (keyword != null && !keyword.equals("0.0")) keywords.add("realtime");

        String[] keyws = m.getValues("parse.keywords");
        if (keyws != null) {
            keywords.addAll(Arrays.asList(keyws));
        }

        return keywords;
    }

    @Override
    public void declareOutputFields(OutputFieldsDeclarer declarer) {
        declarer.declare(new Fields("url", "metadata", "text"));
    }
}

