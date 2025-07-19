// This config is shared by all of our individual package typedoc configurations, so we can
// tweak things like CSS, plugins, and dependency mappings in a single location and have the fixes
// apply to all typedoc generation across the repo.

// *******************************
// If you move this file, references to it in every package that supports typedoc generation must be updated
// *******************************

module.exports = {
  $schema: "https://typedoc.org/schema.json",
  plugin: [
    "typedoc-material-theme",
    "typedoc-plugin-extras",
    "typedoc-plugin-zod",
    "./typedoc-remove-type-params-plugin.mjs",
  ],
  externalSymbolLinkMappings: {
    "@lit-protocol/types": {
      "*": "https://v7-api-doc-lit-js-sdk.vercel.app/modules/types_src.html",
    },
    "@lit-protocol/pkp-ethers": {
      "*": "https://v7-api-doc-lit-js-sdk.vercel.app/modules/pkp_ethers_src.html",
    },
    "did-jwt": {
      "*": "https://www.jsdocs.io/package/did-jwt",
    },
    ethers: {
      "*": "https://docs.ethers.org/v5/api/",
    },
    "@ethersproject/abstract-signer": {
      "*": "https://docs.ethers.org/v5/api/",
    },
  },
  customCss: "./docs/custom.css",
  // favicon: "docs/vincent-logo.svg",
};
