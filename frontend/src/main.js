// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import AsyncProperties from 'vue-async-properties'
import Vuetify from 'vuetify'
import colors from 'vuetify/es5/util/colors'
import 'vuetify/dist/vuetify.min.css'

import App from './App'
import router from './router'
import { hostname } from './utils'

Vue.filter('datestring', string => new Date(string).toLocaleString())
Vue.filter('shortstring', (s, length = 50) => (s && s.length > length) ? `${s.substring(0, length - 4)} ...` : s)
Vue.filter('domain', hostname)
Vue.filter('round', (val, digits = 2) => Math.round(val * 10 ** digits) / 10 ** digits)

Vue.use(AsyncProperties, { transform: null })
Vue.use(Vuetify, {
  theme: {
    primary: colors.red.darken2,
    error: colors.red.darken2,
    secondary: colors.blueGrey.lighten4,
    accent: colors.blueGrey.lighten1,
  }
})

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
