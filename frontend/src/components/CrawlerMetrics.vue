<template>
  <v-container grid-list-xl>
    <v-layout column>
      <v-flex>
        <h1>Crawler Performance</h1>
        <iframe
          :src="`${kibanaHost}/app/kibana#/dashboard/crawl-metrics-dash?embed=true&_g=(${dashboardConf})`"
          height="1600px"
          width="100%"
        ></iframe>
      </v-flex>
      <v-flex>
        <h1>Result Distribution</h1>
        <iframe
          :src="`${kibanaHost}/app/kibana#/dashboard/crawl-results-dash?embed=true&_g=(${dashboardConf})`"
          height="1600px"
          width="100%"
        ></iframe>
      </v-flex>
      <v-flex>
        <h1>Classifier Metrics</h1>
        <iframe
          :src="`${kibanaHost}/app/kibana#/dashboard/classifier-metrics-dash?embed=true&_g=(${dashboardConf})`"
          height="1500px"
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
      dashboardConf: "refreshInterval%3A('%24%24hashKey'%3A'object%3A225'%2Cdisplay%3A'30%20seconds'%2Cpause%3A!f%2Csection%3A1%2Cvalue%3A30000)%2Ctime%3A(from%3Anow-1h%2Cmode%3Aquick%2Cto%3Anow)",
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
