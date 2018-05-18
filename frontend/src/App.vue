<template>
  <v-app>
    <v-navigation-drawer
      persistent
      fixed
      :mini-variant="!drawerExpanded"
      v-model="drawer"
      width="280"
      app
    >
      <v-list :class="{'list-border-bottom' : !drawerExpanded}">
        <v-list-tile>
          <v-list-tile-action v-if="drawerExpanded">
            <v-icon large color="primary">blur_circular</v-icon>
          </v-list-tile-action>
          <v-list-tile-content v-if="drawerExpanded">
            <v-list-tile-title><h2>WeatherCrawl</h2></v-list-tile-title>
          </v-list-tile-content>
          <v-list-tile-action>
            <v-btn icon @click.stop="drawerExpanded = !drawerExpanded">
              <v-icon v-html="drawerExpanded ? 'chevron_left' : 'chevron_right'"></v-icon>
            </v-btn>
          </v-list-tile-action>
        </v-list-tile>
        <v-divider></v-divider>

        <v-tooltip right
          :disabled="drawerExpanded"
          v-for="(route, i) in routes"
          :key="i"
        >
          <v-list-tile slot="activator" exact :to="{ name: route.name }">
            <v-list-tile-action>
              <v-icon v-html="route.icon"></v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title v-text="route.name"/>
            </v-list-tile-content>
          </v-list-tile>

          {{ route.name }}
        </v-tooltip>
      </v-list>
    </v-navigation-drawer>

    <span
      class="mobile-drawer hidden-lg-and-up"
      :style="{position: route.name == 'Search Results' ? 'absolute' : 'relative'}"
    >
      <v-btn flat @click.stop="drawer = !drawer">
        <v-icon>menu</v-icon>
      </v-btn>
    </span>

    <v-content>
      <router-view/>
    </v-content>
    <!-- <v-footer app>
      <span>&copy; 2018 &mdash; developed during ECMWF SoWC</span>
    </v-footer> -->
  </v-app>
</template>

<script>
import { routes } from '@/router'
export default {
  data () {
    return {
      drawer: true,
      drawerExpanded: true,
      routes,
      title: 'ECMWF Dataset Webcrawler'
    }
  },
  computed: {
    route () { return this.$route },
  },
  name: 'App'
}
</script>

<style scoped>
.mobile-drawer {
  /* position: absolute; */
  top: 0;
  left: 0;
}

.mobile-drawer >>> .btn {
  z-index: 3;
  min-width: 36px;
}
</style>
