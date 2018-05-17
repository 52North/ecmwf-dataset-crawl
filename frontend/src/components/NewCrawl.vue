<template>
  <v-container grid-list-xl>
    <v-form ref="form" v-model="valid">

      <v-layout column>
        <!-- header -->
        <v-flex>
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
                    Each Keyword Group may be translated into the selected languages.
                  </v-list-tile>
                </v-list>
              </v-flex>
            </v-card-title>
          </v-card>
        </v-flex>

        <!-- keywords -->
        <v-flex>
          <v-card>
            <v-card-title>
              <v-flex>
                <h4 class="headline">Keywords</h4>
              </v-flex>
            </v-card-title>
            <v-card-text>
              <v-layout row wrap>
                <v-flex xs8 sm9 md10 xl12>
                  <v-select
                    tags
                    chips
                    deletable-chips
                    v-model="commonKeywords.keywords"
                    @blur="commonKeywords.keywords = cleanKeywordInput(commonKeywords.keywords)"
                    label="Common Keywords"
                  />
                </v-flex>
                <v-flex xs4 sm3 md2 xl1>
                  <v-checkbox class="translated" v-model="commonKeywords.translate" label="translate"></v-checkbox>
                </v-flex>
              </v-layout>

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
                    @blur="group.keywords = cleanKeywordInput(group.keywords)"
                    :label="'Keyword Group ' + (i + 1)"
                  />
                </v-flex>
                <v-flex xs4 sm3 md2 xl1>
                  <v-checkbox class="translated" v-model="group.translate" label="translate"></v-checkbox>
                </v-flex>
              </v-layout>
              <v-flex>
                <v-btn @click="addKeywordGroup">
                  <v-icon>add</v-icon>
                  add Keyword Group
                </v-btn>
              </v-flex>
            </v-card-text>
          </v-card>
        </v-flex>

        <!-- languages TODO: map view -->
        <v-flex>
          <v-card>
            <v-card-title>
              <v-flex>
                <h4 class="headline">Languages</h4>
              </v-flex>
            </v-card-title>
            <v-card-text>
              <v-flex>
                <v-select
                  multiple
                  :items="availableLanguages"
                  v-model="languages"
                />
              </v-flex>
            </v-card-text>
          </v-card>
        </v-flex>

        <!-- crawl config -->
        <v-flex>
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
                    :rules="[v => !!v || 'required']"
                    label="Crawl Name"
                    required
                  />
                  <v-text-field
                    v-model="domains.whitelist"
                    label="Domain Whitelist"
                    multi-line
                    :placeholder="'landsat.usgs.gov'"
                  />
                  <v-text-field
                    v-model="domains.blacklist"
                    label="Domain Blacklist"
                    multi-line
                    :placeholder="'example.com\necmwf.int'"
                  />
              </v-flex>

              <v-layout row wrap>
                <v-flex>
                  <v-slider
                    v-model="crawldepth"
                    thumb-label
                    label="Crawl Depth (Recursion)"
                    min="0"
                    max="10"
                    required
                  />
                </v-flex>
                <v-flex xs3 md1>
                  <v-text-field
                    v-model="crawldepth"
                    type="number"
                    :rules="[v => !!v || 'required']"
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
            </v-card-text>
          </v-card>
        </v-flex>

      </v-layout>

      <v-layout row justify-center>
        <v-btn large @click="submit" :disabled="!valid" color="blue">
          <v-icon>flight_takeoff</v-icon>&nbsp;&nbsp;&nbsp;&nbsp;launch crawl
        </v-btn>
      </v-layout>

    </v-form>
  </v-container>
</template>

<script>
export default {
  data () {
    return {
      valid: false,
      name: '',
      crawldepth: 3,
      seedurls: 10,
      domains: {
        blacklist: '',
        whitelist: '',
      },
      commonKeywords: {
        keywords: ['hello', 'world'],
        translate: false,
      },
      keywordGroups: [
        {
          keywords: ['foo'], translate: false,
        }
      ],
      languages: ['en'],
      availableLanguages: [{
        text: 'German',
        value: 'de',
      }, {
        text: 'English',
        value: 'en',
      }]
    }
  },
  methods: {
    cleanKeywordInput (keywords) {
      // make shure each item contains a single word and not empty strings
      const cleaned = keywords.map(v => v.trim().split(' '))
      return [].concat(...cleaned).filter(v => !!v)
    },
    addKeywordGroup () {
      this.keywordGroups.push({
        keywords: [],
        translate: false
      })
    },
    submit () {
      if (!this.$refs.form.validate()) return

      const {
        name,
        languages,
        commonKeywords,
        keywordGroups,
        domains,
        seedurls,
        crawldepth,
      } = this.$data

      const crawlRequest = {
        name,
        languages,
        commonKeywords,
        keywordGroups,
        domains,
        seedurls,
        crawldepth,
      }

      return crawlRequest
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
