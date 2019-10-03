import {lexer} from './moo'
import {Grammar} from './grammar'

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

export const bibtexGrammar = new Grammar({
  Main () {
    let entries = []

    while (!this.matchEndOfFile()) {
      entries.push(this.consumeAnyRule(['Entry', 'Junk']))
    }

    return entries.filter(Boolean)
  },

  Junk () {
    let oldIndex

    while (oldIndex !== this.index) {
      oldIndex = this.index
      this.consumeToken('spaceVer', true)
      this.consumeToken('comment', true)
      this.consumeToken('junk', true)
    }

    if (!this.matchToken('at') && !this.matchEndOfFile()) {
      // TODO: trigger error
      this.consumeToken('at')
    }
  },

  Entry () {
    this.consumeToken('at')
    this.consumeToken('spaceHor', true)

    let type = this.consumeToken('entryTypeRef').value

    this.consumeToken('spaceHor', true)

    let endingChar
    if (this.consumeToken('lbracket', true)) {
      endingChar = 'rbracket'
    } else if (this.consumeToken('lparen', true)) {
      endingChar = 'rparen'
    } else {
      // TODO: trigger error
      this.consumeToken('lbracket')
    }

    this.consumeToken('whitespace', true)

    let label = this.consumeToken('identifier').value

    this.consumeToken('whitespace', true)
    this.consumeToken('comma')
    this.consumeToken('whitespace', true)

    let properties = this.consumeRule('EntryBody')

    this.consumeToken(endingChar)
    this.consumeToken('comma', true)

    return {type, label, properties}
  },

  EntryBody () {
    let properties = {}
    this.consumeToken('whitespace', true)

    while (this.matchToken('identifier')) {
      let [field, value] = this.consumeRule('Field')
      properties[field] = value
      this.consumeToken('whitespace', true)

      if (this.consumeToken('comma', true)) {
        this.consumeToken('whitespace', true)
      } else {
        break
      }
    }

    return properties
  },

  Field () {
    let field = this.consumeToken('identifier').value

    this.consumeToken('whitespace', true)
    this.consumeToken('equals')
    this.consumeToken('whitespace', true)

    let value =
      +(this.consumeToken('number', true) || {}).value ||
      this.consumeRule('Expression')

    return [field, value]
  },

  Expression () {
    let output = this.consumeRule('ExpressionPart')
    this.consumeToken('whitespace', true)

    while (this.matchToken('hashtag')) {
      this.consumeToken('hashtag')
      this.consumeToken('whitespace', true)
      output += this.consumeRule('ExpressionPart')
      this.consumeToken('whitespace', true)
    }

    return output
  },

  ExpressionPart () {
    if (this.matchToken('identifier')) {
      return this.state.strings[this.consumeToken('identifier').value]
    } else {
      return this.consumeAnyRule(['QuoteString', 'BracketString'])
    }
  },

  QuoteString () {
    let output = ''
    this.consumeToken('quote')
    while (!this.matchToken('quote')) {
      this.consumeRule('Text')
    }
    this.consumeToken('quote')
    return output
  },

  BracketString () {
    let output = ''
    this.consumeToken('lbracket')
    while (!this.matchToken('rbracket')) {
      output += this.consumeRule('Text')
    }
    this.consumeToken('rbracket')
    return output
  },

  Text () {
    if (this.matchToken('lbracket')) {
      return this.consumeRule('BracketString')
    } else if (this.consumeToken('whitespace', true)) {
      return ' '
    } else if (this.matchToken('text')) {
      return this.consumeToken('text').value
    } else {
      return ''
    }
  }
}, {
  strings: Object.assign({}, defaultStrings)
})

export function parse (text) {
  return bibtexGrammar.parse(lexer.reset(text))
}
