<template>
  <div id="app">
    <nav>
      <router-link :to="{name: 'entry'}">Root</router-link>
      <router-link :to="{name: 'map'}">Map</router-link>
    </nav>
    <div id="steps">
      <el-steps :active="step" finish-status="success" :center="true">
        <el-step title="Entry Form"></el-step>
        <el-step title="Driving without information"></el-step>
        <el-step title="Driving with information"></el-step>
        <el-step title="Final"></el-step>
      </el-steps>
    </div>
    <div id="wrapper">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex';

  export default {
    name: 'app',
    computed: {
      ...mapGetters([
        'step',
      ]),
    },
  };
</script>

<style lang="less">
  body {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
  }
  #app {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  nav {
    text-align: center;
    position: absolute;
    width: 100%;
  }
  #steps {
    padding: 20px 10% 10px;
  }
  #wrapper {
    flex: 1;
  }

</style>
