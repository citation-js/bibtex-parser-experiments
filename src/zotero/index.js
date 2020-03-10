import * as grammar from './grammar'

export function parse (text) {
  return grammar.parse(text)
}

export function _intoFixtureOutput (result) {
  return result.map(({ itemID, itemType, ...entry }) => ({
    type: itemType,
    id: itemID,
    properties: {
      ...(entry.title && { title: entry.title }),
      ...(entry.creators.length && { author: entry.creators.map(a => a.firstName + ' ' + a.lastName) }),
    }
  }))
}
