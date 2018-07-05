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
import com.digitalpebble.stormcrawler.protocol.HttpHeaders;
import com.digitalpebble.stormcrawler.util.CharsetIdentification;
import com.digitalpebble.stormcrawler.util.ConfUtils;
import com.digitalpebble.stormcrawler.util.RefreshTag;
import com.digitalpebble.stormcrawler.util.RobotsTags;
import org.apache.commons.lang.StringUtils;
import org.apache.storm.metric.api.MultiCountMetric;
import org.apache.storm.task.OutputCollector;
import org.apache.storm.task.TopologyContext;
import org.apache.storm.topology.OutputFieldsDeclarer;
import org.apache.storm.tuple.Fields;
import org.apache.storm.tuple.Tuple;
import org.apache.storm.tuple.Values;
import org.apache.tika.config.TikaConfig;
import org.apache.tika.detect.Detector;
import org.apache.tika.io.TikaInputStream;
import org.apache.tika.mime.MediaType;
import org.jsoup.nodes.Element;
import org.jsoup.parser.Parser;
import org.jsoup.select.Elements;
import org.slf4j.LoggerFactory;
import org.w3c.dom.DocumentFragment;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import static com.digitalpebble.stormcrawler.Constants.StatusStreamName;

/**
 * Parser for HTML documents only which uses ICU4J to detect the charset
 * encoding. Kindly donated to storm-crawler by shopstyle.com.
 */
@SuppressWarnings("serial")
public class N52JSoupParserBolt extends StatusEmitterBolt {

    /** Metadata key name for tracking the anchors */
    public static final String ANCHORS_KEY_NAME = "anchors";

    private static final org.slf4j.Logger LOG = LoggerFactory
            .getLogger(N52JSoupParserBolt.class);

    private MultiCountMetric eventCounter;

    private ParseFilter parseFilters = null;

    private Detector detector = TikaConfig.getDefaultConfig().getDetector();

    private boolean detectMimeType = true;

    private boolean trackAnchors = true;

    private boolean emitOutlinks = true;

    private boolean robots_noFollow_strict = true;

    /**
     * If a Tuple is not HTML whether to send it to the status stream as an
     * error or pass it on the default stream
     **/
    private boolean treat_non_html_as_error = true;

    /**
     * Length of content to use for detecting the charset. Set to -1 to use the
     * full content (will make the parser slow), 0 to deactivate the detection
     * altogether, or any other value (at least a few hundred bytes).
     **/
    private int maxLengthCharsetDetection = -1;

    @SuppressWarnings({ "rawtypes", "unchecked" })
    @Override
    public void prepare(Map conf, TopologyContext context,
            OutputCollector collector) {

        super.prepare(conf, context, collector);

        eventCounter = context.registerMetric(this.getClass().getSimpleName(),
                new MultiCountMetric(), 10);

        parseFilters = ParseFilters.fromConf(conf);

        emitOutlinks = ConfUtils.getBoolean(conf, "parser.emitOutlinks", true);

        trackAnchors = ConfUtils.getBoolean(conf, "track.anchors", true);

        robots_noFollow_strict = ConfUtils.getBoolean(conf,
                RobotsTags.ROBOTS_NO_FOLLOW_STRICT, true);

        treat_non_html_as_error = ConfUtils.getBoolean(conf,
                "jsoup.treat.non.html.as.error", true);

        detectMimeType = ConfUtils.getBoolean(conf, "detect.mimetype", true);

        maxLengthCharsetDetection = ConfUtils.getInt(conf,
                "detect.charset.maxlength", -1);
    }

