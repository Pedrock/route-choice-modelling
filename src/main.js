// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'element-ui/lib/theme-default/index.css';
import ElementUI from 'element-ui';
import locale from 'element-ui/lib/locale/lang/en';
import Vue from 'vue';
import App from './App';
import router from './router';
import store from './store/store';

Vue.config.productionTip = false;

Vue.use(ElementUI, { locale });

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  router,
  render: h => h(App),
  components: { App },
});
