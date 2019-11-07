const fs = require('fs').promises
const path = require('path')
const { parse } = require('../lib/idea-reworked/')

async function main () {
  const file = await fs.readFile(path.join(process.cwd(), process.argv[2]), 'utf8')
  console.log(JSON.stringify(parse(file), null, 2))
}

const console = global.console
global.console = {}

main().catch(console.error)
