package org.n52.webcrawl;

import com.digitalpebble.stormcrawler.Metadata;
import com.digitalpebble.stormcrawler.elasticsearch.persistence.CollapsingSpout;
import org.apache.storm.tuple.Values;
import org.elasticsearch.action.ActionListener;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.SearchHits;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Calendar;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Exposes the index name to pull URL status from, in order to allow one spout
 * per index, feeding the same topology.
 * Also adds the indexName to the status stream metadata, so we can output it lateron to
 * the correct stream.
 *
 * FIXME: we shouldn't do this, just use a single status index and write metadata.crawl_id when injecting
 **/
public class ConfigurableEsSpout extends CollapsingSpout implements
        ActionListener<SearchResponse> {

    private static final Logger LOG = LoggerFactory
            .getLogger(CollapsingSpout.class);

    private int lastStartOffset = 0;

    public ConfigurableEsSpout() { super(); }
    public ConfigurableEsSpout(String statusIndexName) {
        super();
        this.indexName = statusIndexName;
    }

    @Override
    // exact copy of the method from CollapsingSpout, just to override the call to this.addHitToBuffer()
    public void onResponse(SearchResponse response) {
        long timeTaken = System.currentTimeMillis() - timeStartESQuery;

        SearchHit[] hits = response.getHits().getHits();
        int numBuckets = hits.length;

        // no more results?
        if (numBuckets == 0) {
            lastDate = null;
            lastStartOffset = 0;
        }
        // still got some results but paging won't help
        else if (numBuckets < maxBucketNum) {
            lastStartOffset = 0;
        } else {
            lastStartOffset += numBuckets;
        }

        // reset the value for next fetch date if the previous one is too old
        if (resetFetchDateAfterNSecs != -1) {
            Calendar diffCal = Calendar.getInstance();
            diffCal.setTime(lastDate);
            diffCal.add(Calendar.SECOND, resetFetchDateAfterNSecs);
            // compare to now
            if (diffCal.before(Calendar.getInstance())) {
                LOG.info(
                        "{} lastDate set to null based on resetFetchDateAfterNSecs {}",
                        logIdprefix, resetFetchDateAfterNSecs);
                lastDate = null;
                lastStartOffset = 0;
            }
        }

        int alreadyprocessed = 0;
        int numDocs = 0;

        synchronized (buffer) {
            for (SearchHit hit : hits) {
                Map<String, SearchHits> innerHits = hit.getInnerHits();
                // wanted just one per bucket : no inner hits
                if (innerHits == null) {
                    numDocs++;
                    if (!addHitToBuffer(hit)) {
                        alreadyprocessed++;
                    }
                    continue;
                }
                // more than one per bucket
                SearchHits inMyBucket = innerHits.get("urls_per_bucket");
                for (SearchHit subHit : inMyBucket.getHits()) {
                    numDocs++;
                    if (!addHitToBuffer(subHit)) {
                        alreadyprocessed++;
                    }
                }
            }

            // Shuffle the URLs so that we don't get blocks of URLs from the
            // same host or domain
            if (numBuckets != numDocs) {
                Collections.shuffle((List) buffer);
            }
        }

        esQueryTimes.addMeasurement(timeTaken);
        // could be derived from the count of query times above
        eventCounter.scope("ES_queries").incrBy(1);
        eventCounter.scope("ES_docs").incrBy(numDocs);
        eventCounter.scope("already_being_processed").incrBy(alreadyprocessed);

        LOG.info(
                "{} ES query returned {} hits from {} buckets in {} msec with {} already being processed",
                logIdprefix, numDocs, numBuckets, timeTaken, alreadyprocessed);

        // remove lock
        isInESQuery.set(false);
    }

    private boolean addHitToBuffer(SearchHit hit) {
        Map<String, Object> keyValues = hit.getSourceAsMap();
        String url = (String) keyValues.get("url");
        // is already being processed - skip it!
        if (beingProcessed.containsKey(url)) {
            return false;
        }
        Metadata metadata = fromKeyValues(keyValues);
        metadata.setValue("status_index", hit.getIndex()); // -----------
        return buffer.add(new Values(url, metadata));
    }
}