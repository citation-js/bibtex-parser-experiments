import moo from 'moo'
import { Grammar } from './grammar'
import * as constants from './constants'
import { orderNamePieces, formatNameParts, getStringCase } from './name'

const text = {
  command: /\\(?:[a-z]+|.) */,
  lbrace: { match: '{', push: 'bracedLiteral' },
  mathShift: { match: '$', push: 'mathLiteral' },
  whitespace: { match: /[\s~]+/, lineBreaks: true }
}

const lexer = moo.states({
  stringLiteral: {
    ...text,
    text: /[^{$}\s~\\]+/
  },
  namesLiteral: {
    and: ' and ',
    comma: ',',
    hyphen: '-',
    equals: '=',
    ...text,
    text: /[^{$}\s~\\,=-]+/
  },
  listLiteral: {
    and: ' and ',
    ...text,
    text: /[^{$}\s~\\]+/
  },
  separatedLiteral: {
    comma: ',',
    ...text,
    text: /[^{$}\s~\\,]+/
  },
  bracedLiteral: {
    ...text,
    rbrace: { match: '}', pop: true },
    text: /[^{$}\s~\\]+/
  },
  mathLiteral: {
    ...text,
    mathShift: { match: '$', pop: true },
    script: /[\^_]/,
    text: /[^{$}\s~\\\^_]+/
  }
})

