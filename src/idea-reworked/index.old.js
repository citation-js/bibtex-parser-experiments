/**
 * @module input/bibtex
 */

import moo from 'moo'
import TokenStack from './stack'
import varBibTeXTokens from './tokens.json'

const logger = console

const whitespace = { match: /\s+/, lineBreaks: true }
const identifier = /[a-zA-Z][a-zA-Z0-9_-]*/
const text = {
  command: /\\[a-z]+ ?/,
  escape: /\\./,
  lbrace: { match: '{', push: 'bracedLiteral' },
  rbrace: { match: '}', pop: true },
  mathShift: { match: '$', push: 'mathLiteral' }
}

const patterns = {
  main: {
    junk: { match: /@comment.+|[^@]+/, lineBreaks: true },
    at: { match: '@', push: 'entry' }
  },
  entry: {
    whitespace,
    entryType: identifier,
    lbrace: { match: /[{(]/, next: 'entryContents' }
  },
  entryContents: {
    whitespace,
    label: /[^,\s]+/,
    comma: { match: ',', next: 'fields' }
  },
  fields: {
    whitespace,
    field: identifier,
    number: /-?\d+/,
    hash: '#',
    equals: '=',
    comma: ',',
    comment: /%.*/,
    quote: { match: '"', push: 'quotedLiteral' },
    lbrace: { match: '{', push: 'bracedLiteral' },
    rbrace: { match: /[})]/, pop: true }
  },
  quotedLiteral: {
    ...text,
    text: { match: /[^{}"\\]+/, lineBreaks: true },
    quote: { match: '"', pop: true }
  },
  bracedLiteral: {
    ...text,
    text: { match: /[^{}\\$]+/, lineBreaks: true }
  },
  mathLiteral: {
    ...text,
    text: /./,
    matchShift: { match: '$', pop: true }
  }
}

// function * getTokenizedBibtex (str) {
//   const states = []
//   let match
//   while ((match = lexer.exec(str))) {
//     const [type, token] = Object.entries(match.groups).find(([type, token]) => token)
//
//     if (token === '{') { states.unshift('braced') }
//     switch (states[0]) {
//       case 'main':
//         if (token === '"') { states.unshift('quoted') }
//         break
//       case 'braced':
//         if (token === '}') { states.shift() }
//       case 'braced':
//         if (token === '}') { states.shift() }
//     }
//
//     yield { type, token }
//   }
// }

const lexer = moo.states(patterns)

function * getTokenizedBibtex (str) {
  lexer.reset(str)
  let match
  while ((match = lexer.next())) {
    yield match
  }
}

function parseValue (stack) {
  if (stack.peek().type === 'quote') {
    stack.consume('quote')
    value = ''
    while (!stack.match('quote')) {
      value += parseLiteral(stack)
    }
    stack.consume('quote')
  } else if (stack.peek().type === 'lbrace') {
    stack.consume('lbrace')
    value = ''
    while (!stack.consume('rbrace')) {
      value += parseLiteral(stack)
    }
    stack.consume('rbrace')
  } else {
    value = stack.consume('number').value
  }
}

function parseEntry (stack) {}

function parseFile (str) {
  const entries = []
  const tokens = getTokenizedBibtex(str)
  const stack = new TokenStack(tokens)

  try {
    stack.consumeOptional('junk')

    while (stack.tokensLeft()) {
      stack.consume('at', { spaced: true })

      const type = stack.consume('entryType').value

      // TODO: check if matches with rbrace
      stack.consume('lbrace', { spaced: true })

      const label = stack.consume('label')

      stack.consume('comma', { spaced: true })

      const properties = {}

      while (true) {
        const key = stack.consume('field')

        stack.consume('equals', { spaced: true })

        let value



        // Last entry (no trailing comma)
        if (stack.matches('}')) { break }

        stack.consume('comma', { spaced: true })

        // Last entry (trailing comma)
        if (stack.matches('}')) { break }
      }

      stack.consumeToken('}', {spaced: false})
      stack.consumeWhitespace()

      // records can be also ended with comma
      if (stack.matches(',')) {
        stack.consumeToken(',')
        stack.consumeWhitespace()
      }

      entries.push({type, label, properties})
    }
  } catch (e) {
    logger.error(`Uncaught SyntaxError: ${e.message}. Returning completed entries.`)

    // Remove last, possibly incomplete entry
    entries.pop()
  }

  return entries
}

export {
  parseBibTeX as parse,
  parseBibTeX as default
}
