/* eslint-disable no-param-reassign */
import Vue from 'vue';
import Vuex from 'vuex';
import { ADD_TO_PATH, INCREMENT_STEP, SUBMIT_ENTRY_FORM, NEXT_ROUTE, ADD_ANSWER } from './mutation-types';
import router from '../router';

Vue.use(Vuex);

function shuffle(array) {
  let count = array.length;
  let random;
  let temp;
  while (count) {
    // eslint-disable-next-line no-bitwise
    random = Math.random() * count-- | 0;
    temp = array[count];
    array[count] = array[random];
    array[random] = temp;
  }
}

const withHelpInfo = `You will now be challenged with arriving at the same destination, from the same starting point, but with some help.<br>
That help consists of having at each intersection the estimated time to arrival for each of your options.`;

const routes = [
  {
    initialEdge: 1708568, // Aliados
    finalEdge: 1262042, // Casa da Música
    destinationName: 'Casa da Música',
    previewHeading: 1.1,
  },
  {
    initialEdge: 1062916, // Estádio do Dragão
    finalEdge: 1071422, // FEUP
    destinationName: 'Faculdade de Engenharia da Universidade do Porto',
    previewHeading: 1.2,
  },
];

function getRoutes() {
  shuffle(routes);
  return routes.reduce((arr, route) =>
    [
      ...arr,
      { ...route, previewDestination: true, extraInformation: withHelpInfo },
      { ...route, help: true, askNumberRoutes: true },
    ],
    []);
}

export default new Vuex.Store({
  state: {
    step: 0,
    form: null,
    currentRoute: 0,
    routes: [],
    routesInfo: getRoutes(),
    arrived: false,
  },
  getters: {
    step(state) {
      return state.step;
    },
    currentRouteInfo(state) {
      return state.routesInfo[state.currentRoute];
    },
    hasArrived(state) {
      return state.arrived;
    },
    hasFinished(state) {
      return state.step === 3;
    },
    route(state) {
      return state.routes[state.currentRoute];
    },
    currentRouteIndex(state) {
      return state.currentRoute;
    },
    numberOfRoutes(state) {
      return state.routesInfo.length;
    },
    nextRouteInfo(state) {
      return state.routesInfo[state.currentRoute + 1];
    },
    hasHelp(state) {
      return state.routesInfo[state.currentRoute]
        ? state.routesInfo[state.currentRoute].help
        : false;
    },
  },
  mutations: {
    [INCREMENT_STEP](state) {
      state.step++;
    },
    [SUBMIT_ENTRY_FORM](state, form) {
      state.form = form;
      state.step = 1;
      router.replace({ path: '/map' });
    },
    [ADD_TO_PATH](state, path) {
      const info = state.routesInfo[state.currentRoute];
      if (state.routes[state.currentRoute] === undefined) {
        state.routes[state.currentRoute] = { ...info, path: [] };
      }
      state.routes[state.currentRoute].path.push(...path);
      if (path.includes(info.finalEdge)) {
        state.arrived = true;
      }
    },
    [NEXT_ROUTE](state) {
      state.arrived = false;
      if (state.currentRoute + 1 >= state.routesInfo.length) {
        state.step = 3;
        router.replace({ path: '/thankyou' });
      } else {
        state.currentRoute++;
      }
    },
    [ADD_ANSWER](state, numKnownRoutes) {
      const route = state.routes[state.currentRoute];
      route.numKnownRoutes = numKnownRoutes;
    },
  },
  actions: {
    sendAllInfo({ state }) {
      return Vue.axios.post('store', {
        routes: state.routes,
        form: state.form,
      });
    },
  },
  strict: process.env.NODE_ENV !== 'production',
});
