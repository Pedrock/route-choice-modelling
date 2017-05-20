<template>
  <div class="maps">
    <div id="pano" ref="pano"></div>
    <div id="map" ref="map"></div>
  </div>
</template>

<script>
  import ol from 'openlayers';

  export default {
    name: 'map',
    data() {
      return {
        pano: null,
        olmap: null,
        location: { lat: 41.177246, lng: -8.596743 },
        heading: 0,
      };
    },
    computed: {
      openlayersLocation() {
        const { lat, lng } = this.location;
        return [lng, lat];
      },
    },
    methods: {
      vueGoogleMapsInit() {
        this.pano = new window.google.maps.StreetViewPanorama(this.$refs.pano, {
          position: this.location,
          zoom: 1,
          linksControl: false,
          enableCloseButton: false,
          clickToGo: false,
          fullscreenControl: false,
        });

        this.pano.addListener('pov_changed', () => {
          this.heading = (Math.PI * this.pano.getPov().heading) / 180;
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
            zoom: 16,
          }),
        });
      },
    },
    watch: {
      location() {
        this.olmap.getView().setCenter(ol.proj.fromLonLat(this.openlayersLocation));
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
        googleMapScript.setAttribute('src', 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCp_m8y6LXatPYMMG5QYwJA6TvLEecQYU4&callback=vueGoogleMapsInit');
        googleMapScript.setAttribute('async', '');
        googleMapScript.setAttribute('defer', '');
        document.body.appendChild(googleMapScript);
      }
      this.initOpenLayers();
    },
    beforeDestroy() {
      this.olmap.setTarget(null);
      this.olmap = null;
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
