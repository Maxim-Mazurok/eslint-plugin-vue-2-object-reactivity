# eslint-plugin-vue-2-object-reactivity

These rules aim to solve the problem with Vue 2 Object Reactivity.

## Getting started

### Users

Install this plugin:

```bash
npm i eslint-plugin-vue-2-object-reactivity
```

Add to your `.eslintrc.js` config:

```js
module.exports = {
  plugins: ["vue-2-object-reactivity"],
  rules: {
    "vue-2-object-reactivity/require-vue-set": "error",
  },
};
```

Try it out:

```
npm run lint
```

### Contributors

In this project:

```bash
npm link
```

In [Vue 2 TS project](https://github.com/Maxim-Mazurok/vue-2-vuex-object-reactivity-typescript):

Using config:

```js
module.exports = {
  plugins: ["vue-2-object-reactivity"],
  rules: {
    "vue-2-object-reactivity/require-vue-set": "error",
  },
};
```

```bash
npm ci
npm link "eslint-plugin-vue-2-object-reactivity"
npm run lint
```

or, to enable verbose output:

```bash
export DEBUG=true # to enable verbose output
eslint src/store.ts
```

## Additional info

See these:

- https://github.com/Maxim-Mazurok/vue-2-vuex-object-reactivity
- https://github.com/Maxim-Mazurok/vue-3-vuex-object-reactivity
- https://github.com/Maxim-Mazurok/vue-2-vuex-object-reactivity-typescript - will be used to test this rule

~~This will only work with TypeScript because we need to know that we're dealing with `Vuex.Store`.~~
Actually, we probably can make it work with JS, because we don't really use TS features right now...

Bootstrapped with https://dev.to/bwca/create-a-custom-eslint-rule-with-typescript-4j3d
See also: https://dev.to/alexgomesdev/writing-custom-typescript-eslint-rules-how-i-learned-to-love-the-ast-15pn and https://github.com/amzn/eslint-plugin-no-date-parsing
