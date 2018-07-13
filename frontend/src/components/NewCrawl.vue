<template>
  <v-container grid-list-xl>
    <v-form ref="form" v-model="valid">
      <v-stepper v-model="stepper">
        <v-stepper-header>
          <v-stepper-step step="1" :complete="stepper > 1">Keywords</v-stepper-step>
          <v-divider></v-divider>
          <v-stepper-step :complete="stepper > 2" step="2">Languages</v-stepper-step>
          <v-divider></v-divider>
          <v-stepper-step step="3">Settings</v-stepper-step>
        </v-stepper-header>

        <v-stepper-items>
          <!-- header -->
          <v-stepper-content step="1">
            <v-card tile>
              <v-card-title>
                <v-flex>
                  <h1 class="display-1">Configure and Launch a Crawl</h1>
                  <v-subheader>Submit a custom query to crawl more pages for datasets.</v-subheader>
                </v-flex>
                <v-flex>
                  <v-list dense>
                    <v-list-tile>
                      A Keyword Group specifies the search terms used for a web search to kickstart the crawl with seed URLs.
                    </v-list-tile>
                    <v-list-tile>
                      By adding more Keyword Groups, multiple search queries for the initial crawl sites can be added.
                    </v-list-tile>
                    <v-list-tile>
                      Each Keyword Group may be translated into the official language of the selected countries.
                    </v-list-tile>
                  </v-list>
                </v-flex>
              </v-card-title>
            </v-card>

            <!-- keywords -->
            <v-card>
              <v-card-title>
                <v-flex>
                  <h4 class="headline">Keywords</h4>
                </v-flex>
              </v-card-title>
              <v-card-text>
                <v-container>
                  <v-layout
                    v-for="(group, i) in keywordGroups"
                    :key="i"
                  >
                    <v-flex xs8 sm9 md10 xl12 >
                      <v-select
                        tags
                        chips
                        deletable-chips
                        v-model="group.keywords"
                        :label="'Keyword Group ' + (i + 1)"
                        required
                        :rules="[v => !!v.length || 'at least one keyword required']"
                      />
                    </v-flex>
                    <v-flex xs4 sm3 md2 xl1>
                      <v-checkbox class="translated" v-model="group.translate" label="translate"></v-checkbox>
                    </v-flex>
                  </v-layout>
                  <v-flex>
                    <v-btn @click="addKeywordGroup" color="accent">
                      <v-icon>add</v-icon>
                      add Keyword Group
                    </v-btn>
                  </v-flex>
                </v-container>
                <v-container>
                  <v-layout>
                    <v-flex xs8 sm9 md10 xl12>
                      <v-select
                        tags
                        chips
                        deletable-chips
                        v-model="commonKeywords.keywords"
                        label="Common Keywords"
                      />
                    </v-flex>
                    <v-flex xs4 sm3 md2 xl1>
                      <v-checkbox class="translated" v-model="commonKeywords.translate" label="translate"></v-checkbox>
                    </v-flex>
                  </v-layout>
                </v-container>
              </v-card-text>
            </v-card>

          </v-stepper-content>

          <!-- countries / languages TODO: map view -->
          <v-stepper-content step="2">
            <v-card>
              <v-card-title>
                <v-flex>
                  <h4 class="headline">Countries</h4>
                </v-flex>
              </v-card-title>
              <v-card-text>
                <v-flex>
                  <v-select
                    chips
                    deletable-chips
                    multiple
                    autocomplete
                    :items="availableCountries"
                    item-text="name"
                    item-value="iso3166_a2"
                    v-model="countries"
                  />
                </v-flex>
              </v-card-text>
            </v-card>
          </v-stepper-content>

          <!-- crawl config -->
          <v-stepper-content step="3">
            <v-card>
              <v-card-title>
                <v-flex>
                  <h4 class="headline">Crawler Configuration</h4>
                </v-flex>
              </v-card-title>
              <v-card-text>
                <v-flex>
                    <v-text-field
                      v-model="name"
                      :rules="stepValidators[3]"
                      label="Crawl Name"
                      required
                    />
                    <!-- hide white/blacklist, as this feature seems to be unfeasible atm
                    <v-text-field
                      v-model="domainWhitelist"
                      label="Domain Whitelist"
                      multi-line
                      :placeholder="'landsat.usgs.gov'"
                    />
                    <v-text-field
                      v-model="domainBlacklist"
                      label="Domain Blacklist"
                      multi-line
                      :placeholder="'example.com\necmwf.int'"
                    />
                    -->
                </v-flex>

                <v-container>
                  <v-layout row wrap>
                    <v-flex>
                      <v-slider
                        v-model="crawldepth"
                        thumb-label
                        label="Crawl Depth (Recursion)"
                        min="0"
                        max="5"
                      />
                    </v-flex>
                    <v-flex xs3 md1>
                      <v-text-field
                        v-model="crawldepth"
                        type="number"
                        :rules="[v =>  !isNaN(v) || 'required']"
                        required
                      />
                    </v-flex>
                    <v-flex>
                      <v-slider
                        v-model="seedurls"
                        thumb-label
                        label="Seed URLs per Keyword Group"
                        min="1"
                        max="100"
                      />
                    </v-flex>
                    <v-flex xs3 md1>
                      <v-text-field
                        v-model="seedurls"
                        type="number"
                        :rules="[v => !!v || 'required']"
                        required
                      />
                    </v-flex>
                  </v-layout>
                  <v-layout row wrap>
                    <v-flex>
                      <v-slider
                        v-model="terminationCondition.duration"
                        thumb-label
                        label="Terminate after (minutes)"
                        min="1"
                        max="600"
                      />
                    </v-flex>
                    <v-flex xs3 md1>
                      <v-text-field
                        v-model="terminationCondition.duration"
                        type="number"
                        min="1"
                      />
                    </v-flex>
                    <v-flex>
                      <v-slider
                        v-model="terminationCondition.resultCount"
                        thumb-label
                        label="Terminate after (number of results)"
                        min="1"
                        max="10000"
                      />
                    </v-flex>
                    <v-flex xs3 md1>
                      <v-text-field
                        v-model="terminationCondition.resultCount"
                        type="number"
                        min="1"
                      />
                    </v-flex>
                  </v-layout>
                </v-container>
              </v-card-text>
            </v-card>
          </v-stepper-content>

        </v-stepper-items>

      </v-stepper>

      <!-- back/next, launch buttons -->
      <v-container>
        <v-alert :value="!!error" dismissible outline color="error" icon="error" v-html="error"/>
        <v-layout row>
            <v-progress-linear
              v-if="loading"
              indeterminate
              height="3"
            ></v-progress-linear>
        </v-layout>
        <v-layout row justify-center>
            <v-btn large @click="stepper--" color="gray" v-if="stepper !== 1">back</v-btn>
            <v-btn large @click="stepper++" :disabled="!currentStepValid()" color="primary" v-if="stepper !== 3">next</v-btn>
            <v-btn large @click="submit" :disabled="!valid || loading" color="primary" v-if="stepper === 3">
              <v-icon>flight_takeoff</v-icon>&nbsp;&nbsp;&nbsp;&nbsp;launch crawl
            </v-btn>
        </v-layout>
      </v-container>

    </v-form>
  </v-container>
