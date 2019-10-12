const fs = require('fs').promises
const path = require('path')

const parsers = [
  'current',
  'nearley',
  'idea',
  'idea-reworked',
  'astrocite',
  'fiduswriter',
  // see https://github.com/zotero/zotero/pull/1737
  // 'zotero'
]

async function time (name, func, ...args) {
  const start = Date.now()
  try {
    await func(...args)
    return `${Date.now() - start}ms`
  } catch (e) {
    return 'N/A'
  }
}

async function runInit (package) {
  const parser = require(package)
  if (parser.init) {
    await parser.init()
  }
  return parser
}

async function testParser (name, texts) {
  const package = `../lib/${name}`
  const init = await time(name, runInit, package)
  const parser = require(package)

  const row = { init }
  for (let [file, text] of texts) {
    row[file] = await time(name, parser.parse, text)
  }

  return row
}

async function main () {
  const dirPath = path.join(__dirname, 'files')
  const files = await fs.readdir(dirPath)
  const texts = []
  for (let file of files) {
    texts.push([file, await fs.readFile(path.join(dirPath, file), 'utf8')])
  }

  const results = []
  for (let name of parsers) {
    results.push([name, await testParser(name, texts)])
  }

  return Object.fromEntries(results)
}

const console = global.console
global.console = { log () {}, error () {} }

main()
  .then(console.table)
  .catch(console.error)
