import Vue from 'vue';
import Router from 'vue-router';
import Map from '@/components/Map';
import Entry from '@/components/Entry';

Vue.use(Router);

window.Vue = Vue;

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/map',
      name: 'map',
      component: Map,
    },
    {
      path: '/',
      name: 'entry',
      component: Entry,
    },
    {
      path: '/thankyou',
      name: 'thankyou',
      component: Map,
    },
  ],
});
