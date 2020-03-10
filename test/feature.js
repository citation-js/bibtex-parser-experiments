require('@babel/register')

const assert = require('assert').strict
const util = require('util')

const fixtures = Object.entries(require('./fixtures/features').default)
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
  NO_SUPPORT: '✘',
  OTHER_CHOICE: ' ',
  FAIL: '✘'
}
const GIMMICK = {
  REPRESENTATION: {
    text: 'undefined representation',
    number: null
  },
  RARE: {
    text: 'very unlikely to matter',
    number: null,
  }
}
const SUPERSCRIPT_NUMBERS = ['¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']
const FOOTNOTES = []

const console = global.console
global.console = global.logger = {
  error (message) {
    throw new SyntaxError(message)
  }
}

async function getParsers () {
  for (const name in parsers) {
    const parser = parsers[name] = require(`../src/${name}`)
    if (parser.init) {
      await parser.init()
    }
  }
}

async function parseFixture (parser, fixture) {
  try {
    let result = await parser.parse(fixture.input)
    assert.deepEqual(parser._intoFixtureOutput(result), fixture.output)

    return [FIXTURE.PASS, null]
  } catch (e) {
    if (fixture.gimmick) {
      const gimmick = GIMMICK[fixture.gimmick]
      if (!gimmick.number) {
        gimmick.number = SUPERSCRIPT_NUMBERS.shift()
        FOOTNOTES.push(`> ${gimmick.number} ${gimmick.text}`)
      }
      return [FIXTURE.NO_SUPPORT + gimmick.number, e]
    } else if (fixture.only) {
      return [FIXTURE.OTHER_CHOICE, null]
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
    if (filterPrefix && !fixtureName.startsWith(filterPrefix)) {
      continue
    }

    let [code, error] = await parseFixture(parser, fixture)
    switch (code) {
      case FIXTURE.PASS:
        console.log(`\x1B[32m${code}\x1B[39m`, fixtureName)
        break
      case FIXTURE.NO_SUPPORT:
      case FIXTURE.FAIL:
        console.log(`\x1B[31m${code}\x1B[39m`, fixtureName)
        console.log(prefixLines(error.toString(), '    '))
        // console.log(prefixLines(util.formatWithOptions({ colors: true }, error), '    '))
        break
    }
  }
}

async function testFixtures (filterPrefix) {
  const header = `| | ${Object.keys(parsers).join(' | ')} |`
  console.log(header)
  console.log(header.replace(/[^|]/g, '-'))

  for (const [fixtureName, fixture] of fixtures) {
    if (filterPrefix && !fixtureName.startsWith(filterPrefix)) {
      continue
    }

    const codes = await Promise.all(Object.values(parsers).map(
      async parser => (await parseFixture(parser, fixture))[0]
    ))
    console.log(`| ${fixtureName} | ${codes.join(' | ')} |`)
  }

  console.log(FOOTNOTES.join('  \n'))
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
