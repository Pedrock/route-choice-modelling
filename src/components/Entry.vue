<template>
  <div>
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
                v-for="item in options"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="Locality (district)" prop="locality">
            <el-select v-model="form.locality" placeholder="Select">
              <el-option
                v-for="item in options"
                :key="item.value"
                :label="item.label"
                :value="item.value">
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
        options: [{
          value: 'aveiro',
          label: 'Aveiro',
        }, {
          value: 'braga',
          label: 'Braga',
        }, {
          value: 'braganca',
          label: 'Bragança',
        }, {
          value: 'castelo-branco',
          label: 'Castelo Branco',
        }, {
          value: 'coimbra',
          label: 'Coimbra',
        }, {
          value: 'evora',
          label: 'Évora',
        }, {
          value: 'faro',
          label: 'Faro',
        }, {
          value: 'guarda',
          label: 'Guarda',
        }, {
          value: 'leiria',
          label: 'Leiria',
        }, {
          value: 'lisboa',
          label: 'Lisboa',
        }, {
          value: 'portalegre',
          label: 'Portalegre',
        }, {
          value: 'porto',
          label: 'Porto',
        }, {
          value: 'santarem',
          label: 'Santarem',
        }, {
          value: 'setubal',
          label: 'Setubal',
        }, {
          value: 'viana-do-castelo',
          label: 'Viana do Castelo',
        }, {
          value: 'vila-real',
          label: 'Vila Real',
        }, {
          value: 'viseu',
          label: 'Viseu',
        }],
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

<style lang="less" scoped>
  .header {
    text-align: center;
    padding: 20px 20px 30px 20px;
  }
  .next-button {
    right: 0;
    position: absolute;
  }
</style>

<style lang="less">
  .el-form-item__content {
    line-height: 0;
  }
  .el-form-item:not(:first-child) {
    margin-top: 40px;
  }
</style>
