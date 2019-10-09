import path from 'path'

process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../node_modules/translation-server/config')

require('translation-server/src/zotero')
const Translators = require('translation-server/src/translators')
const Translate = require('translation-server/src/translation/translate')

export async function init () {
  await Translators.init()
}

export async function parse (text) {
  await init()
  const translate = new Translate.Import()
  translate.setString(text)
  const translators = await translate.getTranslators()
  translate.setTranslator(translators[0])
  return translate.translate({ libraryID: 1 })
}
