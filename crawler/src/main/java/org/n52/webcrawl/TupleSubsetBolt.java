package org.n52.webcrawl;

import java.util.ArrayList;
import java.util.Map;

import org.apache.storm.task.OutputCollector;
import org.apache.storm.task.TopologyContext;
import org.apache.storm.topology.OutputFieldsDeclarer;
import org.apache.storm.topology.base.BaseRichBolt;
import org.apache.storm.tuple.Fields;
import org.apache.storm.tuple.Tuple;


public class TupleSubsetBolt extends BaseRichBolt {

    protected String[] fields;
    protected OutputCollector collector;

    public TupleSubsetBolt(String[] fields) {
        super();
        this.fields = fields;
    }

    @Override
    public void execute(Tuple input) {
        ArrayList<Object> output = new ArrayList<>(this.fields.length);
        for (String fieldName : this.fields) {
            output.add(input.getValueByField(fieldName));
        }

        collector.emit(output);
        collector.ack(input);
    }

    @Override
    public void declareOutputFields(OutputFieldsDeclarer declarer) {
        declarer.declare(new Fields(fields));
    }

    @Override
    public void prepare(Map stormConf, TopologyContext context, OutputCollector collector) {
        this.collector = collector;
    }

}
