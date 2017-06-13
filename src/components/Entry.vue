<template>
  <div id="entry">
    <p class="description">This project is designed to model human behavior and decision making at road intersections, with drivers making decisions with and without the help of an information system. You, as a driver, are invited to make journeys between specified origins and destinations under a range of travel scenarios in Oporto. There will be 4 rounds. Each user has two different sets of start and finish points, all well known locations in Oporto. For each set, you will first go through the route without the auxiliary information. After that you must arrive at the same destination but with the help of the information about the estimated time to the point of arrival for all the directions you may choose at any given intersection.</p>
    <div class="header">
      <strong>Entry form</strong>
    </div>
    <div id="inicial-form">
      <el-row type="flex" class="row-bg" justify="center">
        <el-form v-on:submit.native.prevent="onSubmit" ref="form" :model="form" :rules="rules" label-width="200px">
          <el-form-item label="Gender" prop="gender">
            <el-select v-model="form.gender" placeholder="Select">
              <el-option
                key="male"
                label="Male"
                value="male">
              </el-option>
              <el-option
                key="female"
                label="Female"
                value="female">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="Place of birth (district)" prop="birth">
            <el-select v-model="form.birth" placeholder="Select">
              <el-option
                v-for="item in districts"
                :key="item"
                :label="item"
                :value="item">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="Locality (district)" prop="locality">
            <el-select v-model="form.locality" placeholder="Select">
              <el-option
                v-for="item in districts"
                :key="item"
                :label="item"
                :value="item">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="Age" prop="age">
            <el-input-number v-model="form.age" :min="18" :max="90"></el-input-number>
          </el-form-item>
          <el-form-item label="Driving experience (Years)" prop="experience">
            <el-input-number v-model="form.experience" :min="0" :max="90"></el-input-number>
          </el-form-item>
          <el-form-item>
            <el-button native-type="submit" type="primary" class="next-button">Next</el-button>
          </el-form-item>
        </el-form>
      </el-row>
    </div>
  </div>
</template>

<script>
  import { mapMutations } from 'vuex';
  import { SUBMIT_ENTRY_FORM } from '@/store/mutation-types';

  export default {
    data() {
      return {
        form: {
          age: 18,
          experience: 0,
          gender: '',
          birth: '',
          locality: '',
        },
        rules: {
          gender: { required: true, message: 'Please choose your gender.' },
          birth: { required: true, message: 'Please choose your place of birth.' },
          locality: { required: true, message: 'Please choose the locality where you live.' },
          age: { required: true },
          experience: { required: true },
        },
        districts: [
          'Açores',
          'Aveiro',
          'Braga',
          'Bragança',
          'Castelo Branco',
          'Coimbra',
          'Évora',
          'Faro',
          'Guarda',
          'Leiria',
          'Lisboa',
          'Madeira',
          'Portalegre',
          'Porto',
          'Santarem',
          'Setubal',
          'Viana do Castelo',
          'Vila Real',
          'Viseu',
        ],
      };
    },
    methods: {
      ...mapMutations({
        submitForm: SUBMIT_ENTRY_FORM,
      }),
      onSubmit() {
        this.$refs.form.validate((valid) => {
          if (valid) {
            this.submitForm(this.form);
          }
        });
      },
    },
  };
</script>

<style lang="scss" scoped>
  #entry {
    padding: 0 10px 30px;
  }

  .description {
    padding: 20px;
    margin: 0 auto;
    max-width: 900px;
    text-align: justify;
    line-height: 1.5em;
  }

  .header {
    text-align: center;
    padding: 20px 20px 30px 20px;
  }

  .next-button {
    right: 0;
    position: absolute;
  }

  .el-form-item__content {
    line-height: 0;
  }
  .el-form-item:not(:first-child) {
    margin-top: 30px;
  }
  .el-input-number {
    width: 100%;
    margin-right: -82px;
  }
</style>
<style lang="scss">
  .el-form-item__error {
    margin-right: -2px;
  }
</style>
