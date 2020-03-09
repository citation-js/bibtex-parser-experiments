import { BibLatexParser } from 'biblatex-csl-converter'

export function parse (input) {
  const parser = new BibLatexParser(input, { processUnexpected: true, processUnknown: true })
  return parser.parse()
}

function _astToText (value) {
  if (Array.isArray(value)) {
    const values = value.map(value => _astToText(value))
    if (value[0].literal) {
      return values
    } else {
      return values.join('')
    }
  } else if (value.literal) {
    return _astToText(value.literal)
  } else {
    switch (value.type) {
      case 'text':
        return value.text
      default:
        console.log(value)
        return ''
    }
  }
}

export function _intoFixtureOutput (result) {
  return Object.values(result.entries).map(({ bib_type, entry_key, fields }) => ({
    type: bib_type,
    id: entry_key,
    properties: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, _astToText(value)]))
  }))
}
