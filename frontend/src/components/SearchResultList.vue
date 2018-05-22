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
              v-model="filter"
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
              tags
              chips
              deletable-chips
              v-model="selectedCrawls"
              :items="allCrawls"
              @blur="selectedCrawls = cleanCrawlInput(selectedCrawls)"
              label="Filter by Crawl"
              placeholder="all"
            />
            <export-dialog :results="results"/>
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
          hide-actions
          class="elevation-3"
        >
          <template slot="items" slot-scope="props">
            <td>{{ props.item.url | domain }}</td>
            <td class="text-xs-right">{{ props.item.scores.dataset }}</td>
            <td class="text-xs-right">{{ props.item.scores.dataportal }}</td>
            <td>{{ props.item.metadata.contact }}</td>
          </template>
        </v-data-table>
      </v-card>
    </v-container>
  </v-flex>
</template>

<script>
import ExportDialog from '@/components/ExportDialog'
import { getResults } from '@/api'
import { arrayOfWords } from '@/utils'

const selectedCrawls = []
const allCrawls = [{
  text: 'Test Crawl',
  value: 1,
}]

export default {
  data () {
    return {
      selectedCrawls,
      allCrawls,
      filter: '',
      resultTable: [
        { text: 'Domain', value: 'domain', align: 'left' },
        { text: 'Dataset Score', value: 'scores.dataset', align: 'right' },
        { text: 'Dataportal Score', value: 'scores.dataportal', align: 'right' },
        { text: 'Contact', value: 'metadata.contact', sortable: false },
      ],
      searchExpanded: false,
    }
  },
  asyncComputed: {
    results: {
      get () {
        const params = {
          crawls: this.selectedCrawls,
          query: this.filter,
        }
        return getResults(params)
      },
      watch: 'filter',
      default: [],
    }
  },
  methods: {
    cleanCrawlInput: arrayOfWords,
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
