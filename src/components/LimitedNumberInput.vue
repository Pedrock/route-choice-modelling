<template>
  <div class="el-input-number">
    <span class="el-input-number__decrease" :class="{ 'is-disabled': this.value <= this.min }"
          @click="decrease()"><i class="el-icon-minus"></i></span>
    <span class="el-input-number__increase" :class="{ 'is-disabled': this.value > this.max }"
          @click="increase()"><i class="el-icon-plus"></i></span>
    <div class="el-input">
      <input :value="displayValue"
             disabled
             autocomplete="off"
             type="text"
             class="el-input__inner">
    </div>
  </div>
</template>

<script>
  export default {
    name: 'limited-number-input',
    props: ['default', 'min', 'max'],
    data() {
      return {
        value: this.default || this.min || 0,
      };
    },
    computed: {
      displayValue() {
        if (this.max !== undefined && this.value > this.max) {
          return `${this.max}+`;
        }
        return String(this.value);
      },
    },
    created() {
      this.$emit('input', this.displayValue);
    },
    methods: {
      increase() {
        if (this.value <= this.max || this.max === undefined) {
          this.value++;
          this.$emit('input', this.displayValue);
        }
      },
      decrease() {
        if (this.value > this.min || this.min === undefined) {
          this.value--;
          this.$emit('input', this.displayValue);
        }
      },
    },
  };
</script>

