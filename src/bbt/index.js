import { parse as parseBibtex } from '@retorquere/bibtex-parser'

export function parse (text) {
  return parseBibtex(text, {
    errorHandler (err) {
      if (err.name === 'TeXError') return // ignore unhandled TeX constructs
      throw err
    }
  })
}

function _astToText (value) {
  if (value.length === 1) {
    return value[0]
  } else {
    return value
  }
}

export function _intoFixtureOutput (result) {
  // console.log(result)
  return result.entries.map(({ key, type, fields }) => ({
    type,
    id: key,
    properties: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, _astToText(value)]))
  }))
}
