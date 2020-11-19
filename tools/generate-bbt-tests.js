const fs = require('fs')
const path = require('path')
const { _intoFixtureOutput } = require('../lib/bbt')

if (!process.argv[2]) {
  console.log(`Usage: node generate-bbt-tests.js path/to/bibtex-parser`)
  process.exit(1)
}

const BBT_DIR = path.resolve(process.argv[2])
const BIBTEX_DIR = path.join(BBT_DIR, '__tests__/better-bibtex/import')
const SNAPSHOT_DIR = path.join(BBT_DIR, '__tests__/__snapshots__')
const bibtex = fs.readdirSync(BIBTEX_DIR)
const snapshots = fs.readdirSync(SNAPSHOT_DIR)

const SNAPSHOT_PREFIX = 'bbt-import-'
const SNAPSHOT_SUFFIX = '.bib.shot'

const fixtures = bibtex.flatMap(inputFile => {
  const fixtureName = inputFile.slice(0, -4)
  const input = fs.readFileSync(path.join(BIBTEX_DIR, inputFile), 'utf8')

  return snapshots
    .filter(name => name.startsWith(SNAPSHOT_PREFIX + fixtureName))
    .map(snapshotFile => {
      const snapshot = require(path.join(SNAPSHOT_DIR, snapshotFile))

      const options = snapshotFile
        .slice(SNAPSHOT_PREFIX.length + fixtureName.length + 1, -SNAPSHOT_SUFFIX.length)
        .split('+')
      const snapshotAsJson = snapshot[Object.keys(snapshot)[0]]
        .replace(/(Array|Object) /g, '')
        .replace(/\t|\r?\n/g, ' ')
        .replace(/,(?=\s*[}\]])/g, '')
      const output = _intoFixtureOutput(JSON.parse(snapshotAsJson))

      return [fixtureName, input, output, options]
    })
    .filter(([name, input, output, options]) =>
      options.includes('sentencecase=on') &&
      !options.includes('guess') &&
      options.includes('caseprotection=as-needed')
    )
}).reduce((fixtures, [name, input, output, options]) =>
  (fixtures[name] = { input, output, options }, fixtures), {})

const FIXTURE_FILE = path.join(__dirname, '../test/fixtures/bbt.json')
fs.writeFileSync(FIXTURE_FILE, JSON.stringify(fixtures, null, 2))
