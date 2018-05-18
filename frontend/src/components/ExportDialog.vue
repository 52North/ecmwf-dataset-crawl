<template>
  <v-dialog v-model="open" max-width="500px">
    <v-btn slot="activator" color="primary" flat>
      <v-icon>cloud_download</v-icon>&nbsp;&nbsp;Export
    </v-btn>
    <v-card>
      <v-card-title>
        <span class="headline">Export Results</span>
      </v-card-title>
      <v-card-text>
        <v-container grid-list-md>
          <v-layout wrap>
            <v-flex xs12 sm6>
              <v-select
                :items="formats"
                label="Format"
                v-model="format"
                required
              ></v-select>
            </v-flex>
            <v-flex xs12 sm6>
              <v-text-field
                v-model="numResults"
                label="Number of Results"
                placeholder="all"
              ></v-text-field>
            </v-flex>
          </v-layout>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="secondary" flat @click.native="open = false">Close</v-btn>
        <v-btn color="primary" flat @click.native="submit">Download</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: ['open'],

  data () {
    return {
      formats: ['CSV'],
      format: 'CSV',
      numResults: null,
    }
  },
  methods: {
    submit () {
      this.open = false
    },
  },
  name: 'ExportDialog',
}
</script>

<style scoped>
</style>
