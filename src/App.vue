<template>
  <div id="app">
    <vue-progress-bar></vue-progress-bar>
    <div id="steps">
      <el-steps :active="step" :center="true">
        <el-step title="Entry Form" icon="edit"></el-step>
        <el-step :title="'Driving Simulation' + routeText"></el-step>
        <el-step title="Thank you" icon="check"></el-step>
      </el-steps>
    </div>
    <div id="wrapper">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex';

  if (process.env.NODE_ENV === 'production') {
    window.onbeforeunload = function onbeforeunload() {
      return 'Leaving this page will reset everything.';
    };
  }

  export default {
    name: 'app',
    mounted() {
      this.$Progress.finish();
    },
    created() {
      this.$Progress.start();
      this.$router.beforeEach((to, from, next) => {
        if (to.meta.progress !== undefined) {
          this.$Progress.parseMeta(to.meta.progress);
        }
        this.$Progress.start();
        next();
      });
      this.$router.afterEach(() => {
        this.$Progress.finish();
      });
      this.$router.onError((err) => {
        this.$Progress.fail();
        console.error(err);
        const notification = {
          title: 'An error occurred!',
          message: 'Please try again.',
        };
        this.$notify.error(notification);
      });
    },
    computed: {
      ...mapGetters([
        'step',
        'currentRouteIndex',
        'numberOfRoutes',
      ]),
      routeText() {
        return this.step !== 1 ? '' : ` (${this.currentRouteIndex + 1} / ${this.numberOfRoutes})`;
      },
    },
  };
</script>
<style>
  body {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
  }
</style>
<style lang="scss" scoped>
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
    .el-step__head.is-text.is-finish{
      background-color: #fff;
      border-color: #13ce66;
    }
    .el-step__head.is-finish, .el-step__title.is-finish {
      color: #13ce66;
      border-color: #13ce66;
    }
  }
  #wrapper {
    flex: 1;
  }

</style>
