/**
 * Licensed to DigitalPebble Ltd under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * DigitalPebble licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


package org.n52.webcrawl;

import com.digitalpebble.stormcrawler.Constants;
import com.digitalpebble.stormcrawler.Metadata;
import com.digitalpebble.stormcrawler.bolt.StatusEmitterBolt;
import com.digitalpebble.stormcrawler.parse.*;
import com.digitalpebble.stormcrawler.persistence.Status;
import com.digitalpebble.stormcrawler.util.ConfUtils;
import org.apache.storm.metric.api.MultiCountMetric;
import org.apache.storm.task.OutputCollector;
import org.apache.storm.task.TopologyContext;
import org.apache.storm.topology.OutputFieldsDeclarer;
import org.apache.storm.tuple.Fields;
import org.apache.storm.tuple.Tuple;
import org.apache.storm.tuple.Values;
import org.jsoup.parser.Parser;
import org.slf4j.LoggerFactory;
import org.w3c.dom.DocumentFragment;

import java.net.MalformedURLException;
import java.net.URL;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.util.*;

import static com.digitalpebble.stormcrawler.Constants.StatusStreamName;

/**
 * This bolt applies ParseFilters to a (URL,ParseResult,DocumentFragment) tuple.
 *
 * It is extracted from JSoupParserBolt from com.digitalpebble.stormcrawler v1.9.
 * Splitting this component into two bolts enables to plug in additional bolts that
 * can't be implemented as ParseFilters between the parsing and ParseFilter stages
 * (such as components called via Storm's MultiLang protocol).
 */
@SuppressWarnings("serial")
public class ParseFilterBolt extends StatusEmitterBolt {

    private static final org.slf4j.Logger LOG = LoggerFactory
            .getLogger(ParseFilterBolt.class);

    private MultiCountMetric eventCounter;

    private ParseFilter parseFilters = null;

    private boolean emitOutlinks = true;

    @SuppressWarnings({ "rawtypes", "unchecked" })
    @Override
    public void prepare(Map conf, TopologyContext context,
            OutputCollector collector) {

        super.prepare(conf, context, collector);

        eventCounter = context.registerMetric(this.getClass().getSimpleName(),
                new MultiCountMetric(), 10);

        parseFilters = ParseFilters.fromConf(conf);

        emitOutlinks = ConfUtils.getBoolean(conf, "parser.emitOutlinks", true);

    }

    @Override
    public void execute(Tuple tuple) {
        // extract all the data from the tuple..
        String url = tuple.getStringByField("url");
        Metadata metadata = (Metadata) tuple.getValueByField("metadata");
        String text = tuple.getStringByField("text");
        byte[] content = tuple.getBinaryByField("content");
        List<String> outlinks = (List<String>) tuple.getValueByField("outlinks");

        DocumentFragment fragment = buildDom(metadata, url, content);

        LOG.info("Applying URL filters for {}", url);

        // ..and construct a ParseData object from it
        ParseData parent = new ParseData(text, metadata);
        parent.setContent(content);
        Map<String, ParseData> parentMap = new HashMap<>();
        parentMap.put(url, parent);
        ParseResult parse = new ParseResult(parentMap, toOutlinks(url, metadata, outlinks));

        // apply the parse filters if any
        try {
            parseFilters.filter(url, content, fragment, parse);
        } catch (RuntimeException e) {
            String errorMessage = "Exception while running parse filters on "
                    + url + ": " + e;
            handleException(url, e, metadata, tuple, "content filtering",
                    errorMessage);
            return;
        }

        if (emitOutlinks) {
            for (Outlink outlink : parse.getOutlinks()) {
                collector.emit(
                    StatusStreamName,
                    tuple,
                    new Values(outlink.getTargetURL(), outlink.getMetadata(), Status.DISCOVERED)
                );
            }
        }

        // emit each document/subdocument in the ParseResult object
        // there should be at least one ParseData item for the "parent" URL

        for (Map.Entry<String, ParseData> doc : parse) {
            ParseData parseDoc = doc.getValue();
            collector.emit(
                    tuple,
                    new Values(doc.getKey(), parseDoc.getContent(), parseDoc
                            .getMetadata(), parseDoc.getText()));
        }

        collector.ack(tuple);
        eventCounter.scope("tuple_success").incr();
    }

    private DocumentFragment buildDom(Metadata m, String url, byte[] content) {
        String charset = m.getFirstValue("parse.Content-Encoding");
        String html = Charset.forName(charset).decode(ByteBuffer.wrap(content)).toString();
        final org.jsoup.nodes.Document jsoupDoc;
        jsoupDoc = Parser.htmlParser().parseInput(html, url);
        return JSoupDOMBuilder.jsoup2HTML(jsoupDoc);
    }

    private void handleException(String url, Throwable e, Metadata metadata,
            Tuple tuple, String errorSource, String errorMessage) {
        LOG.error(errorMessage);
        // send to status stream in case another component wants to update
        // its status
        metadata.setValue(Constants.STATUS_ERROR_SOURCE, errorSource);
        metadata.setValue(Constants.STATUS_ERROR_MESSAGE, errorMessage);
        collector.emit(StatusStreamName, tuple, new Values(url, metadata,
                Status.ERROR));
        collector.ack(tuple);
        // Increment metric that is context specific
        String s = "error_" + errorSource.replaceAll(" ", "_") + "_";
        eventCounter.scope(s + e.getClass().getSimpleName()).incrBy(1);
        // Increment general metric
        eventCounter.scope("parsefilter_exception").incrBy(1);
    }

    private List<Outlink> toOutlinks(String url, Metadata metadata,
                                     Iterable<String> slinks) {
        Map<String, Outlink> outlinks = new HashMap<>();
        URL sourceUrl;
        try {
            sourceUrl = new URL(url);
        } catch (MalformedURLException e) {
            // we would have known by now as previous components check whether
            // the URL is valid
            LOG.error("MalformedURLException on {}", url);
            eventCounter.scope("error_invalid_source_url").incrBy(1);
            return new LinkedList<Outlink>();
        }

        for (String targetURL : slinks) {
            Outlink ol = filterOutlink(sourceUrl, targetURL, metadata);
            if (ol == null) {
                eventCounter.scope("outlink_filtered").incr();
                continue;
            }

            // the same link could already be there post-normalisation
            Outlink old = outlinks.get(ol.getTargetURL());
            if (old != null) {
                ol = old;
            }

            if (old == null) {
                outlinks.put(ol.getTargetURL(), ol);
                eventCounter.scope("outlink_kept").incr();
            }
        }

        return new LinkedList<>(outlinks.values());
    }

    @Override
    public void declareOutputFields(OutputFieldsDeclarer declarer) {
        super.declareOutputFields(declarer);
        // output of this module is the list of fields to index
        // with at least the URL, text content
        declarer.declare(new Fields("url", "content", "metadata", "text"));
    }
}