    @Override
    public void execute(Tuple tuple) {

        byte[] content = tuple.getBinaryByField("content");
        String url = tuple.getStringByField("url");
        Metadata metadata = (Metadata) tuple.getValueByField("metadata");

        LOG.info("Parsing : starting {}", url);

        // check that its content type is HTML
        // look at value found in HTTP headers
        boolean CT_OK = false;

        String mimeType = metadata.getFirstValue(HttpHeaders.CONTENT_TYPE);

        if (detectMimeType) {
            try {
                mimeType = guessMimeType(url, mimeType, content);
            } catch (Exception e) {
                String errorMessage = "Exception while guessing mimetype on "
                        + url + ": " + e;
                handleException(url, e, metadata, tuple, "mimetype guessing",
                        errorMessage);
                return;
            }
            // store identified type in md
            metadata.setValue("parse.Content-Type", mimeType);
        }

        if (StringUtils.isNotBlank(mimeType)) {
            if (mimeType.toLowerCase().contains("html")) {
                CT_OK = true;
            }
        }
        // go ahead even if no mimetype is available
        else {
            CT_OK = true;
        }

        if (!CT_OK) {
            if (this.treat_non_html_as_error) {
                String errorMessage = "Exception content-type " + mimeType
                        + " for " + url;
                RuntimeException e = new RuntimeException(errorMessage);
                handleException(url, e, metadata, tuple,
                        "content-type checking", errorMessage);
            } else {
                LOG.info("Incorrect mimetype - passing on : {}", url);
                collector.emit(tuple, new Values(url, content, metadata, "wrong mime"));
                collector.ack(tuple);
            }
            return;
        }

        long start = System.currentTimeMillis();

        String charset = CharsetIdentification.getCharset(metadata, content,
                maxLengthCharsetDetection);

        // get the robots tags from the fetch metadata
        RobotsTags robotsTags = new RobotsTags(metadata);

        Map<String, List<String>> slinks;
        String text = "";
        final org.jsoup.nodes.Document jsoupDoc;

        try {
            String html = Charset.forName(charset)
                    .decode(ByteBuffer.wrap(content)).toString();

            jsoupDoc = Parser.htmlParser().parseInput(html, url);

            // extracts the robots directives from the meta tags
            Element robotelement = jsoupDoc
                    .selectFirst("meta[name~=(?i)robots][content]");
            if (robotelement != null) {
                robotsTags.extractMetaTags(robotelement.attr("content"));
            }

            // store a normalised representation in metadata
            // so that the indexer is aware of it
            robotsTags.normaliseToMetadata(metadata);

            // do not extract the links if no follow has been set
            // and we are in strict mode
            if (robotsTags.isNoFollow() && robots_noFollow_strict) {
                slinks = new HashMap<>(0);
            } else {
                Elements links = jsoupDoc.select("a[href]");
                slinks = new HashMap<>(links.size());
                for (Element link : links) {
                    // abs:href tells jsoup to return fully qualified domains
                    // for
                    // relative urls.
                    // e.g.: /foo will resolve to http://shopstyle.com/foo
                    String targetURL = link.attr("abs:href");

                    // nofollow
                    boolean noFollow = "nofollow".equalsIgnoreCase(link
                            .attr("rel"));
                    // remove altogether
                    if (noFollow && robots_noFollow_strict) {
                        continue;
                    }

                    // link not specifically marked as no follow
                    // but whole page is
                    if (!noFollow && robotsTags.isNoFollow()) {
                        noFollow = true;
                    }

                    String anchor = link.text();
                    if (StringUtils.isNotBlank(targetURL)) {
                        // any existing anchors for the same target?
                        List<String> anchors = slinks.get(targetURL);
                        if (anchors == null) {
                            anchors = new LinkedList<>();
                            slinks.put(targetURL, anchors);
                        }
                        // track the anchors only if no follow is false
                        if (!noFollow && StringUtils.isNotBlank(anchor)) {
                            anchors.add(anchor);
                        }
                    }
                }
            }

            Element body = jsoupDoc.body();
            if (body != null) {
                text = body.text();
                metadata.addValue("text", text);
            }

        } catch (Throwable e) {
            String errorMessage = "Exception while parsing " + url + ": " + e;
            handleException(url, e, metadata, tuple, "content parsing",
                    errorMessage);
            return;
        }

        // store identified charset in md
        metadata.setValue("parse.Content-Encoding", charset);

        long duration = System.currentTimeMillis() - start;

        LOG.info("Parsed {} in {} msec", url, duration);

        // redirection?
        try {
            String redirection = null;

            Element redirElement = jsoupDoc
                    .selectFirst("meta[http-equiv~=(?i)refresh][content]");
            if (redirElement != null) {
                redirection = RefreshTag.extractRefreshURL(redirElement
                        .attr("content"));
            }

            if (StringUtils.isNotBlank(redirection)) {
                // stores the URL it redirects to
                // used for debugging mainly - do not resolve the target
                // URL
                LOG.info("Found redir in {} to {}", url, redirection);
                metadata.setValue("_redirTo", redirection);

                if (allowRedirs() && StringUtils.isNotBlank(redirection)) {
                    emitOutlink(tuple, new URL(url), redirection, metadata);
                }

                // Mark URL as redirected
                collector
                        .emit(Constants.StatusStreamName,
                                tuple, new Values(url, metadata,
                                        Status.REDIRECTION));
                collector.ack(tuple);
                eventCounter.scope("tuple_success").incr();
                return;
            }
        } catch (MalformedURLException e) {
            LOG.error("MalformedURLException on {}", url);
        }

        List<Outlink> outlinks = toOutlinks(url, metadata, slinks);

        ParseResult parse = new ParseResult(outlinks);

        // parse data of the parent URL
        ParseData parseData = parse.get(url);
        parseData.setMetadata(metadata);
        parseData.setText(text);
        parseData.setContent(content);

        // apply the parse filters if any
        try {
            DocumentFragment fragment = null;
            // lazy building of fragment
            if (parseFilters.needsDOM()) {
                fragment = JSoupDOMBuilder.jsoup2HTML(jsoupDoc);
            }
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
                        new Values(outlink.getTargetURL(), outlink
                                .getMetadata(), Status.DISCOVERED));
            }
        }

        // emit each document/subdocument in the ParseResult object
        // there should be at least one ParseData item for the "parent" URL

        for (Map.Entry<String, ParseData> doc : parse) {
            ParseData parseDoc = doc.getValue();
            String txt = parseDoc.getText();
            if (txt == null) {
                txt = "empty";
            }
            collector.emit(
                    tuple,
                    new Values(doc.getKey(), parseDoc.getContent(), parseDoc
                            .getMetadata(), txt));
        }

        collector.ack(tuple);
        eventCounter.scope("tuple_success").incr();
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
        eventCounter.scope("parse exception").incrBy(1);
    }

    @Override
    public void declareOutputFields(OutputFieldsDeclarer declarer) {
        super.declareOutputFields(declarer);
        // output of this module is the list of fields to index
        // with at least the URL, text content
        declarer.declare(new Fields("url", "content", "metadata", "text"));
    }

    public String guessMimeType(String URL, String httpCT, byte[] content) {

        org.apache.tika.metadata.Metadata metadata = new org.apache.tika.metadata.Metadata();

        if (StringUtils.isNotBlank(httpCT)) {
            // pass content type from server as a clue
            metadata.set(org.apache.tika.metadata.Metadata.CONTENT_TYPE, httpCT);
        }

        // use filename as a clue
        try {
            URL _url = new URL(URL);
            metadata.set(org.apache.tika.metadata.Metadata.RESOURCE_NAME_KEY,
                    _url.getFile());
        } catch (MalformedURLException e1) {
            throw new IllegalStateException("Malformed URL", e1);
        }

        try (InputStream stream = TikaInputStream.get(content)) {
            MediaType mt = detector.detect(stream, metadata);
            return mt.toString();
        } catch (IOException e) {
            throw new IllegalStateException("Unexpected IOException", e);
        }
    }

    private List<Outlink> toOutlinks(String url, Metadata metadata,
            Map<String, List<String>> slinks) {
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

        for (Map.Entry<String, List<String>> linkEntry : slinks.entrySet()) {
            String targetURL = linkEntry.getKey();

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

            List<String> anchors = linkEntry.getValue();
            if (trackAnchors && anchors.size() > 0) {
                ol.getMetadata().addValues(ANCHORS_KEY_NAME, anchors);
                // sets the first anchor
                ol.setAnchor(anchors.get(0));
            }
            if (old == null) {
                outlinks.put(ol.getTargetURL(), ol);
                eventCounter.scope("outlink_kept").incr();
            }
        }

        return new LinkedList<Outlink>(outlinks.values());
    }
}
