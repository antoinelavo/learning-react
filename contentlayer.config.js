// contentlayer.config.js
const { defineDocumentType, makeSource } = require('contentlayer/source-files')

const Blog = defineDocumentType(() => ({
  name: 'Blog',
  filePathPattern: `**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title:       { type: 'string', required: true },
    date:        { type: 'string', required: true },
    description: { type: 'string', required: true },
    ctaLabel:    { type: 'string', required: false },
    ctaLink:     { type: 'string', required: false },
    ctaPosition: { type: 'string', required: false },
  },
}))

module.exports = makeSource({
  contentDirPath: 'content/blog',
  documentTypes: [Blog],
  mdx: {},
})