</template>

<script>
import { addCrawl, getCrawls, getCountries } from '@/api'

export default {
  data () {
    return {
      availableCountries: [],
      error: '',
      valid: false,
      loading: false,
      stepper: 1,
      stepValidators: {
        1: [() => this.keywordGroups.every(k => !!k.keywords.length) || 'at least one keyword required'],
        2: [],
        3: [() => !!this.name || 'crawl name is required'],
      },

      name: '',
      crawldepth: 2,
      seedurls: 20,
      domainBlacklist: '',
      domainWhitelist: '',
      commonKeywords: {
        keywords: [], translate: false,
      },
      keywordGroups: [
        { keywords: [], translate: true }
      ],
      countries: ['de'],
      terminationCondition: {
        duration: 180,
        resultCount: 5000,
      },
    }
  },
  asyncData: {
    availableCountries: getCountries,
  },
  methods: {
    addKeywordGroup () {
      this.keywordGroups.push({
        keywords: [],
        translate: true
      })
    },
    currentStepValid () {
      return this.stepValidators[this.stepper].every(x => x() === true)
    },
    async submit () {
      if (!this.$refs.form.validate()) return

      const {
        name,
        countries,
        commonKeywords,
        keywordGroups,
        domainWhitelist,
        domainBlacklist,
        seedurls,
        crawldepth,
        terminationCondition,
      } = this.$data

      const crawlRequest = {
        name,
        countries,
        commonKeywords,
        keywordGroups,
        crawlOptions: {
          recursion: crawldepth,
          seedUrlsPerKeywordGroup: seedurls,
          domainWhitelist: domainWhitelist.split('\n'),
          domainBlacklist: domainBlacklist.split('\n'),
          terminationCondition,
        },
      }

      try {
        this.loading = true
        await addCrawl(crawlRequest)
        await getCrawls(false)
        this.loading = false
        this.$emit('new-crawl')
        this.$router.push({ name: 'Crawls', params: { info: `Crawl ${name} started!` } })
      } catch (e) {
        this.loading = false
        this.error = e.response.data
        return false
      }
    },
  },
  name: 'NewCrawl',
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
