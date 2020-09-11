import * as grammar from './grammar'

export function parse (text) {
  return grammar.parse(text)
}

function creatorObject(creator) {
  const name = {}

  if (creator.firstName) { name.given = creator.firstName }
  if (creator.prefix) { name.prefix = creator.prefix }
  if (creator.suffix) { name.suffix = creator.suffix }
  if (creator.initial) { name['given-i'] = creator.initial }
  if (creator.lastName) {
    name.family = creator.lastName
    return name
  } else {
    return { family: creator.literal }
  }
}

export function _intoFixtureOutput (result) {
  return result.map(({ itemID, itemType, ...entry }) => ({
    type: itemType,
    id: itemID,
    properties: {
      ...(entry.title && { title: entry.title }),
      ...(entry.creators.length && { author: entry.creators.map(creatorObject) }),
    }
  }))
}
