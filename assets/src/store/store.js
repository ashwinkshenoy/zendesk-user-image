const { reactive, readonly } = Vue;

const state = reactive({});

const getters = {};

const methods = {};

export default {
  state,
  getters: readonly(getters),
  methods,
};