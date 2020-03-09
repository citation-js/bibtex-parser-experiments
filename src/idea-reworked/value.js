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
        const text = this.consumeRule('Text').replace(/^{|}$/g, '')
        output += constants.mathScripts[script][text[0]] + text.slice(1)
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

    // command
    if (command in constants.commands) {
      return constants.commands[command]

    // diacritics
    } else if (command in constants.diacritics && !this.matchEndOfFile()) {
      if (this.matchToken('text')) {
        const text = this.consumeToken('text').value
        return text[0] + constants.diacritics[command] + text.slice(1)
      } else {
        return this.consumeRule('Text') + constants.diacritics[command]
      }

    // escapes
    } else if (/^\W$/.test(command)) {
      return command

    // unknown commands
    } else {
      return '\\' + command
    }
  }
})

export function parse (text) {
  return valueGrammar.parse(lexer.reset(text))
}
