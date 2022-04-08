import { createRuleTester } from "eslint-etc";
import { resolve } from "path";

import { requireVueSet } from "../src/rules/require-vue-set";

createRuleTester({
  filename: resolve("./tests/file.ts"),
})({
  types: true,
}).run("require-vue-set", requireVueSet, {
  valid: [
    // object prop
    `
    export default {
      mutations: {
        valid(state) {
          Vue.set(state.object, "prop", 123)
        }
      }
    }
    `,
    `
    export default {
      mutations: {
        valid(someOtherWord) {
          Vue.set(someOtherWord.object, "prop", 123)
        }
      }
    }
    `,
    `
    export default {
      mutations: {
        valid() {
          console.log("I'm not touching state");
        }
      }
    }
    `,
    // variable
    `
    const mutations = {
      valid(state) {
        Vue.set(state.object, "prop", 123)
      }
    }
    `,
    `
    const mutations = {
      valid(someOtherWord) {
        Vue.set(someOtherWord.object, "prop", 123)
      }
    }
    `,
    `
    const mutations = {
      valid() {
        console.log("I'm not touching state");
      }
    }
    `,
  ],

  invalid: [
    // object prop
    {
      code: `
      export default {
        mutations: {
           invalid(state) {
            state.object["prop"] = 123
          }
        }
      }
      `,
      errors: [{ messageId: "useVueSet" }],
    },
    {
      code: `
        export default {
          mutations: {
             invalid(someOtherWord) {
              someOtherWord.object["prop"] = 123
            }
          }
        }
        `,
      errors: [{ messageId: "useVueSet" }],
    },
    // variable
    {
      code: `
        const mutations = {
          invalid(state) {
            state.object["prop"] = 123
          }
        }
      `,
      errors: [{ messageId: "useVueSet" }],
    },
    {
      code: `
        const mutations = {
          invalid(someOtherWord) {
            someOtherWord.object["prop"] = 123
          }
        }
        `,
      errors: [{ messageId: "useVueSet" }],
    },
    // https://github.com/Maxim-Mazurok/eslint-plugin-vue-2-object-reactivity/issues/1
    {
      code: `
        export default {
          mutations: {
            setPropOnObject (state, { prop, val }: { prop: string; val: string }) {
              state.object[prop].name = val
            }
          }
        }
        `,
      errors: [{ messageId: "useVueSet" }],
    },
    {
      code: `
        export default {
          mutations: {
            setPropOnObject (state, { prop, val }: { prop: string; val: string }) {
              const element= state.object[prop]
              if (element) {
                element.name = val
              }
            }
          }
        }
        `,
      errors: [{ messageId: "useVueSet" }],
    },
    // many properties deep
    {
      code: `
      const prop5 = "something";
      export default {
        mutations: {
          invalid(state) {
            state.object.prop1["prop2"].prop3[prop5] = 123
          }
        }
      }
      `,
      errors: [{ messageId: "useVueSet" }],
    },
    // assignment to object
    {
      code: `
      export default {
        mutations: {
          invalid(state) {
            const schedulePK = "test";
            const schedule = { test: 123 };
            const scheduleUpdates = { update: 321 };
            state.schedules[schedulePK] = {
              ...schedule,
              ...scheduleUpdates,
            }
          }
        }
      }
      `,
      errors: [{ messageId: "useVueSet" }],
    },
  ],
});

console.log("Tests completed successfully");
