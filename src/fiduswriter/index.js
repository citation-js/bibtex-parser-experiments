import { BibLatexParser } from 'biblatex-csl-converter'

export function parse (input) {
  const parser = new BibLatexParser(input, { processUnexpected: true, processUnknown: true })
  return parser.parse()
}
