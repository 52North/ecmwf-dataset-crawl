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

    <!-- results TODO: extract in separate component, use v-data-iterator for pagination etc? -->
    <v-container v-if="!!results.length">
      <v-card>
        <v-data-table
          :headers="resultTable"
          :items="results"
          item-key="url"
          class="elevation-3"
        >
          <template slot="items" slot-scope="props">
            <tr @click="props.expanded = !props.expanded">
              <td>{{ props.item.title.substring(0, 50) }}</td>
              <td>{{ props.item.url | domain }}</td>
              <td class="text-xs-right">{{ props.item.scores.dataset }}</td>
              <td class="text-xs-right">{{ props.item.scores.dataportal }}</td>
            </tr>
          </template>
          <template slot="expand" slot-scope="props">
            <v-card dense color="secondary">
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

// TODO: server side pagination https://vuetifyjs.com/en/components/data-tables#example-server

export default {
  props: {
    query: { default: () => [] },
    crawls: { default: () => [] },
  },
  data () {
    return {
      allCrawls: [],
      resultTable: [
        { text: 'Title', value: 'title', align: 'left' },
        { text: 'Domain', value: 'domain', align: 'left' },
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

        const params = {
          crawls: this.crawls,
          query: this.query,
        }
        this.updateUrl()
        return getResults(params)
      },
      watch: 'query',
      watchClosely: 'crawls',
      default: [],
    }
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
.card--flex-toolbar {
  margin-top: -40px;
}

.card--flex-toolbar .input-group {
  margin-right: 16px;
}
</style>
