<template>
  <v-flex>
    <!-- fake header -->
    <v-toolbar color="primary" flat :extended="!results.length" extension-height="120">
      <v-spacer></v-spacer>
    </v-toolbar>

    <!-- toolbar -->
    <v-layout row pb-2>
      <v-flex xs8 offset-xs2>
        <v-card class="card--flex-toolbar">
          <v-toolbar card prominent>
            <v-text-field
              autofocus
              v-model="query"
              placeholder="Filter Results"
              append-icon="search"
              :loading="results$loading || results$pending"
              :append-icon-cb="results$now"
              hide-details
              single-line
              clearable
            ></v-text-field>

            <v-tooltip bottom :disabled="helpExpanded">
              <v-btn slot="activator" :style="!helpExpanded || { 'background-color': 'rgba(1,1,1,0.1)' }" icon @click.stop="helpExpanded = !helpExpanded">
                <v-icon>help_outline</v-icon>
              </v-btn>
              Query Syntax Help
            </v-tooltip>
          </v-toolbar>

          <!-- crawl selector -->
          <v-toolbar card>
            <v-select
              chips
              deletable-chips
              multiple
              autocomplete
              v-model="crawls"
              :items="allCrawls"
              item-text="name"
              item-value="id"
              @blur="updateUrl"
              label="Filter by Crawl"
              placeholder="all"
            />
            <export-dialog :crawls="crawls" :query="query"/>
          </v-toolbar>

          <!-- query help -->
          <v-flex v-if="helpExpanded">
            <v-container>
              <v-subheader>Query Syntax</v-subheader>
              <v-container>
                By entering keywords you can search for terms within the document title.
                You can subset the results to specific crawls separately.
                The search bar also supports advanced queries using
                <a target="_blank" href="https://www.elastic.co/guide/en/elasticsearch/reference/6.x/query-dsl-query-string-query.html#query-string-syntax">Lucene Query Syntax</a>.
                Fields you can query are:
              </v-container>
              <v-container>
                <v-btn round small @click="query += ' text:*'">text</v-btn>
                <v-btn round small @click="query += ' language:*'">language</v-btn>
                <v-btn round small @click="query += ' classify.class:*'">classify.class</v-btn>
                <v-btn round small @click="query += ' classify.confidence:*'">classify.confidence</v-btn>
                <v-btn round small @click="query += ' host:*'">host</v-btn>
                <v-btn round small @click="query += ' domain:*'">domain</v-btn>
                <v-btn round small @click="query += ' topics.contact:*'">topics.contact</v-btn>
              </v-container>
            </v-container>
          </v-flex>

        </v-card>
      </v-flex>
    </v-layout>

    <v-container mt-2>
      <!-- no results hint -->
      <v-layout
        class="grey--text"
        column
        justify-center
        align-center
        mt-3
        v-if="!results.length && !results$pending && !results$loading"
      >
        <h1 class="headline">No Results Found! :^(</h1>
        <p>refine your query, or <router-link class="subheading" :to="{ name: 'New Crawl' }">start a new crawl</router-link></p>
      </v-layout>

      <!-- results listing -->
      <v-card v-if="!!results.length">
        <v-data-table
          :headers="resultTable"
          :items="results"
          item-key="url"
          class="elevation-3"
          disable-initial-sort
          expand
          :pagination.sync="pagination"
          :total-items="totalResults"
          :rows-per-page-items="[25,50,100,200,{text: 'All', value: 10000}]"
        >
          <template slot="items" slot-scope="props">
            <tr @click="props.expanded = !props.expanded" class="searchresult">
              <td>{{ props.item.title | shortstring(80) }}</td>
              <td>{{ props.item.url | domain }}</td>
              <td class="text-xs-right">{{ props.item.scores.dataset }}</td>
              <td class="text-xs-right">{{ props.item.scores.dataportal }}</td>
            </tr>
          </template>
          <template slot="expand" slot-scope="props">
            <v-card dense color="secondary" v-if="props.item.metadata">
              <v-card-text>
                <v-subheader>Contact</v-subheader>
                <v-container>
                  {{ props.item.metadata.contact }}
                </v-container>
              </v-card-text>
            </v-card>
          </template>
        </v-data-table>
      </v-card>
    </v-container>
  </v-flex>
</template>

<script>
import ExportDialog from '@/components/ExportDialog'
import { getResults, getCrawls } from '@/api'

export default {
  props: {
    query: { default: () => [] },
    crawls: { default: () => [] },
  },
  data () {
    return {
      allCrawls: [],
      pagination: {}, // set through data table
      totalResults: 0,
      resultTable: [
        { text: 'Title', value: 'title', align: 'left', sortable: false },
        { text: 'Host', value: 'host', align: 'left' },
        { text: 'Dataset Score', value: 'scores.dataset', align: 'right' },
        { text: 'Dataportal Score', value: 'scores.dataportal', align: 'right' },
      ],
      helpExpanded: false,
    }
  },
  asyncData: {
    allCrawls: getCrawls,
  },
  asyncComputed: {
    results: {
      async get () {
        // catch retriggered requests (from this.updateUrl())
        if (this.results$pending || this.results$loading) {
          return
        }

        const { page, rowsPerPage } = this.pagination
        const params = {
          crawls: this.crawls,
          query: this.query,
          size: rowsPerPage,
          from: rowsPerPage * (page - 1) || 0,
        }

        this.updateUrl()
        return getResults(params).then(({ total, hits }) => {
          this.totalResults = total
          return hits
        })
      },
      watch: 'query',
      watchClosely: function () {
        this.crawls = this.crawls
        this.pagination = this.pagination
      },
      default: [],
    }
  },
  mounted () {
    return this.results$resolver()
  },
  methods: {
    updateUrl () {
      // warning: this retriggers the requests
      this.$router.replace({
        query: { crawls: this.crawls.join(','), q: this.query },
      })
    }
  },
  components: {
    'export-dialog': ExportDialog,
  },
  name: 'SearchResultList',
}
</script>

<style scoped>
/* header */
.card--flex-toolbar {
  margin-top: -40px;
}

.card--flex-toolbar .input-group {
  margin-right: 16px;
}

.searchresult {
  cursor: pointer;
}
</style>
