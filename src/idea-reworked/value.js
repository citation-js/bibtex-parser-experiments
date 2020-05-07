import moo from 'moo'
import { Grammar } from './grammar'
import * as constants from './constants'

const text = {
  command: /\\(?:[a-z]+|.) */,
  lbrace: { match: '{', push: 'bracedLiteral' },
  mathShift: { match: '$', push: 'mathLiteral' },
  whitespace: { match: /\s+/, lineBreaks: true }
}

const lexer = moo.states({
  stringLiteral: {
    and: ' and ',
    ...text,
    text: /[^{$}\s\\]+/
  },
  bracedLiteral: {
    ...text,
    rbrace: { match: '}', pop: true },
    text: /[^{$}\s\\]+/
  },
  mathLiteral: {
    ...text,
    mathShift: { match: '$', pop: true },
    script: /[\^_]/,
    text: /[^{$}\s\\\^_]+/
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

  StringList () {
    let list = []
    let output = ''
    while (!this.matchEndOfFile()) {
      if (this.matchToken('and')) {
        this.consumeToken('and')
        list.push(output)
        output = ''
      } else {
        output += this.consumeRule('Text')
      }
    }
    list.push(output)
    return list
  },

  StringSeparated () {
    let list = []
    let output = ''
    while (!this.matchEndOfFile()) {
      if (this.matchToken('text')) {
        const [prefix, ...parts] = this.consumeToken('text').split(',')
        list.push(output + prefix)
        if (parts.length) {
          output = parts.pop()
          list.push(...parts)
        } else {
          output = ''
        }
      } else {
        output += this.consumeRule('Text')
      }
    }
    list.push(output)
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
      this.consumeToken('whitespace')
      return ' '

    } else if (this.matchToken('and')) {
      this.consumeToken('and')
      return ' and '

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

function getStringRule (fieldType) {
  switch (fieldType) {
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

export function parse (text, field) {
  const mainRule = getStringRule(constants.fieldTypes[field])
  return valueGrammar.parse(lexer.reset(text), mainRule)
}
