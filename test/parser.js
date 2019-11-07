const fs = require('fs').promises
const path = require('path')
const { parse } = require('../lib/idea-reworked/')

async function main () {
  const dirPath = path.join(__dirname, 'files')
  const files = await fs.readdir(dirPath)

  for (let name of files) {
    const file = await fs.readFile(path.join(dirPath, name), 'utf8')
    console.log('\n' + '='.repeat(name.length) + '\n' + name + '\n' + '='.repeat(name.length) + '\n')
    try {
      parse(file)
      console.log('succes')
    } catch (e) {
      console.error(e)
    }
  }
}

const console = global.console
global.console = {}

main().catch(console.error)
