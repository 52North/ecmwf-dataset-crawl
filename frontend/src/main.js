// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import Vuetify from 'vuetify'
import colors from 'vuetify/es5/util/colors'
import 'vuetify/dist/vuetify.min.css'

Vue.filter('datestring', string => new Date(string).toLocaleString())

Vue.use(Vuetify, {
  theme: {
    primary: colors.red.darken2,
    secondary: colors.blueGrey.lighten2,
    accent: colors.blue.darken1,
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
