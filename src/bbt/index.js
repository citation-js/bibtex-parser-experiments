import { parse as parseBibtex } from '@retorquere/bibtex-parser'

export function parse (text) {
  return parseBibtex(text, {
    errorHandler (err) {
      if (err.name === 'TeXError') return // ignore unhandled TeX constructs
      throw err
    }
  })
}

function normalize(value) {
  return (typeof value === 'string') ? value.normalize('NFC') : value
}

function _astToText (value) {
  if (value.length === 1) {
    return normalize(value[0])
  } else {
    return value.map(normalize)
  }
}

function fieldsObject(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, _astToText(value)]))
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

function creatorsObject(creators) {
  return Object.fromEntries(Object.entries(creators).map(([type, names]) => [type, names.map(creatorObject)]))
}

export function _intoFixtureOutput (result) {
  // console.log(result)
  return result.entries.map(({ key, type, fields, creators}) => ({
    type,
    id: key,
    properties: Object.assign(fieldsObject(fields), creatorsObject(creators)),
  }))
}
