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
 * - calculates a result score
 * - compiles a list of keywords for the result
 * - TODO: cleans extracted text?
 * - TODO: indexes numbers as numbers?
 */
public class ScoringBolt extends BaseBasicBolt {
    // TODO: allow configuration of scoring via weights?
    Float weightClassify = 4.0f;

    Float weightHistoric = 0.5f;
    Float weightRealtime = 0.5f;
    Float weightDataset = 0.5f;

    Float weightExtract = 0.333f;

    @Override
    public void execute(Tuple input, BasicOutputCollector collector) {
        Metadata m = (Metadata) input.getValueByField("metadata");

        float score = calcScore(m);
        m.setValue("n52.score", Float.toString(score));

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

    private float calcScore (Metadata m) {
        Float score = 0.0f;

        // class from DatasetClassificationBolt (python)
        String clazz = m.getFirstValue("n52.classify.class");
        String confidence = m.getFirstValue("n52.classify.confidence");
        if ("dataset".equals(clazz)) score += weightClassify;
        if (clazz == null) score += 0.5f * weightClassify; // boost unclassified results so they don't get lost
        if (confidence != null) score += Float.parseFloat(confidence); // not normalized! negative scoring for "unrelated"

        // from LuceneScoreFilter
        String keyword;
        keyword = m.getFirstValue("n52.keywords.historic");
        if (keyword != null) score += weightHistoric * Float.parseFloat(keyword);
        keyword = m.getFirstValue("n52.keywords.realtime");
        if (keyword != null) score += weightRealtime * Float.parseFloat(keyword);
        keyword = m.getFirstValue("n52.keywords.dataset");
        if (keyword != null) score += weightDataset * Float.parseFloat(keyword);

        // from XPath3Filter
        String[] extractlist;
        extractlist = m.getValues("n52.extracted.data_api");
        if (extractlist != null) score += weightExtract * Math.max(extractlist.length, 2);
        extractlist = m.getValues("n52.extracted.data_link");
        if (extractlist != null) score += weightExtract * Math.max(extractlist.length, 2);
        extractlist = m.getValues("n52.extracted.data_portal");
        if (extractlist != null) score += weightExtract * Math.max(extractlist.length, 2);
        extractlist = m.getValues("n52.extracted.license");
        if (extractlist != null) score += weightExtract * Math.max(extractlist.length, 2);

        return score;
    }

    @Override
    public void declareOutputFields(OutputFieldsDeclarer declarer) {
        declarer.declare(new Fields("url", "metadata", "text"));
    }
}

