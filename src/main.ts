import Vue from 'vue'
import './plugins/axios'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'
// @ts-ignore
import { createProvider } from './vue-apollo.js'
import vuetify from './plugins/vuetify';
import VueGoogleCharts from 'vue-google-charts'

Vue.use(VueGoogleCharts)

Vue.config.productionTip = false

new Vue({
  router,
  store,

  // @ts-ignore
  apolloProvider: createProvider(),

  vuetify,
  render: h => h(App)
}).$mount('#app')
