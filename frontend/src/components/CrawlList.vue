<template>
  <v-container grid-list-xl :fill-height="!crawls.length">
    <v-layout column>

      <v-snackbar
        v-model="snackbar.status"
        :color="snackbar.type"
        multi-line
        top
        :timeout="8000"
      >
        {{ snackbar.text }}
        <v-btn dark flat @click="snackbar.status = false">Close</v-btn>
      </v-snackbar>

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
            <span class="grey--text" v-if="crawl.started">started at {{ crawl.started | datestring }}</span>
          </v-card-title>

          <v-card-text class="crawldesc">
            <!-- countries -->
            <v-layout row align-center>
              <v-flex sm3 md2 text-sm-right>
                <b>Countries:</b>
              </v-flex>
              <v-flex>
                <v-chip
                  v-for="(lang, j) in crawl.countries"
                  :key="j"
                  label
                  color="accent"
                >
                  {{ lang }}
                </v-chip>
              </v-flex>
            </v-layout>

            <!-- keyword groups -->
            <v-layout row align-center
              v-for="(keywordgroup, j) in crawl.processedKeywords"
              :key="j"
            >
              <v-flex sm3 md2 text-sm-right>
                <b v-if="j === 0">Keywords:</b>
              </v-flex>

              <v-flex xs2 sm1>
                <v-chip label color="accent">{{ keywordgroup.language }}</v-chip>
              </v-flex>

              <v-flex xs7 sm8 md9>
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
            <v-layout row align-center v-if="crawl.seedUrls">
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
            <v-btn flat color="grey" v-if="!crawl.completed" @click.stop="stopCrawl(crawl)">stop crawl</v-btn>
            <v-btn flat color="blue" :to="{ name: 'Search Results', query: { crawls: crawl.id } }">view results</v-btn>
            <v-btn flat color="red" @click.stop="deleteResults(crawl)">delete results</v-btn>
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
import { getCrawls, stopCrawl, deleteResults } from '@/api'

export default {
  mounted () {
    this.snackbar = {
      text: this.$route.params.info,
      type: 'accent',
      status: !!this.$route.params.info,
    }
  },
  data () {
    return {
      crawls: [],
      snackbar: {
        text: '',
        type: 'info',
        status: false,
      },
      infoOpen: !!this.$route.params.info,
      error: '',
      errorOpen: false,
    }
  },
  asyncData: {
    crawls: getCrawls
  },
  methods: {
    async stopCrawl (crawl) {
      try {
        await stopCrawl(crawl)
        crawl.completed = new Date()
        this.snackbar = {
          text: `Stopped Crawl ${crawl.name}`,
          type: 'info',
          status: true,
        }
      } catch (e) {
        const msg = e.response.data
        this.snackbar = {
          text: `Could not stop crawl ${crawl.name}: ${msg}`,
          type: 'error',
          status: true,
        }
      }
    },
    async deleteResults (crawl) {
      try {
        const res = await deleteResults({ crawls: [crawl.id] })
        this.snackbar = {
          text: `Deleted ${res.deleted} Search Results`,
          type: 'info',
          status: true,
        }
      } catch (e) {
        const msg = e.response.data
        this.snackbar = {
          text: `Could not delete results: ${msg}`,
          type: 'error',
          status: true,
        }
      }
    },
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
