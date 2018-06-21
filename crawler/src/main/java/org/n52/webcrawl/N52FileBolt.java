// temporarily "stolen" from https://github.com/HPI-BP2017N2/Crawler/blob/master/src/main/java/de/hpi/bpStormcrawler/BPFileBolt.java

package org.n52.webcrawl;

import com.digitalpebble.stormcrawler.util.ConfUtils;
//import com.google.common.annotations.VisibleForTesting;
import org.apache.storm.task.OutputCollector;
import org.apache.storm.task.TopologyContext;
import org.apache.storm.topology.OutputFieldsDeclarer;
import org.apache.storm.topology.base.BaseRichBolt;
import org.apache.storm.tuple.Tuple;

import java.io.*;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class N52FileBolt extends BaseRichBolt {
    private String baseFolder;
    private OutputCollector _collector;

    @Override
    public void prepare(Map map, TopologyContext topologyContext, OutputCollector outputCollector) {
         baseFolder = ConfUtils.getString(map,"file.path","/tmp/crawledPages/");
         _collector = outputCollector;
    }

    /** This method extracts from each tuple the relevant information to be stored
     *
     * It stores each HTML Page in a seperate file which is automatically named and stored in the right folder.
     * The naming scheme is the shopId-rootURL-timestamp.html and stored in the folder of the domain with
     * the name of the rootURl.
     * This is therefore a possible structure
     * crawledPages/www_alternate_de/1234-www_alternate_de-12434834983498.html
     *
     * The required directories are automatically created if not yet existent
     *
     * @param tuple The input tuple which should be stored in a file
     */
    @Override
    public void execute(Tuple tuple) {
        String language = tuple.getStringByField("language");
        String category = tuple.getStringByField("category");
        long fetchedDate = tuple.getLongByField("fetchedDate");
        String url = tuple.getStringByField("url");
        String content = tuple.getStringByField("content");

        try {
            if (language == null) language = "unknown";
            store(language, category, fetchedDate,url,content);
        } catch (Exception e) {
            e.printStackTrace();
        }
        _collector.ack(tuple);
    }

    @Override
    public void declareOutputFields(OutputFieldsDeclarer outputFieldsDeclarer) {

    }


    private void store(String language, String cat, long fetchedDate, String url, String htmlContent) throws Exception {
        String pathName =  generateFolderName(language, cat) + getFileName(url, fetchedDate);
        saveStringToFile(htmlContent, pathName);
    }

    private String generateFolderName(String lang, String cat) {
        return baseFolder + "/" + lang + "/" + cat + "/";
    }


    private String getFileName(String pageUrl, long timestamp) {
        return getDomainFileFriendly(pageUrl) + "-" + Long.toString(timestamp) + ".txt";
    }

    private String getDomainFileFriendly(String url){

        Pattern pattern = Pattern.compile("^(?:https?://)?(?:[^@/\\n]+@)?(?:www\\.)?([^:/\\n]+)");
        Matcher matcher = pattern.matcher(url);
        if (matcher.find())
        {
            return matcher.group(1).replaceAll("\\.","_");
        }
        else
            return "";
    }

//    @VisibleForTesting
    private void saveStringToFile(String stringToWrite, String pathName) throws IOException {
        File file = new File(pathName);
        File folder = file.getParentFile();

        if(!folder.exists() && !folder.mkdirs()){
            throw new IOException("Couldn't create the storage folder: " + folder.getAbsolutePath() + " does it already exist ?");
        }

        FileWriter writer = new FileWriter(file);
        writer.write(stringToWrite);
        writer.flush();
        writer.close();
    }
}
