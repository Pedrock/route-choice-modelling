<template>
  <div class="maps">
    <div id="pano" ref="pano"></div>
    <div id="map" ref="map"></div>
  </div>
</template>

<script>
  import ol from 'openlayers';
  import Vue from 'vue';

  const initialEdgepoint = 1664600;

  const routeStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
      width: 6, color: [200, 50, 50, 0.8],
    }),
  });
  const routeHoverStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
      width: 6, color: [0, 255, 0, 0.8],
    }),
  });

  const olHover = new ol.interaction.Select({
    condition: ol.events.condition.pointerMove,
    style: routeHoverStyle,
  });
  const olClick = new ol.interaction.Select({ condition: ol.events.condition.doubleClick });

  const getData = (edgepoint, next) =>
    Vue.axios.get(`edgepoint?id=${edgepoint}`)
    .then((res) => {
      next((vm) => {
        // eslint-disable-next-line no-param-reassign
        vm.edgepoint = res.data;
      });
    }).catch(() => {
      next((vm) => {
        const notification = {
          title: 'An error occurred!',
          message: 'Please try again later.',
        };
        vm.$notify.error(notification);
      });
    });

  export default {
    name: 'map',
    data() {
      return {
        pano: null,
        olmap: null,
        heading: 0,
        edgepoint: null,
      };
    },
    computed: {
      location() {
        if (!this.edgepoint) {
          return { lat: 0, lng: 0 };
        }
        return {
          lat: Number(this.edgepoint.location.lat),
          lng: Number(this.edgepoint.location.lng),
        };
      },
      openlayersLocation() {
        const { lat, lng } = this.location;
        return [lng, lat];
      },
      pov() {
        const heading = this.edgepoint ? this.edgepoint.location.heading : 0;
        return {
          heading: (180 * heading || 0) / Math.PI,
          pitch: 0,
        };
      },
    },
    methods: {
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
          const div = document.querySelector('div[jstcache="0"][style="width: 100%; height: 100%;"]');
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
          }),
          interactions: ol.interaction.defaults({
            dragPan: false,
          }),
        });
        this.vectorSource = new ol.source.Vector();
        this.olmap.addLayer(new ol.layer.Vector({
          source: this.vectorSource,
          style: routeStyle,
        }));
        olClick.on('select', this.onRouteClick.bind(this));
      },
      updatePolylines() {
        this.vectorSource.clear();
        this.edgepoint.edges.forEach((edge) => {
          const format = new ol.format.Polyline();
          const line = format.readGeometry(edge.polyline.replace(/\\\\/g, '\\'), {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
          });
          const feature = new ol.Feature({ geometry: line });
          feature.setId(edge.id);
          this.vectorSource.addFeature(feature);
          this.olmap.addInteraction(olHover);
          this.olmap.addInteraction(olClick);
        });
      },
      onRouteClick(e) {
        if (e.selected[0]) {
          const edge = e.selected[0].getId();
          this.axios.get(`forward?edge=${edge}`).then((res) => {
            this.edgepoint = res.data;
          }).catch(() => {
            const notification = {
              title: 'An error occurred!',
              message: 'Please try again later.',
            };
            this.$notify.error(notification);
          }).then(() => {
            olHover.getFeatures().clear();
            olClick.getFeatures().clear();
          });
        }
      },
    },
    watch: {
      location: {
        handler: function handler() {
          if (this.pano) {
            this.pano.setPosition(this.location);
            this.pano.setPov(this.pov);
          }
          this.olmap.getView().setCenter(ol.proj.fromLonLat(this.openlayersLocation));
          this.updatePolylines();
        },
        deep: true,
      },
      heading() {
        this.olmap.getView().setRotation(-this.heading);
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
      getData(initialEdgepoint, next);
    },
    beforeRouteUpdate(to, from, next) {
      getData(initialEdgepoint, next);
    },
  };
</script>

<style lang="less">
  .maps {
    height: 100%;
    position: relative;
  }
  #pano {
    width: 100%;
    height: 100%;
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
</style>
