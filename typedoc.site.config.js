// This config is used to drive generation of our complete typedoc site, including our 'documents' md files
// and the typedocs for each SDK/package in the repo.

// By composing JSON entrypoints inside the sub-packages, we can control when changes to the package docs
// are pushed to the live site.  We _usually_ only re-generate those JSON files when publishing to NPM.

// Unfortunately, you can't use watch mode on JSON entrypoints in the root of the repo, so each
// package has its own watch w/ HTML output that is .gitignored for local development iteration

module.exports = {
  extends: "./typedoc.config.base.js",
  $schema: "https://typedoc.org/schema.json",
  readme: "./docs/src/Overview.md",
  projectDocuments: ["docs/src/Overview.md", "docs/src/Intro.md"],
  categoryOrder: ["Developers", "Users", "Contact", "Packages"],
  entryPointStrategy: "merge",
  entryPoints: ["./sdk/docs/json"],
  name: "Vincent Docs",
  out: "./docs/dist/site",
  includeVersion: false,
  navigation: {
    includeCategories: true,
  },
  sidebarLinks: {
    Overview: "documents/Overview.html",
    "Getting Started": "documents/Getting_Started.html",
  },
  headings: {
    readme: false,
    // document: false,
  },
  defaultCategory: "API Docs",
  tsconfig: "./tsconfig.base.json",
  categorizeByGroup: false,
  visibilityFilters: {},
  searchInDocuments: true,
};
