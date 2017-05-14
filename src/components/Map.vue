<template>
  <div id="pano"></div>
</template>

<script>
  export default {
    name: 'hello',
    data() {
      return {
        map: null,
      };
    },
    methods: {
      vueGoogleMapsInit() {
        const location = { lat: 41.177246, lng: -8.596743 };

        this.map = new window.google.maps.StreetViewPanorama(document.getElementById('pano'), {
          position: location,
          zoom: 1,
          linksControl: false,
          enableCloseButton: false,
          clickToGo: false,
        });

        const testMarker = new window.google.maps.Marker({
          position: { lat: 41.177246, lng: -8.596843 },
          map: this.map,
          title: 'Cafe',
        });

        testMarker.addListener('click', () => {
          // eslint-disable-next-line no-alert
          alert('Marker clicked');
        });
      },
    },
    mounted() {
      if (window.vueGoogleMapsInit) {
        this.vueGoogleMapsInit();
        return;
      }
      window.vueGoogleMapsInit = this.vueGoogleMapsInit;
      const googleMapScript = document.createElement('SCRIPT');
      googleMapScript.setAttribute('src', 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCp_m8y6LXatPYMMG5QYwJA6TvLEecQYU4&callback=vueGoogleMapsInit');
      googleMapScript.setAttribute('async', '');
      googleMapScript.setAttribute('defer', '');
      document.body.appendChild(googleMapScript);
    },
    beforeDestroy() {

    },
  };
</script>

<style lang="less">
  #pano {
    width: 100%;
    height: 100%;
    min-height: 500px;
    min-width: 500px;
    float: left;
  }
</style>
