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


EventTarget.prototype.addEventListenerBase = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function addEventListener(type, listener, ...args) {
  this.addEventListenerBase(type, listener, ...args);
  if (type === 'keydown') {
    if (!this.EventList) { this.EventList = []; }
    if (!this.EventList[type]) { this.EventList[type] = []; }
    const list = this.EventList[type];
    for (let index = 0; index < list.length; index++) {
      if (list[index] === listener) { return; }
    }
    list.push(listener);
  }
};

EventTarget.prototype.removeEventListenerBase = EventTarget.prototype.removeEventListener;
EventTarget.prototype.removeEventListener = function removeEventListener(type, listener, ...args) {
  if (!this.EventList) { this.EventList = []; }
  if (listener instanceof Function) { this.removeEventListenerBase(type, listener, ...args); }
  if (!this.EventList[type]) { return; }
  const list = this.EventList[type];
  for (let index = 0; index < list.length;) {
    const item = list[index];
    if (!listener) {
      this.removeEventListenerBase(type, item);
      list.splice(index, 1);
    } else if (item === listener) {
      list.splice(index, 1);
      break;
    } else {
      index++;
    }
  }
  if (list.length === 0) {
    delete this.EventList[type];
  }
};
