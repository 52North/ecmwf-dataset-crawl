<template>
  <v-container grid-list-xl>
    <v-alert
      :value="true"
      color="info"
      outline
      icon="info"
    >
      For metrics to be shown here, you have to first set up <a :href="kibanaHost" target="_blank">Kibana</a>. Please check out the project readme for a how-to.
    </v-alert>

    <v-layout column>
      <v-flex>
        <h1>Result Distribution</h1>
        <iframe
          :src="`${kibanaHost}/app/kibana#/dashboard/crawl-results-dash?embed=true&_g=(${dashboardConf})`"
          height="1600px"
          width="100%"
        >

          <v-alert>For metrics to be shown here, you have to first set up kibana. Please check out the project readme for a how-to.</v-alert>
        </iframe>
      </v-flex>
      <v-flex>
        <h1>Classifier Metrics</h1>
        <iframe
          :src="`${kibanaHost}/app/kibana#/dashboard/classifier-metrics-dash?embed=true&_g=(${dashboardConf})`"
          height="1500px"
          width="100%"
        ></iframe>
      </v-flex>
      <v-flex>
        <h1>Crawler Performance</h1>
        <iframe
          :src="`${kibanaHost}/app/kibana#/dashboard/crawl-metrics-dash?embed=true&_g=(${dashboardConf})`"
          height="1600px"
          width="100%"
        ></iframe>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  data () {
    return {
      kibanaHost: process.env.KIBANA_URL,
      dashboardConf: encodeURIComponent("refreshInterval:('$$hashKey':'object:225',display:'30 seconds',pause:!f,section:1,value:30000),time:(from:now-1h,mode:quick,to:now)"),
    }
  },
  name: 'CrawlerMetrics',
}
</script>

<style scoped>
h1 {
  margin-top: 30px;
  margin-bottom: 10px;
}
iframe {
  border: none;
  -webkit-box-shadow: 0px 0px 5px 0px rgba(50, 50, 50, 0.3);
  -moz-box-shadow:    0px 0px 5px 0px rgba(50, 50, 50, 0.3);
  box-shadow:         0px 0px 5px 0px rgba(50, 50, 50, 0.3);
}
</style>
