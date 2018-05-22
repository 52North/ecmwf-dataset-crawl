<template>
  <v-container grid-list-xl :fill-height="!crawls.length">
    <v-layout column>
      <!-- crawl list -->
      <v-flex
        v-for="(crawl, i) in crawls"
        :key="i"
      >
        <v-card>
          <v-card-title>
            <h4 v-text="crawl.name" class="headline mr-2 mb-1"/>
            <v-chip label outline>Crawl&nbsp;ID:&nbsp;{{ crawl.id }}</v-chip>
            <v-tooltip right>
              <v-chip slot="activator" label outline color="green" v-if="!!crawl.completed">completed</v-chip>
              {{ crawl.completed | datestring }}
            </v-tooltip>
            <v-spacer></v-spacer>
            <span class="grey--text">started at {{ crawl.started | datestring }}</span>
          </v-card-title>

          <v-card-text class="crawldesc">
            <!-- languages -->
            <v-layout row algin-center>
              <v-flex sm3 md2 text-sm-right>
                <b>Languages:</b>
              </v-flex>
              <v-chip
                v-for="(lang, j) in crawl.languages"
                :key="j"
                label
                color="secondary"
              >
                {{ lang }}
              </v-chip>
            </v-layout>

            <!-- keyword groups -->
            <v-layout row align-center
              v-for="(keywordgroup, j) in crawl.keywordGroups"
              :key="j"
            >
              <v-flex sm3 md2 text-sm-right>
                <b v-if="j === 0">Keywords:</b>
              </v-flex>

              <v-flex xs4 sm3 md2 xl1>
                <v-checkbox class="translated" v-model="keywordgroup.translate" label="translated" disabled></v-checkbox>
              </v-flex>

              <v-flex xs5 sm6 md8 xl9>
                <v-chip
                  label
                  color="secondary"
                  v-for="(keyword, k) in keywordgroup.keywords"
                  :key="k"
                >
                  {{ keyword }}
                </v-chip>
              </v-flex>
            </v-layout>

            <!-- status counters -->
            <v-layout row align-center>
              <v-flex sm3 md2 text-sm-right><b>Seed Pages:</b></v-flex>
              <v-flex xs3 sm2 md1><v-chip>{{ crawl.seedUrls.length }}</v-chip></v-flex>
              <v-flex>
                <b>Results:</b>
                <v-chip>{{ crawl.resultCount }}</v-chip>
              </v-flex>
            </v-layout>
          </v-card-text>

          <v-card-actions justify-end>
            <v-spacer/>
            <v-btn flat color="secondary" v-if="!crawl.completed">stop crawl</v-btn>
            <v-btn flat color="accent">view results</v-btn>
            <v-btn flat color="red">delete results</v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>

      <!-- no crawls hint -->
      <v-layout class="grey--text" column justify-center align-center v-if="!crawls.length">
          <h1 class="headline">No Crawls Found! :^(</h1>
          <router-link class="subheading" :to="{ name: 'New Crawl' }">start by creating a new crawl</router-link>
      </v-layout>

      <!-- new crawl fab -->
      <v-btn
        fab
        dark
        color="primary"
        fixed
        bottom
        right
        :to="{ name: 'New Crawl' }"
      >
        <v-icon>add</v-icon>
      </v-btn>

    </v-layout>
  </v-container>
</template>

<script>
import { getCrawls } from '@/api'

export default {
  asyncData: {
    crawls: getCrawls
  },
  name: 'CrawlList',
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<!-- Use >>> to override style child components -->
<style scoped>
.translated >>> .input-group__details {
  min-height: 0px;
  padding: 0px;
}
</style>
