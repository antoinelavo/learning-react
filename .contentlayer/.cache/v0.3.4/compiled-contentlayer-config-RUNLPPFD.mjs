var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// contentlayer.config.js
var require_contentlayer_config = __commonJS({
  "contentlayer.config.js"(exports, module) {
    var { defineDocumentType, makeSource } = __require("contentlayer/source-files");
    var Blog = defineDocumentType(() => ({
      name: "Blog",
      filePathPattern: `**/*.mdx`,
      contentType: "mdx",
      fields: {
        title: { type: "string", required: true },
        date: { type: "string", required: true },
        description: { type: "string", required: true },
        ctaLabel: { type: "string", required: false },
        ctaLink: { type: "string", required: false },
        ctaPosition: { type: "string", required: false }
      }
    }));
    module.exports = makeSource({
      contentDirPath: "content/blog",
      documentTypes: [Blog],
      mdx: {}
    });
  }
});
export default require_contentlayer_config();
//# sourceMappingURL=compiled-contentlayer-config-RUNLPPFD.mjs.map
