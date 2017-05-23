/* eslint-disable no-param-reassign */
import Vue from 'vue';
import Vuex from 'vuex';
import { ADD_TO_PATH, INCREMENT_STEP, SUBMIT_ENTRY_FORM } from './mutation-types';
import router from '../router';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    step: 0,
    form: null,
    currentRoute: 0,
    routes: {},
  },
  getters: {
    step(state) {
      return state.step;
    },
  },
  mutations: {
    [INCREMENT_STEP](state) {
      state.step++;
      if (state.step > 4) state.step = 0;
    },
    [SUBMIT_ENTRY_FORM](state, form) {
      state.form = form;
      state.step = 1;
      router.push({ path: '/map' });
    },
    [ADD_TO_PATH](state, path) {
      if (state.routes[state.currentRoute] === undefined) {
        state.routes[state.currentRoute] = [];
      }
      state.routes[state.currentRoute].push(...path);
    },
  },
  strict: process.env.NODE_ENV !== 'production',
});
