<template>
  <div id="maps">
    <div class="overlay" v-if="hasArrived">
      <div>
        <p class="overlay-title">You have arrived at the destination!</p>
        <p>How many routes do you know from the starting point to this destination?</p>
        <limited-number-input default="1" min="1" max="10" @input="value => { questionAnswer = value }"></limited-number-input>
        <el-button type="primary" :loading="loading" @click="nextClick">Next <i class="el-icon-arrow-right el-icon-right"></i></el-button>
      </div>
    </div>
    <div class="overlay" v-if="hasFinished">
      <div>
        <p class="overlay-title">You are done! Thank you for your time!</p>
      </div>
    </div>
    <div id="pano" ref="pano"></div>
    <div id="map" ref="map"></div>
  </div>
</template>

<script>
  import ol from 'openlayers';
  import Vue from 'vue';
  import { mapActions, mapGetters, mapMutations } from 'vuex';
  import store from '@/store/store';
  import { ADD_TO_PATH, NEXT_ROUTE, ADD_ANSWER } from '@/store/mutation-types';
  import LimitedNumberInput from './LimitedNumberInput';


  ol.View.prototype.rotateSmooth = function rotateSmooth(desiredRotation) {
    return new Promise((resolve) => {
      const fullRotation = 2 * Math.PI;
      const halfRotation = Math.PI;
      const a = desiredRotation - this.getRotation() + halfRotation;
      const mod = (a % fullRotation + fullRotation) % fullRotation - halfRotation;
      const shortestRotationValue = this.getRotation() + mod;
      this.animate({
        rotation: shortestRotationValue,
      }, () => {
        Vue.nextTick(() => {
          this.setRotation(((2 * Math.PI) + (this.getRotation() % (2 * Math.PI))) % (2 * Math.PI));
        });
        resolve();
      });
    });
  };

  const createRouteStyle = color => new ol.style.Style({
    stroke: new ol.style.Stroke({ width: 6, color }),
  });
  const routeStyle = createRouteStyle([200, 50, 50, 0.8]);
  const routeHoverStyle = createRouteStyle([0, 255, 0, 0.8]);
  const currentEdgeStyle = createRouteStyle([200, 200, 0, 0.8]);

  const getData = (next) => {
    const edge = store.getters.currentRouteInfo.initialEdge;
    Vue.axios.get(`edge?id=${edge}`)
    .then(res => next(vm => vm.initialDataReceived(res.data)))
    .catch((err) => {
      next((vm) => {
        console.error(err);
        const notification = {
          title: 'An error occurred!',
          message: 'Please try again later.',
        };
        vm.$notify.error(notification);
      });
    });
  };

  export default {
    name: 'map',
    data() {
      return {
        heading: 0,
        data: null,
        rotating: false,
        loading: false,
        questionAnswer: null,
      };
    },
    computed: {
      ...mapGetters([
        'currentRouteInfo',
        'hasArrived',
        'hasFinished',
        'nextRouteInfo',
        'step',
      ]),
      location() {
        if (!this.data) {
          return { lat: 0, lng: 0 };
        }
        return {
          lat: Number(this.data.location.lat),
          lng: Number(this.data.location.lng),
        };
      },
      openlayersLocation() {
        const { lat, lng } = this.location;
        return [lng, lat];
      },
      pov() {
        const heading = this.data ? this.data.location.heading : 0;
        return {
          heading: (180 * heading || 0) / Math.PI,
          pitch: 0,
        };
      },
    },
    methods: {
      ...mapMutations({
        addToPath: ADD_TO_PATH,
        nextRoute: NEXT_ROUTE,
        addAnswer: ADD_ANSWER,
      }),
      ...mapActions(['sendAllInfo']),
      vueGoogleMapsInit() {
        this.pano = new window.google.maps.StreetViewPanorama(this.$refs.pano, {
          position: this.location,
          pov: this.pov,
          zoom: 1,
          linksControl: false,
          enableCloseButton: false,
          clickToGo: false,
          fullscreenControl: false,
        });

        this.pano.addListener('pov_changed', () => {
          this.heading = (Math.PI * this.pano.getPov().heading) / 180;
        });

        this.pano.addListener('status_changed', () => {
          const div = document.querySelector('.gm-style > div > div > div[jstcache="0"]');
          if (div) {
            div.removeEventListener('keydown');
          }
        });
      },
      initOpenLayers() {
        this.olmap = new ol.Map({
          target: this.$refs.map,
          loadTilesWhileAnimating: true,
          layers: [
            new ol.layer.Tile({
              source: new ol.source.OSM(),
            }),
          ],
          view: new ol.View({
            center: ol.proj.fromLonLat(this.openlayersLocation),
            zoom: 17,
            minZoom: 17,
            maxZoom: 17,
            rotation: 0,
          }),
          interactions: [],
        });
        this.currentEdgeSource = new ol.source.Vector();
        const currentEdgeLayer = new ol.layer.Vector({
          source: this.currentEdgeSource,
          style: currentEdgeStyle,
        });
        this.olmap.addLayer(currentEdgeLayer);

        this.vectorSource = new ol.source.Vector();
        this.vectorLayer = new ol.layer.Vector({
          source: this.vectorSource,
          style: routeStyle,
        });
        this.olmap.addLayer(this.vectorLayer);

        this.olHover = new ol.interaction.Select({
          condition: ol.events.condition.pointerMove,
          style: routeHoverStyle,
          layers: [this.vectorLayer],
        });
        this.olClick = new ol.interaction.Select({
          condition: ol.events.condition.doubleClick,
          layers: [this.vectorLayer],
        });
        this.olmap.addInteraction(this.olHover);
        this.olmap.addInteraction(this.olClick);
        this.olClick.on('select', this.onRouteClick.bind(this));
      },
      updatePolylines() {
        this.vectorSource.clear();
        this.currentEdgeSource.clear();

        const currentEdge = this.createPolylineFeature(this.data.location.polyline);
        this.currentEdgeSource.addFeature(currentEdge);

        this.data.edges.forEach((edge) => {
          const feature = this.createPolylineFeature(edge.polyline);
          feature.setId(edge.id);
          this.vectorSource.addFeature(feature);
        });
      },
      createPolylineFeature(polyline) {
        const format = new ol.format.Polyline();
        const line = format.readGeometry(polyline.replace(/\\\\/g, '\\'), {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857',
        });
        return new ol.Feature({ geometry: line });
      },
      initialDataReceived(data) {
        this.olmap.getView().setRotation(-data.location.heading);
        this.data = data;
        this.olmap.getView().setCenter(ol.proj.fromLonLat(this.openlayersLocation));
      },
      onRouteClick(e) {
        if (e.selected[0]) {
          const edge = e.selected[0].getId();
          this.axios.get(`forward?edge=${edge}`).then((res) => {
            this.data = res.data;
            this.rotating = true;
            this.addToPath(res.data.location.path);
            this.olmap.getView().rotateSmooth(-this.data.location.heading).then(() => {
              this.rotating = false;
            });
          }).catch((err) => {
            console.error(err);
            const notification = {
              title: 'An error occurred!',
              message: 'Please try again later.',
            };
            this.$notify.error(notification);
          }).then(() => {
            this.olHover.getFeatures().clear();
            this.olClick.getFeatures().clear();
          });
        }
      },
      nextClick() {
        this.addAnswer(this.questionAnswer);
        (() => {
          if (this.nextRouteInfo) {
            this.loading = true;
            const edge = store.getters.nextRouteInfo.initialEdge;
            return this.axios.get(`edge?id=${edge}`)
            .then(res => this.initialDataReceived(res.data));
          }
          return this.sendAllInfo();
        })().then(() => {
          this.nextRoute();
          this.loading = false;
          this.questionAnswer = null;
          this.olmap.renderSync();
        }).catch((err) => {
          console.error(err);
          const notification = {
            title: 'An error occurred!',
            message: 'Please try again later.',
          };
          this.$notify.error(notification);
        });
      },
    },
    watch: {
      location: {
        handler: function handler() {
          if (this.pano) {
            this.pano.setPosition(this.location);
            this.pano.setPov(this.pov);
          }
          setTimeout(() => {
            this.olmap.getView().animate({ center: ol.proj.fromLonLat(this.openlayersLocation) });
          });
          if (!this.hasFinished) {
            this.updatePolylines();
          }
        },
        deep: true,
      },
      heading() {
        if (!this.rotating) {
          this.olmap.getView().setRotation(-this.heading);
        }
      },
    },
    mounted() {
      if (window.vueGoogleMapsInit) {
        this.vueGoogleMapsInit();
      } else {
        window.vueGoogleMapsInit = this.vueGoogleMapsInit;
        const googleMapScript = document.createElement('SCRIPT');
        googleMapScript.setAttribute('src',
          'https://maps.googleapis.com/maps/api/js?key=AIzaSyCp_m8y6LXatPYMMG5QYwJA6TvLEecQYU4&callback=vueGoogleMapsInit');
        googleMapScript.setAttribute('async', '');
        googleMapScript.setAttribute('defer', '');
        document.body.appendChild(googleMapScript);
      }
      this.initOpenLayers();
    },
    beforeDestroy() {
      if (this.olmap) {
        this.olmap.setTarget(null);
        this.olmap = null;
      }
    },
    beforeRouteEnter(to, from, next) {
      if (store.getters.step === 0) {
        next({ name: 'entry' });
      }
      getData(next);
    },
    beforeRouteUpdate(to, from, next) {
      getData(next);
    },
    components: { LimitedNumberInput },
  };
</script>

<style lang="less">
  #maps {
    height: 100%;
    position: relative;

    #pano, .overlay {
      width: 100%;
      height: 100%;
    }

    .overlay-title {
      font-size: 2em;
      margin-bottom: 50px;
    }

    .overlay {
      position: absolute;
      z-index: 3;
      background-color: rgba(255, 255, 255, 0.7);
      display: table;
      > div {
        display: table-cell;
        vertical-align: middle;
        text-align: center;
        font-weight: bold;
        padding-bottom: 1em;
      }
      .el-input-number {
        display: block;
        box-sizing: border-box;
        max-width: 900px;
        margin: 20px auto;
      }
    }

    #map {
      position: absolute;
      height: 200px;
      width: 200px;
      top: 0;
      right: 0;
      z-index: 1;
      background-color: #ccc;
    }
  }
</style>
