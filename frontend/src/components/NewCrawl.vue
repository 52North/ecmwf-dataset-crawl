<template>
  <v-container grid-list-xl>
      <v-layout column>
        <v-flex
          v-for="(crawl, i) in crawls"
          :key="i"
        >
          <v-card>
            <v-tooltip attach="this">
              <v-card-title slot="activator">
                <h4 v-text="crawl.name" class="headline mr-2 mb-1"/>
                <v-chip label outline color="green" v-if="!!crawl.completed">completed</v-chip>
                <v-spacer></v-spacer>
                <span color="gray">started at {{ new Date(crawl.started).toLocaleString() }}</span>
              </v-card-title>

              <span>Crawl&nbsp;ID:&nbsp;{{ crawl.id }}</span>
            </v-tooltip>

            <v-card-text>
              <v-layout row>
              <!-- languages -->
                <v-flex sm3 md2 text-sm-right>
                  <b>Languages:</b>
                </v-flex>
                <v-chip
                  v-for="(lang, j) in crawl.languages"
                  :key="j"
                  label
                  color="blue"
                >
                  {{ lang }}
                </v-chip>
              </v-layout>

              <!-- keyword groups -->
              <v-layout row>
                <v-flex sm3 md2 text-sm-right>
                  <b>Keywords:</b>
                </v-flex>

                <v-container>
                  <!-- FIXME: proper layouting -->
                  <v-flex
                    v-for="(keywordgroup, j) in crawl.keywordgroups"
                    :key="j"
                  >
                    <v-chip
                      label
                      color="blue"
                      v-for="(keyword, k) in keywordgroup.keywords"
                      :key="k"
                    >
                      {{ keyword }}
                    </v-chip>
                  </v-flex>
                </v-container>
              </v-layout>
            </v-card-text>

            <v-card-actions>
              <v-btn flat color="gray" v-if="!crawl.completed">stop crawl</v-btn>
              <v-btn flat color="blue">view results</v-btn>
              <v-btn flat color="red">delete results</v-btn>
            </v-card-actions>
          </v-card>
        </v-flex>
      </v-layout>
  </v-container>
</template>

<script>
const crawls = [
  {
    name: 'TestCrawl',
    id: 1,
    languages: ['de', 'en'],
    keywordgroups: [
      {
        translate: false,
        keywords: ['blonk', 'asdf', 'foo', 'bar'],
      },
      {
        translate: true,
        keywords: ['dies', 'das'],
      }
    ],
    started: '2018-05-16T14:14:14Z',
    completed: '2018-05-16T18:18:18Z',
  }
]

crawls.push(...crawls)
crawls.push(...crawls)

export default {
  data () {
    return {
      crawls
    }
  },
  name: 'App'
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.card__title span {
  color: 'grey';
}
</style>
