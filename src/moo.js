import moo from 'moo'

export const commandPatterns = {

}

export const lexer = moo.states({
  main: {
    at: '@',
    comma: ',',
    lbracket: {match: '{', push: 'entryBody'},
    lparen: {match: '(', push: 'entryBody'},
    spaceHor: /[ \t]+/,
    spaceVer: {match: /\s+/, lineBreaks: true},
    comment: /^(?:%|@comment(?=\W)).+$/,
    junk: {match: /^[^@].*$/, lineBreaks: true},
    identifier: {
      match: /[A-Za-z]+/,
      type: caseInsensitiveKeywords({
        entryTypeRef: ['article', 'booklet', 'book', 'conference', 'inbook', 'incollection', 'inproceedings', 'manual', 'mastersthesis', 'misc', 'phdthesis', 'proceedings', 'techreport', 'unpunlished'],
        entryTypeString: 'string',
        entryTypePreamble: 'preamble'
      })
    }
  },
  entryBody: {
    quote: {match: '"', push: 'entryQuoteString'},
    lbracket: {match: '{', push: 'entryBracketString'},
    number: /-?\d+(?:.\d+)?/,
    identifier: /[A-Za-z][-\w]*/,
    comma: ',',
    hashtag: '#',
    equals: '=',
    rbracket: {match: '}', pop: true},
    rparen: {match: ')', pop: true},
    comment: /%.*$/,
    whitespace: {match: /\s+/, lineBreaks: true}
  },
  entryQuoteString: {
    quote: {match: '"', pop: true},
    lbracket: {match: '{', push: 'entryBracketString'},
    text: {match: /[^"{}%]+/, lineBreaks: true},
    comment: {match: /%.*$/, lineBreaks: false}
  },
  entryBracketString: {
    lbracket: {match: '{', push: 'entryBracketString'},
    rbracket: {match: '}', pop: true},
    text: {match: /[^{}%]+/, lineBreaks: true},
    comment: {match: /%.*$/, lineBreaks: false}
  }
})
