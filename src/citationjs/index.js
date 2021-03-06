import moo from 'moo'
import { Grammar } from './grammar'
import { fieldTypes, defaultStrings } from './constants'
import { parse as parseValue } from './value'

const identifier = /[a-zA-Z_][a-zA-Z0-9_:-]*/
const whitespace = {
  comment: /%.*/,
  whitespace: { match: /\s+/, lineBreaks: true }
}

const lexer = moo.states({
  main: {
    junk: { match: /@[cC][oO][mM][mM][eE][nN][tT].+|[^@]+/, lineBreaks: true },
    at: { match: '@', push: 'entry' }
  },
  entry: {
    ...whitespace,
    otherEntryType: {
      match: /[sS][tT][rR][iI][nN][gG]|[pP][rR][eE][aA][mM][bB][lL][eE]/,
      next: 'otherEntryContents'
    },
    dataEntryType: {
      match: identifier,
      next: 'dataEntryContents'
    },
  },
  otherEntryContents: {
    ...whitespace,
    lbrace: { match: /[{(]/, next: 'fields' }
  },
  dataEntryContents: {
    ...whitespace,
    lbrace: { match: /[{(]/, next: 'dataEntryContents' },
    label: /[^,\s]+/,
    comma: { match: ',', next: 'fields' }
  },
  fields: {
    ...whitespace,
    identifier,
    number: /-?\d+/,
    hash: '#',
    equals: '=',
    comma: ',',
    quote: { match: '"', push: 'quotedLiteral' },
    lbrace: { match: '{', push: 'bracedLiteral' },
    rbrace: { match: /[})]/, pop: true }
  },
  quotedLiteral: {
    lbrace: { match: '{', push: 'bracedLiteral' },
    quote: { match: '"', pop: true },
    text: { match: /(?:\\[\\{]|[^{"])+/, lineBreaks: true }
  },
  bracedLiteral: {
    lbrace: { match: '{', push: 'bracedLiteral' },
    rbrace: { match: '}', pop: true },
    text: { match: /(?:\\[\\{}]|[^{}])+/, lineBreaks: true }
  }
})

const delimiters = {
  '(': ')',
  '{': '}'
}

export const bibtexGrammar = new Grammar({
  Main () {
    let entries = []

    while (true) {
      while (this.matchToken('junk')) {
        this.consumeToken('junk')
      }

      if (this.matchEndOfFile()) {
        break
      }

      entries.push(this.consumeRule('Entry'))
    }

    return entries.filter(Boolean)
  },

  _ () {
    let oldToken
    while (oldToken !== this.token) {
      oldToken = this.token
      this.consumeToken('whitespace', true)
      this.consumeToken('comment', true)
    }
  },

  Entry () {
    this.consumeToken('at')
    this.consumeRule('_')

    const type = (
      this.matchToken('otherEntryType')
      ? this.consumeToken('otherEntryType')
      : this.consumeToken('dataEntryType')
    ).value.toLowerCase()

    this.consumeRule('_')
    const openBrace = this.consumeToken('lbrace').value
    this.consumeRule('_')

    let result

    if (type === 'string') {
      const [key, value] = this.consumeRule('Field')
      this.state.strings[key] = value
    } else if (type === 'preamble') {
      this.consumeRule('Expression')
    } else {
      const label = this.consumeToken('label').value

      this.consumeRule('_')
      this.consumeToken('comma')
      this.consumeRule('_')

      const properties = this.consumeRule('EntryBody')

      result = { type, label, properties }
    }

    this.consumeRule('_')
    const closeBrace = this.consumeToken('rbrace')
    if (closeBrace !== delimiters[openBrace]) {
      // logger.warn('[plugin-bibtex]', `entry started with "${openBrace}", but ends with "${closeBrace}"`)
    }

    return result
  },

  EntryBody () {
    let properties = {}

    while (this.matchToken('identifier')) {
      let [field, value] = this.consumeRule('Field')
      properties[field] = value

      this.consumeRule('_')
      if (this.consumeToken('comma', true)) {
        this.consumeRule('_')
      } else {
        break
      }
    }

    if (properties.language) {
      properties.language = parseValue(properties.language, 'language')
    }

    for (const field in properties) {
      if (typeof properties[field] === 'number') { continue }
      properties[field] = parseValue(properties[field], field, properties.language)
    }

    return properties
  },

  Field () {
    const field = this.consumeToken('identifier').value.toLowerCase()

    this.consumeRule('_')
    this.consumeToken('equals')
    this.consumeRule('_')

    let value = this.consumeRule('Expression')

    if (fieldTypes[field]?.[1] === 'title' && this.state.bracketStringLength === value.length) {
      value = value.slice(1, -1)
    }

    return [field, value]
  },

  Expression () {
    let output = this.consumeRule('ExpressionPart')
    this.consumeRule('_')

    while (this.matchToken('hash')) {
      this.consumeToken('hash')
      this.consumeRule('_')
      output += this.consumeRule('ExpressionPart').toString()
      this.consumeRule('_')
    }

    return output
  },

  ExpressionPart () {
    if (this.matchToken('identifier')) {
      const string = this.consumeToken('identifier').value
      return this.state.strings[string.toLowerCase()] || string
    } else if (this.matchToken('number')) {
      return parseInt(this.consumeToken('number'))
    } else if (this.matchToken('quote')) {
      return this.consumeRule('QuoteString')
    } else if (this.matchToken('lbrace')) {
      return this.consumeRule('BracketString')
    }
  },

  QuoteString () {
    let output = ''
    this.consumeToken('quote')
    while (!this.matchToken('quote')) {
      output += this.consumeRule('Text')
    }
    this.consumeToken('quote')
    return output
  },

  BracketString () {
    let output = ''
    this.consumeToken('lbrace')
    while (!this.matchToken('rbrace')) {
      output += this.consumeRule('Text')
    }
    this.consumeToken('rbrace')
    return output
  },

  Text () {
    if (this.matchToken('lbrace')) {
      const bracketString = `{${this.consumeRule('BracketString')}}`
      this.state.bracketStringLength = bracketString.length
      return bracketString
    } else {
      return this.consumeToken('text').value
    }
  }
}, {
  strings: defaultStrings
})

export function parse (text) {
  return bibtexGrammar.parse(lexer.reset(text))
}

export function _intoFixtureOutput (result) {
  return result.map(({ type, label, properties }) => ({ type, id: label, properties }))
}
