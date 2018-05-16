<template>
  <v-app>
    <v-navigation-drawer
      permanent
      persistent
      :clipped="drawerClipped"
      :mini-variant="drawerExpanded"
      fixed
      width="250"
      app
    >
      <v-list>
        <v-list-tile :to="{ name: route.name }"
          value="true"
          v-for="(route, i) in routes"
          :key="i"
        >
          <v-tooltip right :disabled="!drawerExpanded">
            <v-list-tile-action slot="activator">
              <v-icon v-html="route.icon"></v-icon>
            </v-list-tile-action>
            <span>{{ route.name }}</span>
          </v-tooltip>
          <v-list-tile-content>
            <v-list-tile-title v-text="route.name"/>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar app :clipped-left="drawerClipped">
      <v-toolbar-side-icon @click.stop="drawerExpanded = !drawerExpanded"/>
      <v-toolbar-title v-text="title"/>
      <v-spacer></v-spacer> <!-- buttons after this will be right aligned -->
    </v-toolbar>
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
      drawerClipped: true,
      drawerExpanded: false,
      routes,
      title: 'ECMWF Dataset Webcrawler'
    }
  },
  name: 'App'
}
</script>
