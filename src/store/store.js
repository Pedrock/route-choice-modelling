/* eslint-disable no-param-reassign */
import Vue from 'vue';
import Vuex from 'vuex';
import { INCREMENT_STEP } from './mutation-types';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    step: 0,
  },
  getters: {
    step(state) {
      return state.step;
    },
  },
  mutations: {
    [INCREMENT_STEP](state) {
      state.step++;
      if (state.step > 3) state.step = 0;
    },
  },
  strict: process.env.NODE_ENV !== 'production',
});
