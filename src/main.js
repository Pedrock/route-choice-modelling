/* eslint-disable no-underscore-dangle */
// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'element-ui/lib/theme-default/index.css';
import ElementUI from 'element-ui';
import locale from 'element-ui/lib/locale/lang/en';
import Vue from 'vue';
import axios from 'axios';
import VueAxios from 'vue-axios';
import VueProgressBar from 'vue-progressbar';
import App from './App';
import router from './router';
import store from './store/store';

Vue.config.productionTip = false;

Vue.use(ElementUI, { locale });

Vue.use(VueAxios, axios);
Vue.axios.defaults.baseURL = '/api/';

Vue.use(VueProgressBar, {
  color: '#20a0ff',
  failedColor: '#E74C3C',
});

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  router,
  render: h => h(App),
  components: { App },
});
