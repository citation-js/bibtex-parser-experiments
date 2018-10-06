import moo from 'moo'

export const commandPatterns = {

}

export const lexer = moo.states({
  main: {
    comment: /^(?:%|@comment(?=\W)).+$/,
    entryStart: {
      match: '@',
      push: 'entryType'
    },
    entryDelimiter: /,/,
    whitespace: {match: /\s+/, lineBreaks: true},
    junk: {match: /^[^@].*$/, lineBreaks: true}
  },
  entryType: {
    entryType: {
      match: /[A-Za-z]+/,
      keywords: {
        entryTypeString: 'string',
        preambleTypeString: 'preamble'
      }
    },
    entryBodyStart: {
      match: '{',
      next: 'entryBody'
    },
    whitespace: /[ \t]+/
  },
  entryBody: {
    quoteStringStart: {match: '"', push: 'entryQuoteString'},
    bracketStringStart: {match: '{', push: 'entryBracketString'},
    number: /-?\d+(?:.\d+)?/,
    identifier: /[A-Za-z][-\w]*/,
    comma: ',',
    concatOperator: '#',
    equals: '=',
    entryEnd: {
      match: '}',
      pop: true
    },
    comment: /%.*$/,
    whitespace: {match: /\s+/, lineBreaks: true}
  },
  entryQuoteString: {
    quoteStringEnd: {match: '"', pop: true},
    bracketStringStart: {match: '{', push: 'entryBracketString'},
    text: {match: /[^"{}%]+/, lineBreaks: true},
    comment: {match: /%.*$/, lineBreaks: false}
  },
  entryBracketString: {
    bracketStringStart: {match: '{', push: 'entryBracketString'},
    bracketStringEnd: {match: '}', pop: true},
    text: {match: /[^{}%]+/, lineBreaks: true},
    comment: {match: /%.*$/, lineBreaks: false}
  }
})
