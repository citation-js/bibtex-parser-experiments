const path = require('path')
const fs = require('fs')

const templatePath = path.join(__dirname, '../src/zotero/grammar.template')
const TEMPLATE = fs.readFileSync(templatePath, 'utf8')

const translatorPath = require.resolve('translators-check/BibTeX')
const TRANSLATOR = fs.readFileSync(translatorPath, 'utf8')

const outputPath = path.join(__dirname, '../src/zotero/grammar.js')
fs.writeFileSync(outputPath, TEMPLATE.replace("'''TRANSLATOR'''", () => TRANSLATOR))
