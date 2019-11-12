import { parse as parseBibtex } from '@retorquere/bibtex-parser'

export function parse (text) {
  return parseBibtex(text, {
    errorHandler (err) {
      if (err.name === 'TeXError') return // ignore unhandled TeX constructs
      throw err
    }
  })
}
