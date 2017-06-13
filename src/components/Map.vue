<template>
  <div id="maps" :class="{'help-visible': hasHelp && !destinationPreview }">
    <div id="dest-prev-overlay" v-show="destinationPreview">
      <el-button type="primary" @click="() => destinationPreview = false">Start Simulation <i class="el-icon-arrow-right el-icon-right"></i></el-button>
      <p>This is where you need to go to:</p>
      <p v-text="currentRouteInfo.destinationName"></p>
    </div>
    <div class="overlay" v-if="hasArrived">
      <div><div>
        <p class="overlay-title">You have arrived at the destination!</p>
        <template v-if="currentRouteInfo.askNumberRoutes">
          <p>How many routes do you know from the starting point to this destination?</p>
          <limited-number-input default="1" min="1" max="10" @input="value => { questionAnswer = value }"></limited-number-input>
        </template>
        <p v-if="currentRouteInfo.extraInformation"
           class="extra-info"
           v-html="currentRouteInfo.extraInformation"></p>
        <el-button type="primary" :loading="loading" @click="nextClick">Next <i class="el-icon-arrow-right el-icon-right"></i></el-button>
      </div></div>
    </div>
    <div class="overlay" v-if="hasFinished">
      <div><div>
          <p class="overlay-title">You are done! Thank you for your time!</p>
      </div></div>
    </div>
    <div id="pano" ref="pano" v-once></div>
    <div id="map" ref="map" v-show="!hasFinished" v-once></div>
    <transition name="fade">
      <div id="map-loading-mask" v-show="loading && !hasArrived">
        <div class="el-loading-spinner">
          <svg viewBox="25 25 50 50" class="circular"><circle cx="50" cy="50" r="20" fill="none" class="path"></circle></svg>
        </div>
      </div>
    </transition>
    <div id="time-help" v-if="hasHelp && !destinationPreview">
      <el-card v-for="edge in edgesWithTime"
               :class="{ 'route-hover': edge.id === hoveredEdge }"
               :key="edge.id">{{edge.value}}</el-card>
    </div>
  </div>
</template>

