import nearley from 'nearley'
import grammar from './grammar'

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar))

export function parse (text) {
  parser.feed(text)
  const results = parser.results
  if (results.length > 1) {
    throw new Error('Ambigious parser, multiple results')
  } else {
    return results[0]
  }
}
