const assert = require('assert').strict
const fixtures = require('./fixtures/bbt.json')

require('@babel/register')
const parser = require('../src/citationjs')

const ignore = new Set([
  'BBT does not import groups from JabRef 5.1 #1641',
  'Better BibLaTeX import improvements #549',
  'Better BibTeX.001',
  'Better BibTeX.003',
  'Better BibTeX.004',
  'Better BibTeX.005',
  'Better BibTeX.006',
  'Better BibTeX.008',
  'Better BibTeX.009',
  'Better BibTeX.010',
  'Better BibTeX.011',
  'Better BibTeX.012',
  'Better BibTeX.014',
  'Better BibTeX.015',
  'BibTeX import; preamble with def create problems #732',
  'Endnote should parse',
  'Failure to handle unparsed author names (92)',
  'Import fails to perform @String substitutions #154',
  'Import location to event-place for conference papers',
  'Import of langle and rangle TeX commands #1468',
  'Import support for the online type in BBT #1358',
  'Issues with round instead of curly braces do not import correctly #871',
  'Jabref groups import does not work #717.2.10',
  'Jabref groups import does not work #717.3.8',
  'LaTeX commands in Zotero should be exported untouched #1380',
  'LaTeX commands in Zotero should be exported untouched #1380.roundtrip',
  'Math formatting lost on import #627',
  'Math markup to unicode not always imported correctly #472',
  'Math markup to unicode not always imported correctly #472.roundtrip',
  'Options to use default import process? #1562',
  'Overline during Import #1467',
  'Problem when importing BibTeX entries with square brackets #94',
  'Some bibtex entries quietly discarded on import from bib file #873',
  'Title of German entry converted to lowercase during import #1350',
  'Unabbreviate on import #1436-1',
  'Wrong ring-above import #1115',
  'eprinttype field dropped on import #959',
  'importing a title-cased bib #1246',
  'support Local-Zo-Url-x field from BibDesk2Zotero_attachments #667',
  'zbb (quietly) chokes on this .bib #664'
])

for (const name in fixtures) {
  const fixture = fixtures[name]

  if (ignore.has(name)) {
    console.log(`[\u001b[31mSKIP\u001b[0m] ${name}`)
    continue
  }

  try {
    const result = parser._intoFixtureOutput(parser.parse(fixture.input))
    assert.deepEqual(result, fixture.output)
    if (ignore.has(name)) {
      console.log(`[\u001b[34mPASS\u001b[0m] ${name}`)
    } else {
      console.log(`[\u001b[32mPASS\u001b[0m] ${name}`)
    }
  } catch (e) {
    console.log()
    console.log(`[\u001b[31mFAIL\u001b[0m] ${name}`)
    console.log('============================================')
    console.error(e.message)
    console.log()
    console.log()
    process.exit(1)
  }
}
