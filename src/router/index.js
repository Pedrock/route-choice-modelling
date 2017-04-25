import Vue from 'vue';
import Router from 'vue-router';
import Hello from '@/components/Hello';
import Test from '@/components/Test';

Vue.use(Router);

window.Vue = Vue;

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Hello',
      component: Hello,
    },
    {
      path: '/test',
      name: 'test',
      component: Test,
    },
  ],
});
