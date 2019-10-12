import { parse as parseBibtex } from '@retorquere/bibtex-parser'

export function parse (text) {
  return parseBibtex(text, {
    errorHandler (message) {
      if (/Unhandled (command|{\\r .})/.test(message)) {
        // skip some non-fatal errors
      } else {
        throw new SyntaxError(message)
      }
    }
  })
}
