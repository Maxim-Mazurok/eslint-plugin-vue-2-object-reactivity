import { requireVueSet } from "./require-vue-set";

module.exports = {
  rules: {
    "vue-2-object-reactivity": {
      create: requireVueSet,
    },
  },
};
