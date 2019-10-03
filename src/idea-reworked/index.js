import moo from 'moo'
import { Grammar } from './grammar'

const identifier = /[a-zA-Z][a-zA-Z0-9_-]*/
const whitespace = {
  comment: /%.*/,
  whitespace: { match: /\s+/, lineBreaks: true }
}
const text = {
  command: /\\(?:[a-z]+ ?|.)/,
  lbrace: { match: '{', push: 'bracedLiteral' },
  mathShift: { match: '$', push: 'mathLiteral' },
  whitespace: { match: /\s+/, lineBreaks: true }
}

const lexer = moo.states({
  main: {
    junk: { match: /@comment.+|[^@]+/, lineBreaks: true },
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
    ...text,
    quote: { match: '"', pop: true },
    text: /[^{$"\s\\]+/
  },
  bracedLiteral: {
    ...text,
    rbrace: { match: '}', pop: true },
    text: /[^{$}\s\\]+/
  },
  mathLiteral: {
    ...text,
    matchShift: { match: '$', pop: true },
    text: /./
  }
})

// Adapted from AstroCite BibTeX (accessed 2018-02-22)
// https://github.com/dsifford/astrocite/blob/668a9e4/packages/astrocite-bibtex/src/constants.ts#L112-L148
export const defaultStrings = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12',
  acmcs: 'ACM Computing Surveys',
  acta: 'Acta Informatica',
  cacm: 'Communications of the ACM',
  ibmjrd: 'IBM Journal of Research and Development',
  ibmsj: 'IBM Systems Journal',
  ieeese: 'IEEE Transactions on Software Engineering',
  ieeetc: 'IEEE Transactions on Computers',
  ieeetcad: 'IEEE Transactions on Computer-Aided Design of Integrated Circuits',
  ipl: 'Information Processing Letters',
  jacm: 'Journal of the ACM',
  jcss: 'Journal of Computer and System Sciences',
  scp: 'Science of Computer Programming',
  sicomp: 'SIAM Journal on Computing',
  tocs: 'ACM Transactions on Computer Systems',
  tods: 'ACM Transactions on Database Systems',
  tog: 'ACM Transactions on Graphics',
  toms: 'ACM Transactions on Mathematical Software',
  toois: 'ACM Transactions on Office Information Systems',
  toplas: 'ACM Transactions on Programming Languages and Systems',
  tcs: 'Theoretical Computer Science'
}

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
      // TODO warn
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

    return properties
  },

  Field () {
    const field = this.consumeToken('identifier')

    this.consumeRule('_')
    this.consumeToken('equals')
    this.consumeRule('_')

    const value = this.consumeRule('Expression')

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
      return this.state.strings[this.consumeToken('identifier').value] || ''
    } else if (this.matchToken('number')) {
      return parseInt(this.consumeToken('number'))
    } else if (this.matchToken('quote')){
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

  MathString () {
    let output = ''
    this.consumeToken('mathShift')
    while (!this.matchToken('mathShift')) {
      output += this.consumeRule('Text') // TODO %text handling
    }
    this.consumeToken('mathShift')
    return output
  },

  Text () {
    if (this.matchToken('lbrace')) {
      return this.consumeRule('BracketString')
    } else if (this.matchToken('mathShift')) {
      return this.consumeRule('MathString')
    } else if (this.matchToken('whitespace')) {
      return this.consumeToken('whitespace').value
    } else if (this.matchToken('command')) {
      return this.consumeToken('command').value // TODO
    } else if (this.matchToken('text')) {
      return this.consumeToken('text').value
    } else {
      return this.consumeToken('text')
    }
  }
}, {
  strings: Object.assign({}, defaultStrings)
})

export function parse (text) {
  return bibtexGrammar.parse(lexer.reset(text))
}
