<template>
  <v-flex>
    <!-- fake header -->
    <v-toolbar color="primary" flat extended extension-height="100">
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
              :append-icon-cb="results$resolver"
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
            <v-container class="query-help">
              <v-subheader>Query Syntax</v-subheader>
              <v-container>
                By entering keywords you can search for terms within any field.
                You can subset the results to specific crawls through the select bar above.
                <br/>
                The search bar also supports advanced queries using
                <a target="_blank" href="https://www.elastic.co/guide/en/elasticsearch/reference/6.x/query-dsl-query-string-query.html#query-string-syntax">Lucene Query Syntax</a>.
                Fields you can query are:
              </v-container>
              <v-container>
                <v-btn round small @click="query += ' title:*'">title</v-btn>
                <v-btn round small @click="query += ' content:*'">content</v-btn>
                <v-btn round small @click="query += ' host:*'">host</v-btn>
                <v-btn round small @click="query += ' language:*'">language</v-btn>
                <v-btn round small @click="query += ' keywords:*'">keywords</v-btn>
                <v-btn round small @click="query += ' classification.auto:dataset'">classification.auto</v-btn>
                <v-btn round small @click="query += ' classification.confidence:*'">classification.confidence</v-btn>
                <v-btn round small @click="query += ' classification.manual:dataset'">classification.manual</v-btn>
                <v-btn round small @click="query += ' extracted.contact:*@*'">extracted.contact</v-btn>
                <v-btn round small @click="query += ' extracted.license:*'">extracted.license</v-btn>
                <v-btn round small @click="query += ' extracted.data_portal:*'">extracted.data_portal</v-btn>
                <v-btn round small @click="query += ' extracted.data_api:*'">extracted.data_api</v-btn>
              </v-container>
              <v-subheader>Example Queries</v-subheader>
                <v-container>
              <v-layout column>
                  <v-flex>
                    Only results in german, classified as data
                    <v-btn round small @click="query = 'classification.auto:dataset AND language:de'">classification.auto:dataset AND language:de</v-btn>
                  </v-flex>
                  <v-flex>
                    Manual Result classification:
                    <v-btn round small @click="query = 'classification.auto:* -classification.manual:*'">classification.auto:* -classification.manual:*</v-btn>
                  </v-flex>
                  <v-flex>
                    Manual Result classification (focussed):
                    <v-btn round small @click="query = 'classification.confidence:[-0.5 TO 0.5] -classification.manual:*'">classification.confidence:[-0.5 TO 0.5] -classification.manual:*</v-btn>
                  </v-flex>
                </v-layout>
              </v-container>
            </v-container>
          </v-flex>

        </v-card>
      </v-flex>
    </v-layout>

    <v-container>
      <!-- no results hint -->
      <v-layout
        class="grey--text"
        column
        justify-center
        align-center
      >
        <v-flex v-if="!results$pending && !results$loading">
          <h1 v-if="!results.length" class="headline">No Results Found! :^(</h1>
          <p v-if="!results.length">refine your query, or <router-link class="subheading" :to="{ name: 'New Crawl' }">start a new crawl</router-link></p>
          <p v-if="results.length">{{ totalResults }} results found in {{ queryTime + 1 }}ms.</p>
        </v-flex>
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
          :rows-per-page-items="[25,50,100]"
        >
          <template slot="items" slot-scope="props">
            <tr @click="props.expanded = !props.expanded" :class="{ 'accent': props.expanded }" class="searchresult">
              <td>
                <v-tooltip bottom>
                  <v-btn fab small depressed
                    slot="activator"
                    :flat="props.item.classification.manual !== 'dataset'"
                    :color="(props.item.classification.auto === 'dataset' || props.item.classification.manual === 'dataset') ? 'success' : 'grey'"
                    :loading="manualLabelPending"
                    @click.stop="manualLabel(props.item, 'dataset')"
                  ><v-icon>thumb_up</v-icon></v-btn>
                  label this as "data"
                </v-tooltip>
                <v-tooltip bottom>
                  <v-btn fab small depressed
                    slot="activator"
                    :flat="props.item.classification.manual !== 'unrelated'"
                    :color="(props.item.classification.auto === 'unrelated' || props.item.classification.manual === 'unrelated') ? 'error' : 'grey'"
                    :loading="manualLabelPending"
                    @click.stop="manualLabel(props.item, 'unrelated')"
                  ><v-icon>thumb_down</v-icon></v-btn>
                  label this as "unrelated"
                </v-tooltip>
                <v-tooltip bottom>
                  <v-btn slot="activator" fab small flat @click.stop="" :href="props.item.url" target="_blank"><v-icon>link</v-icon></v-btn>
                  open page in new tab
                </v-tooltip>
                <v-tooltip bottom>
                  <v-btn slot="activator" fab small flat v-if="props.item.language !== 'en'" @click.stop="openTranslationUrl(props.item)"><v-icon>translate</v-icon></v-btn>
                  open translated page
                </v-tooltip>
              </td>
              <td>{{ props.item.title | shortstring(80) }}</td>
              <td>{{ props.item.url | domain }}</td>
              <td>
                <v-chip small :key="keyword" v-for="keyword in props.item.keywords" v-if="keyword">
                  {{ keyword | shortstring(40) }}
                </v-chip>
              </td>
            </tr>
          </template>

          <!-- display additional information in expand panel -->
          <template slot="expand" slot-scope="props">
            <v-card color="secondary" class="result-details">
              <v-card-text>
                <v-layout justify-space-around wrap>
                  <v-flex v-if="props.item.language">
                    <v-subheader>Language</v-subheader>
                    <v-container>
                      {{ props.item.language }}
                    </v-container>
                  </v-flex>
                  <v-flex v-if="props.item.classification.auto">
                    <v-subheader>Label</v-subheader>
                    <v-container>
                      {{ props.item.classification.auto }} (confidence: {{ props.item.classification.confidence | round }})
                    </v-container>
                  </v-flex>
                </v-layout>

                <v-layout justify-space-around wrap>
                  <v-flex v-if="props.item.extracted.data_portal">
                    <v-subheader>Dataportal</v-subheader>
                    <v-container>
                      {{ props.item.extracted.data_portal.join(', ') | shortstring(60) }}
                    </v-container>
                  </v-flex>
                  <v-flex v-if="props.item.extracted.data_pdf">
                    <v-subheader>PDF Data</v-subheader>
                    <v-container>
                      <ul>
                        <li v-for="link in props.item.extracted.data_pdf" :key="link"><a :href="link">{{ link | shortstring(100) }}</a></li>
                      </ul>
                    </v-container>
                  </v-flex>
                  <v-flex v-if="props.item.extracted.data_link">
                    <v-subheader>Data Link</v-subheader>
                    <v-container>
                      <ul>
                        <li v-for="link in props.item.extracted.data_link" :key="link"><a :href="link">{{ link | shortstring(100) }}</a></li>
                      </ul>
                    </v-container>
                  </v-flex>
                  <v-flex v-if="props.item.extracted.data_api">
                    <v-subheader>Data API</v-subheader>
                    <v-container>
                      <ul>
                        <li v-for="link in props.item.extracted.data_api" :key="link"><a :href="link">{{ link | shortstring(100) }}</a></li>
                      </ul>
                    </v-container>
                  </v-flex>
                </v-layout>

                <v-layout justify-space-around wrap>
                  <v-flex v-if="props.item.extracted.contact">
                    <v-subheader>Contact</v-subheader>
                    <v-container>
                      {{ props.item.extracted.contact.toString() | shortstring(180) }}
                    </v-container>
                  </v-flex>
                  <v-flex v-if="props.item.extracted.license">
                    <v-subheader>License</v-subheader>
                    <v-container>
                      {{ props.item.extracted.license.toString() | shortstring(180) }}
                    </v-container>
                  </v-flex>
                </v-layout>
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
import { getResults, getCrawls, classifyResults } from '@/api'

export default {
  props: {
    query: { default: () => [] },
    crawls: { default: () => [] },
  },
  data () {
    return {
      manualLabelPending: false,
      allCrawls: [],
      pagination: {}, // set through data table
      totalResults: 0,
      queryTime: 0,
      resultTable: [
        { width: '290px', sortable: false }, // placeholder for the buttons in each row
        { text: 'Title', value: 'title', align: 'left', sortable: false },
        { text: 'Host', value: 'host', align: 'left', sortable: false },
        { text: 'Keywords', value: 'keywords', align: 'left', sortable: false },
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
        return getResults(params).then(({ total, took, hits }) => {
          this.totalResults = total
          this.queryTime = took
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
    },
    openTranslationUrl (resultItem) {
      const { url, language } = resultItem
      window.open(`https://translate.google.com/translate?hl=en&sl=${language}&tl=en&u=${encodeURI(url)}`)
    },
    async manualLabel (resultItem, label) {
      // IDEA: submit manual labels in batches every 5 seconds so user is not interupted as often
      resultItem.classification.manual = undefined
      this.manualLabelPending = true
      try {
        await classifyResults([resultItem.url], label)
        resultItem.classification.manual = label
      } finally {
        this.manualLabelPending = false
      }
    },
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

.result-details li {
  list-style-type: none;
}

.query-help button {
  text-transform: none;
}
</style>
