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


/**
 * This is a copy of com.digitalpebble.stormcrawler.bolt.JSoupParserBolt (v1.9),
 * only changed to add the document text to metadata["text"].
 * see @CHANGES
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
import java.util.*;

import static com.digitalpebble.stormcrawler.Constants.StatusStreamName;

/**
 * This bolt parses fetched HTML content via JSoup, and passes on the DocumentFragment
 * as well as Metadata, Outlinks and text.
 *
 * It is extracted from JSoupParserBolt from com.digitalpebble.stormcrawler v1.9.
 * Splitting this component into two bolts enables to plug in additional bolts that
 * can't be implemented as ParseFilters between the parsing and ParseFilter stages
 * (such as components called via Storm's MultiLang protocol).
 *
 * Some minor changes in behaviour:
 * - extracted text is added to metadata
 * - non-html content types are always errors
 * - does not track anchors of outlinks. outlink datastructure is created in ParseFilterBolt later on
 */
@SuppressWarnings("serial")
public class ParserBolt extends StatusEmitterBolt {

    /** Metadata key name for tracking the anchors */
    public static final String ANCHORS_KEY_NAME = "anchors";

    private static final org.slf4j.Logger LOG = LoggerFactory
            .getLogger(ParserBolt.class);

    private MultiCountMetric eventCounter;

    private Detector detector = TikaConfig.getDefaultConfig().getDetector();

    private boolean detectMimeType = true;

    private boolean robots_noFollow_strict = true;

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

        robots_noFollow_strict = ConfUtils.getBoolean(conf,
                RobotsTags.ROBOTS_NO_FOLLOW_STRICT, true);

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
            // always raise an error when non html (as such content is not used by us anyway, and it complicates all further bolts)
            String errorMessage = "Exception content-type " + mimeType
                    + " for " + url;
            RuntimeException e = new RuntimeException(errorMessage);
            handleException(url, e, metadata, tuple,
                    "content-type checking", errorMessage);
            return;
        }

        long start = System.currentTimeMillis();

        String charset = CharsetIdentification.getCharset(metadata, content,
                maxLengthCharsetDetection);

        // get the robots tags from the fetch metadata
        RobotsTags robotsTags = new RobotsTags(metadata);

        Set<String> outlinks;
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
                outlinks = new HashSet<>(0);
            } else {
                Elements links = jsoupDoc.select("a[href]");
                outlinks = new HashSet<>(links.size());
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

                    if (StringUtils.isNotBlank(targetURL)) {
                        outlinks.add(targetURL);
                    }
                }
            }

            Element body = jsoupDoc.body();
            if (body != null) {
                text = body.text();
                metadata.addValue("text", text); // @CHANGES
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
                collector.emit(
                    Constants.StatusStreamName,
                    tuple,
                    new Values(url, metadata, Status.REDIRECTION)
                );
                collector.ack(tuple);
                eventCounter.scope("tuple_success").incr();
                return;
            }
        } catch (MalformedURLException e) {
            LOG.error("MalformedURLException on {}", url);
        }


        DocumentFragment fragment = JSoupDOMBuilder.jsoup2HTML(jsoupDoc);

        // emit the whole extracted data ParseResult including all outlinks for the parent URL
        collector.emit(tuple, new Values(url, metadata, text, content, fragment, outlinks));
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

        // this bolt outputs the fetched URL with metadata and text, html, bytecontent, and a list of URLs (outlinks)
        declarer.declare(new Fields("url", "metadata", "text", "content", "docfragment", "outlinks"));
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

}
