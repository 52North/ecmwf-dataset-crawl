package org.n52.webcrawl;

import com.digitalpebble.stormcrawler.Metadata;
import com.digitalpebble.stormcrawler.bolt.JSoupParserBolt;
import com.digitalpebble.stormcrawler.parse.ParsingTester;
import org.junit.Before;
import org.junit.Test;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.Assert.*;

public class XPath3ParsefiltersTest extends ParsingTester {
    Map<String, String[]> expectedMd = new HashMap<>();

    @Before
    public void setupExpectedResults() {
        expectedMd.put("parse.title",
                new String[] {
                        "ThePageTitle1",
                        "ThePageTitle2"
                });
        expectedMd.put("parse.keywords",
                new String[]{
                        "Offene Daten, Open Data, Open.NRW, Nordrhein-Westfalen"
                });
        expectedMd.put("topics.data.portal.xpath",
                new String[] {
                        "ckan 2.0.1",
                        "CKAN - Datensatzdetails",
                        "DKAN",
                        "Geoportal Sachsenatlas",
                        "document.write('<link rel=\"stylesheet\" href=\"release/entryscape-catalog-portal/style.css\"/>');"
                });
        expectedMd.put("topics.data.api.xpath",
                new String[]{
                        "https://geoservices.julius-kuehn.de/geoserver/oeko/wms?VERSION=1.3.0&REQUEST=GetCapabilities&SERVICE=WMS",
                        "http://sg.geodatenzentrum.de/wmts_topplus_web_open/1.0.0/WMTSCapabilities.xml?REQUEST=GetCapabilities&SERVICE=WMTS",
                        "https://geoservices.julius-kuehn.de/geoserver/oeko/wfs?VERSION=1.1.0&REQUEST=GetCapabilities&SERVICE=WFS",
                        "WMS-Capabilities: Anbaugebiete des ökologischen Anbaus (WMS)",
                        " WMTS-Capabilities: WMTS TopPlus-Web-Open",
                        "WFS",
                        "Mit Hillfe des WFS-Dienstes und dem WMS-Dienstes \"Bebauungsplan\" können die Daten über rechtskräftige und im Aufstellungsverfahren befindliche Bebauungspläne, Veränderungssperren und weitere Satzungen abgerufen werden.",
                        "Link des WMS-Dienstes:",
                        "https://gdi.gelsenkirchen.de/wss/service/WMSBebauungsplan/guest",
                        "Download-Link des WFS-Dienstes:",
                        "https://gdi.gelsenkirchen.de/wss/service/WFSBebauungsplan/guest",
                        "http://sg.geodatenzentrum.de/wmts_topplus_web_open/1.0.0/WMTSCapabilities.xml?REQUEST=GetCapabilities&SERVICE=WMTS"
                });
        expectedMd.put("topics.data.link.xpath",
                new String[] {
                        "{\"@context\":\"http://schema.org\",\"@type\":\"Dataset\",\"name\":\"Diesdas\",\"includedInDataCatalog\":{\"@type\":\"DataCatalog\",\"url\":\"https://data.gov.uk\"}}",
                        "{\"@type\":\"schema:Dataset\",\"name\":\"TestData\"}",
                        "{\"@type\":\"http://schema.org/Dataset\",\"name\":\"TestData\"}",
                        "{\"@context\":\"http://schema.org\",\"@type\":\"DataCatalog\",\"url\":\"https://data.gov.uk\"}",

                        "http://example.com/a-dataset-link",
                        "http://example.com/rivers.json",
                        "http://example.com/riverdataset.zip",
                        "http://example.com/mydata?format=csv",
                });
        expectedMd.put("topics.contact.xpath",
                new String[] {
                        "max@mustermann.de",
                        "Contact: max@mustermann.de",
                });
    }

    @Before
    public void setupParserBolt() {
        bolt = new JSoupParserBolt();
        setupParserBolt(bolt);
    }

    @Test
    public void checkMetadata() throws IOException {
        Map config = new HashMap();
        prepareParserBolt("parsefilters.json", config); // use parsefilters from src/main/resources
        parse("https://example.com", "xpath3.testpage.html");

        List<List<Object>> tuples = output.getEmitted();
        assertEquals(1, tuples.size());
        Metadata md = (Metadata) tuples.get(0).get(2);

        System.out.println(md.toString());

        String exp, act;
        for (String key : expectedMd.keySet()) {
            exp = String.join(", ", expectedMd.get(key));
            if (md.getValues(key) == null)
                act = "";
            else
                act = String.join(", ", md.getValues(key));

//            System.out.println(key + " expect:\t" + exp);
//            System.out.println(key + " actual:\t" + act);
            assertEquals(key, exp, act);
        }
    }
}