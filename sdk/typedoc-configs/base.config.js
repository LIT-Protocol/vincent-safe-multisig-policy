module.exports = {
  extends: "../../typedoc.config.base.js",
  $schema: "https://typedoc.org/schema.json",
  entryPoints: ["../src/index.ts"],
  name: "Safe Multisig SDK",
  tsconfig: "../tsconfig.json",
  includeVersion: true,
  navigation: {
    includeCategories: true,
  },
  categorizeByGroup: false,
  defaultCategory: "API Docs",
  categoryOrder: ["API Methods", "Interfaces"],
  visibilityFilters: {},
  sort: "source-order",
};
