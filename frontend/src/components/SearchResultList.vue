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

            <v-tooltip bottom :disabled="searchExpanded">
              <v-btn slot="activator" icon @click.stop="searchExpanded = !searchExpanded">
                <v-icon v-html="searchExpanded ? 'expand_less' : 'expand_more'"/>
              </v-btn>
              More Options &amp; Export
            </v-tooltip>
          </v-toolbar>

          <v-toolbar card v-if="searchExpanded">
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
        </v-card>
      </v-flex>
    </v-layout>

    <v-container>
      <v-layout column v-if="!results.length">
        <v-layout class="grey--text" column justify-center align-center>
            <h1 class="headline">No Results Found! :^(</h1>
        </v-layout>
      </v-layout>

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
      searchExpanded: true,
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
    return this.results$now()
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
