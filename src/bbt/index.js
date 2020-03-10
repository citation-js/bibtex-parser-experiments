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

function creatorsObject(creators) {
  return Object.fromEntries(Object.entries(creators).map(([type, names]) => [type, names.map(name => name.lastName || name.literal)]))
}

export function _intoFixtureOutput (result) {
  // console.log(result)
  return result.entries.map(({ key, type, fields, creators}) => ({
    type,
    id: key,
    properties: Object.assign(fieldsObject(fields), creatorsObject(creators)),
  }))
}
