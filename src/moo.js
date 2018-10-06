import moo from 'moo'

export const commandPatterns = {

}

export const lexer = moo.states({
  main: {
    comment: [/^(%|@comment(?=\W)).+$/],
    entryStart: {
      match: '@',
      push: 'entryType'
    },
    entryDelimiter: /,/,
    junk: /^[^@].*$/,
    whitespace: {match: /\s+/, lineBreaks: true}
  },
  entryType: {
    entryType: {
      match: /[A-Za-z]+/,
      type: moo.keywords({
        entryTypeString: 'string',
        preambleTypeString: 'preamble'
      })
    },
    entryBodyStart: {
      match: '{',
      next: 'entryBody'
    },
    whitespace: /[ \t]*/
  },
  entryBody: {
    quoteStringStart: {match: '"', push: 'entryQuoteString'},
    bracketStringStart: {match: '{', push: 'entryBracketString'},
    concatOperator: /#/,
    number: /-?\d+(.\d+)?/,
    identifier: /[A-Za-z][-\W]*/,
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
    text: {match: /[^}%]/, lineBreaks: true},
    comment: /%.*$/
  },
  entryBracketString: {
    bracketStringStart: {match: '{', push: 'entryBracketString'},
    bracketStringEnd: {match: '}', pop: true},
    text: {match: /[^%]/, lineBreaks: true},
    comment: /%.*$/
  }
})
