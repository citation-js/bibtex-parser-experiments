require('@babel/register')

const util = require('util')

const fixtures = Object.entries(require('./fixtures/syntax').default)
const parsers = {
  'current': null,
  'idea-reworked': null,
  'astrocite': null,
  'fiduswriter': null,
  'zotero': null,
  'bbt': null,
  // Outdated with distractingly large error output
  // 'nearley': null,
  // 'idea': null
}
const FIXTURE = {
  PASS: '✓',
  NO_SUPPORT: '?',
  FAIL: '✘'
}

const console = global.console
global.console = global.logger = {
  error (message) {
    throw new SyntaxError(message)
  }
}

async function getParsers () {
  for (const name in parsers) {
    const parser = parsers[name] = require(`../lib/${name}`)
    if (parser.init) {
      await parser.init()
    }
  }
}

async function parseFixture (parser, fixture) {
  try {
    await parser.parse(fixture.input)
    return [FIXTURE.PASS, null]
  } catch (e) {
    if (fixture.gimmick || fixture.only) {
      return [FIXTURE.NO_SUPPORT, e]
    } else {
      return [FIXTURE.FAIL, e]
    }
  }
}

function prefixLines (message, prefix) {
  return message.split('\n').map(line => prefix + line).join('\n')
}

async function testParser (parserName, filterPrefix) {
  const parser = parsers[parserName]

  console.log(`== ${parserName} ==`)

  for (let [fixtureName, fixture] of fixtures) {
    if (filterPrefix && !fixture.startsWith(filterPrefix)) {
      continue
    }

    let [code, error] = await parseFixture(parser, fixture)
    console.log(`\x1B[32m${code}\x1B[39m`, fixtureName)
    if (code !== FIXTURE.PASS) {
      console.log(prefixLines(error.toString(), '    '))
      // console.log(prefixLines(util.formatWithOptions({ colors: true }, error), '    '))
    }
  }
}

async function testFixtures (filterPrefix) {
  const header = `| | ${Object.keys(parsers).join(' | ')} |`
  console.log(header)
  console.log(header.replace(/[^|]/g, '-'))

  for (const [name, fixture] of fixtures) {
    if (filterPrefix && !fixture.startsWith(filterPrefix)) {
      continue
    }

    const codes = await Promise.all(Object.values(parsers).map(
      async parser => (await parseFixture(parser, fixture))[0]
    ))
    console.log(`| ${name} | ${codes.join(' | ')} |`)
  }
}

async function main () {
  await getParsers()

  const [command, ...args] = process.argv.slice(2)
  switch (command) {
    case 'fixtures':
      testFixtures(...args)
      break
    case 'parser':
      testParser(...args)
      break

    default:
    console.log(`COMMANDS:
  fixtures [prefix]        -- run fixtures (optionally filter by prefix)
  parser <parser> [prefix] -- run fixtures for a given parser (optionally filter by prefix)`)
      break
  }
}

main()
  .catch(console.error)