export const valueGrammar = new Grammar({
  String () {
    let output = ''
    while (!this.matchEndOfFile()) {
      output += this.consumeRule('Text')
    }
    return output
  },

  StringNames () {
    const list = []

    while (true) {
      this.consumeToken('whitespace', true)
      list.push(this.consumeRule('Name'))
      this.consumeToken('whitespace', true)

      if (this.matchEndOfFile()) {
        return list
      } else {
        this.consumeToken('and')
      }
    }
  },

  Name () {
    const pieces = []

    while (true) {
      pieces.push(this.consumeRule('NamePiece'))

      if (this.matchEndOfFile() || this.matchToken('and')) {
        return orderNamePieces(pieces)
      } else {
        this.consumeToken('comma')
        this.consumeToken('whitespace', true)
      }
    }
  },

  NamePiece () {
    const parts = []

    while (true) {
      const part = this.consumeRule('NameToken')

      if (part.label) {
        part.label = formatNameParts([...parts, { value: part.label }])
        return [part]
      }

      parts.push(part)

      if (this.matchEndOfFile() || this.matchToken('and') || this.matchToken('comma')) {
        return parts
      } else {
        while (this.matchToken('hyphen') || this.matchToken('whitespace')) {
          this.consumeToken()
        }
      }
    }
  },

  NameToken () {
    let upperCase = null
    let value = ''

    while (true) {
      // If needed, test regular text for case
      if (upperCase === null && this.matchToken('text')) {
        const text = this.consumeToken().value
        value += text
        upperCase = getStringCase(text)

      // If end of name part, return up
      } else if (this.matchEndOfFile() || this.matchToken('and') || this.matchToken('comma') || this.matchToken('whitespace')) {
        return { value, upperCase }

      // Same for hyphen, but note it is hyphenated
      } else if (this.matchToken('hyphen')) {
        return { value, upperCase, hyphenated: true }

      // If equals we are in BibLaTeX extended mode
      // 'family=Last, given=First, prefix=von'
      } else if (this.matchToken('equals')) {
        this.consumeToken('equals')
        const text = this.consumeRule('NamePiece')
        if (text[0].label) { value += '=' + text[0].label }
        return { value: formatNameParts(text), label: value }

      // Else consume other text
      } else {
        value += this.consumeRule('Text')
      }
    }
  },

  StringList () {
    let list = []
    while (!this.matchEndOfFile()) {
      let output = ''
      while (!this.matchEndOfFile() && !this.matchToken('and')) {
        output += this.consumeRule('Text')
      }
      list.push(output)

      this.consumeToken('and', true)
    }
    return list.length === 1 ? list[0] : list
  },

  StringSeparated () {
    let list = []
    while (!this.matchEndOfFile()) {
      let output = ''
      while (!this.matchEndOfFile() && !this.matchToken('comma')) {
        output += this.consumeRule('Text')
      }
      list.push(output.trim())

      this.consumeToken('comma', true)
      this.consumeToken('whitespace', true)
    }
    return list
  },

  StringVerbatim () {
    let output = ''
    while (!this.matchEndOfFile()) {
      output += this.consumeToken().value
    }
    return output
  },

  StringUri () {
    const uri = this.consumeRule('StringVerbatim')
    try {
      if (decodeURI(uri) === uri) {
        return encodeURI(uri)
      } else {
        return uri
      }
    } catch (e) {
      // malformed URI
      return uri
    }
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
      if (this.matchToken('script')) {
        const script = this.consumeToken('script').value
        const text = this.consumeRule('Text').replace(/^{|}$/g, '').split('')
        if (text.every(char => char in constants.mathScripts[script])) {
          output += text.map(char => constants.mathScripts[script][char]).join('')
        } else {
          output += formatting[script].join(text.join(''))
        }
      } else {
        output += this.consumeRule('Text')
      }
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
      const token = this.consumeToken('whitespace').value
      return token[0] === '~' ? '\xa0' : ' ' // Non-breakable space

    } else if (this.matchToken('command')) {
      return this.consumeRule('Command')

    } else {
      return this.consumeToken('text').value.replace(
        constants.ligaturePattern,
        ligature => constants.ligatures[ligature]
      )
    }
  },

  Command () {
    const command = this.consumeToken('command').value.slice(1).trimEnd()

    // formatting envs
    if (command in constants.formattingEnvs) {
      const text = this.consumeRule('Env')
      const markup = constants.formatting[constants.formattingEnvs[command]]
      return markup.join(text)

    // formatting commands
    } else if (command in constants.formattingCommands) {
      const text = this.consumeRule('BracketString')
      const markup = constants.formatting[constants.formattingCommands[command]]
      return markup.join(text)

    // commands
    } else if (command in constants.commands) {
      return constants.commands[command]

    // diacritics
    } else if (command in constants.diacritics && !this.matchEndOfFile()) {
      const text = this.consumeRule('Text')
      const diacritic = text[0] + constants.diacritics[command]
      return diacritic.normalize('NFC') + text.slice(1)

    // escapes
    // TODO exclude backslash, tilde
    } else if (/^\W$/.test(command)) {
      return command

    // unknown commands
    } else {
      return '\\' + command
    }
  },

  Env () {
    let output = ''
    while (!this.matchToken('rbrace')) {
      if (this.matchEndOfFile()) {
        break
      }

      if (this.matchToken('command')) {
        // test for \end{}, \bf etc.
      }

      output += this.consumeRule('Text')
    }
    return output
  }
})

function getMainRule (fieldType) {
  if (fieldType[1] === 'name') {
    return fieldType[0] === 'list' ? 'StringNames' : 'Name'
  }

  switch (fieldType[0] === 'field' ? fieldType[1] : fieldType[0]) {
    case 'list':
      return 'StringList'
    case 'separated':
      return 'StringSeparated'
    case 'verbatim':
      return 'StringVerbatim'
    case 'uri':
      return 'StringUri'
    default:
      return 'String'
  }
}

function getLexerState (fieldType) {
  if (fieldType[1] === 'name') {
    return 'namesLiteral'
  }

  switch (fieldType[0]) {
    case 'list':
      return 'listLiteral'
    case 'separated':
      return 'separatedLiteral'
    default:
      return 'stringLiteral'
  }
}

export function parse (text, field) {
  const fieldType = constants.fieldTypes[field] || []
  return valueGrammar.parse(lexer.reset(text, {
    state: getLexerState(fieldType)
  }), getMainRule(fieldType))
}
