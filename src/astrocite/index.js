import * as parser from './grammar'

export function parse (text) {
  return parser.parse(text)
}

function _astToText (value, strings) {
  if (Array.isArray(value)) {
    return value.map(value => _astToText(value, strings)).join('')
  } else {
    switch (value.kind) {
      case 'String':
        return strings[value.value.toLowerCase()]
      case 'Text':
      case 'Number':
        return value.value
      default:
        // console.log(value)
        return ''
    }
  }
}

export function _intoFixtureOutput (result) {
  const strings = {}
  return result.children
    .filter(({ kind, key, value }) => {
      if (kind === 'StringExpression') {
        strings[key.toLowerCase()] = _astToText(value, strings)
      }
      return kind === 'Entry'
    })
    .map(({ id, type, properties }) => ({
      type,
      id,
      properties: properties.reduce((props, { key, value }) => {
        props[key] = _astToText(value, strings)
        return props
      }, {})
    }))
}