<script>
  import ol from 'openlayers';
  import Vue from 'vue';
  import { mapActions, mapGetters, mapMutations } from 'vuex';
  import store from '@/store/store';
  import { ADD_TO_PATH, NEXT_ROUTE, ADD_ANSWER } from '@/store/mutation-types';
  import LimitedNumberInput from './LimitedNumberInput';

  const errorNotification = {
    title: 'An error occurred!',
    message: 'Please try again.',
  };

  const edgeRequest = (info, forward) => {
    const { initialEdge, finalEdge, help } = info;
    if (forward) return Vue.axios.get(`edge?forward=${forward}&dest=${finalEdge}${help ? '&help=1' : ''}`);
    return Vue.axios.get(`edge?id=${initialEdge}&dest=${finalEdge}${help ? '&help=1' : ''}`);
  };

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
    const info = store.getters.currentRouteInfo;
    edgeRequest(info)
    .then(res => next(vm => vm.initialDataReceived(res.data, info)))
    .catch((err) => {
      next(err);
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
        hoveredEdge: null,
        destinationPreview: false,
        choices: [], // Used for backtracking in case of dead ends
      };
    },
    computed: {
      ...mapGetters([
        'currentRouteInfo',
        'hasArrived',
        'hasFinished',
        'nextRouteInfo',
        'step',
        'hasHelp',
      ]),
      location() {
        if (!this.data) {
          return { lat: 0, lng: 0 };
        }
        if (this.destinationPreview) {
          return {
            lat: Number(this.data.dest.lat),
            lng: Number(this.data.dest.lng),
          };
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
        let heading;
        if (this.destinationPreview) {
          heading = this.currentRouteInfo.previewHeading || 0;
        } else {
          heading = this.data ? this.data.location.heading : 0;
        }
        return {
          heading: (180 * heading || 0) / Math.PI,
          pitch: 0,
        };
      },
      edgesWithTime() {
        if (!this.data || !this.data.edges || this.hasArrived) return [];
        return this.data.edges.map((edge, index) => {
          const minutes = Math.floor(edge.duration / 60);
          const seconds = edge.duration % 60;
          return {
            id: edge.id,
            value: `${String.fromCharCode(65 + index)} - ${minutes}m ${seconds}s`,
          };
        });
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
          condition: ol.events.condition.click,
          layers: [this.vectorLayer],
        });
        this.olmap.addInteraction(this.olHover);
        this.olmap.addInteraction(this.olClick);
        this.olClick.on('select', this.onRouteClick.bind(this));
        this.olHover.on('select', this.onRouteHover.bind(this));
      },
      updatePolylines(backtrackIfDeadend = false) {
        this.vectorSource.clear();
        this.currentEdgeSource.clear();

        const addChoice = (edge) => {
          const feature = this.createPolylineFeature(edge.polyline);
          feature.setId(edge.id);
          this.vectorSource.addFeature(feature);
        };

        if (!this.destinationPreview) {
          const usefulEdges = this.data.edges.filter(edge => !edge.deadend);
          if (!usefulEdges.length) {
            const { polyline } = this.data.location;
            if (backtrackIfDeadend) {
              this.choices.pop();
            }
            const edge = this.choices[this.choices.length - 1];
            if (edge) {
              addChoice({ id: edge, polyline });
            }
          } else {
            const currentEdge = this.createPolylineFeature(this.data.location.polyline);
            this.currentEdgeSource.addFeature(currentEdge);
            usefulEdges.forEach(addChoice);
          }
        }
      },
      createPolylineFeature(polyline) {
        const format = new ol.format.Polyline();
        const line = format.readGeometry(polyline.replace(/\\\\/g, '\\'), {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857',
        });
        return new ol.Feature({ geometry: line });
      },
      initialDataReceived(data, info) {
        this.destinationPreview = info.previewDestination;
        this.heading = info.previewHeading || 0;
        this.olmap.getView().setRotation(-data.location.heading);
        this.data = data;
        this.olmap.getView().setCenter(ol.proj.fromLonLat(this.openlayersLocation));
      },
      onRouteHover(e) {
        if (e.selected[0]) {
          this.hoveredEdge = e.selected[0].getId();
        } else {
          this.hoveredEdge = null;
        }
      },
      onRouteClick(e) {
        if (e.selected[0] && !this.loading && !this.rotating) {
          this.loading = true;
          const edgeId = e.selected[0].getId();
          edgeRequest(this.currentRouteInfo, edgeId)
          .then((res) => {
            if (!res.data.edges.length) {
              this.$notify.warning({
                title: 'Dead End Street',
                message: 'Please choose another option.',
              });
              const deadendEdge = this.data.edges.find(edge => edge.id === edgeId);
              deadendEdge.deadend = true;
              this.updatePolylines(true);
              return;
            }
            this.data = res.data;
            this.rotating = true;
            this.addToPath(res.data.location.path);
            this.olmap.getView().rotateSmooth(-this.data.location.heading).then(() => {
              this.olHover.getFeatures().clear();
              this.olClick.getFeatures().clear();
              this.rotating = false;
            });
            this.choices.push(edgeId);
          }).catch((err) => {
            console.error(err);
            this.$notify.error(errorNotification);
          }).then(() => {
            this.loading = false;
            this.olHover.getFeatures().clear();
            this.olClick.getFeatures().clear();
          });
        }
      },
      nextClick() {
        this.addAnswer(this.questionAnswer);
        (() => {
          this.loading = true;
          if (this.nextRouteInfo) {
            return edgeRequest(this.nextRouteInfo)
            .then(res => this.initialDataReceived(res.data, this.nextRouteInfo));
          }
          return this.sendAllInfo();
        })().then(() => {
          this.nextRoute();
          this.choices = [];
          this.questionAnswer = null;
          this.olmap.renderSync();
        }).catch((err) => {
          console.error(err);
          this.$notify.error(errorNotification);
        }).then(() => {
          this.loading = false;
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
      hasHelp() {
        setTimeout(() => {
          window.google.maps.event.trigger(this.pano, 'resize');
        });
      },
    },
    mounted() {
      if (window.vueGoogleMapsInit) {
        this.vueGoogleMapsInit();
      } else {
        window.vueGoogleMapsInit = this.vueGoogleMapsInit;
        const googleMapScript = document.createElement('SCRIPT');
        const gmapsKey = process.env.GMAPS_KEY;
        googleMapScript.setAttribute('src',
          `https://maps.googleapis.com/maps/api/js?key=${gmapsKey}&callback=vueGoogleMapsInit`);
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
      } else if (store.getters.step < 3) {
        getData(next);
      } else next();
    },
    beforeRouteUpdate(to, from, next) {
      if (store.getters.step < 3) {
        getData(next);
      } else next();
    },
    components: { LimitedNumberInput },
  };
</script>

<style lang="scss">
  #maps {
    height: 100%;
    position: relative;

    #time-help {
      position: absolute;
      right: 0;
      top: 200px;
      z-index: 2;
      width: 200px;
      height: calc(100% - 200px);
      box-sizing: border-box;
      padding: 0 10px;
      overflow-y: auto;
      .el-card {
        margin-top: 10px;
        text-align: center;
        transition: all 0.1s ease-in-out;
        &.route-hover {
          background-color: #ddd;
          border-color: #555;
          transform: scale(1.05);
        }
        .el-card__body {
          padding: 15px 5px;
        }
      }
    }

    #pano, .overlay {
      width: 100%;
      height: 100%;
    }

    &.help-visible {
      #pano, .overlay > div {
        width: calc(100% - 200px);
      }
    }

    .overlay-title {
      font-size: 2em;
      margin-bottom: 50px;
    }

    .overlay {
      position: absolute;
      z-index: 3;
      background-color: rgba(255, 255, 255, 0.7);
      > div {
        display: table;
        height: 100%;
        width: 100%;
        > div {
          display: table-cell;
          vertical-align: middle;
          text-align: center;
          font-weight: bold;
          padding-bottom: 1em;
        }
      }
      .el-input-number {
        display: block;
        box-sizing: border-box;
        max-width: 900px;
        margin: 20px auto;
      }
      .extra-info {
        margin-bottom: 40px;
        br {
          line-height: 30px;
        }
      }
    }

    #map, #map-loading-mask {
      position: absolute;
      height: 200px;
      width: 200px;
      top: 0;
      right: 0;
    }
    #map {
      z-index: 1;
      background-color: #ccc;
    }
    #map-loading-mask {
      z-index: 10;
      background-color: rgba(255,255,255,.9);
      transition: opacity .3s;
    }

    .fade-enter, .fade-leave-to {
      opacity: 0
    }

    #dest-prev-overlay {
      position: absolute;
      z-index: 2;
      background-color: rgba(255,255,255,.7);
      width: calc(100% - 200px);
      text-align: center;
      font-weight: bold;

      .el-button {
        float: right;
        margin: 10px 10px 40px;
      }
      > p {
        padding: 3px 0;
      }
    }
  }
</style>
