import * as parser from './grammar'

export function parse (text) {
  return parser.parse(text)
}
