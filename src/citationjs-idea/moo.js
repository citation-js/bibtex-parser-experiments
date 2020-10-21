import moo from 'moo'

// see https://github.com/no-context/moo/pull/85
function caseInsensitiveKeywords (map) {
  let transform = moo.keywords(map)
  return text => transform(text.toLowerCase())
}

/*
// Adpated from [Astrocite BibTeX](https://github.com/dsifford/astrocite/blob/668a9e4a0cb15a21a310d38e6e3f9ec5af7db9a0/packages/astrocite-bibtex/src/constants.ts#L6-L22)
// Accessed 2018-02-18
const diacritics = {
  '`': '\u0300',
  '\'': '\u0301',
  '^': '\u0302',
  '~': '\u0303',
  '=': '\u0304',
  '\'': '\u0308',
  'c': '\u0327',
  'b': '\u0331',
  'u': '\u0306',
  'v': '\u030c',
  '.': '\u0307',
  'd': '\u0323',
  'r': '\u030a',
  'H': '\u030b',
  'k': '\u0328'
}

const math = {match: /$.+?$/, }
const command ={match: /\\[A-Za-z]+/, }
const diacriticExtra = {
  match: /\\[`'"^=~.](?:{(?:\\[a-z]+|[a-z])}|(?:\\[a-z]+|[a-z]))/i,
  value: () => ``
}
const diacriticExtra = {
  match: /\\[bcdHkruv](?:{(?:\\[a-z]+|[a-z])}|\\[a-z]+| [a-z])/i,
  value: () => ``
}
const symbol = {
  match: ['---', '--', '\'\'\'', '\'\'', '```', '``', '!!', '?!', '!?', 'TEL', '\\~', '~'],

}*/

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
      match: /[^\s{}()]+/,
      type: caseInsensitiveKeywords({
        entryTypeRef: [
          'article',
          'booklet',
          'book',
          'conference',
          'electronic',
          'inbook',
          'incollection',
          'inproceedings',
          'manual',
          'mastersthesis',
          'misc',
          'phdthesis',
          'proceedings',
          'techreport',
          'unpublished'
        ],
        entryTypeString: 'string',
        entryTypePreamble: 'preamble'
      })
    }
  },
  entryBody: {
    quote: {match: '"', push: 'entryQuoteString'},
    lbracket: {match: '{', push: 'entryBracketString'},
    identifier: /[^\s=,{}()"]+/,
    number: /-?\d+(?:.\d+)?/,
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
    text: {match: /[^"{}]+/, lineBreaks: true},
    // comment: {match: /%.*$/, lineBreaks: false}
  },
  entryBracketString: {
    lbracket: {match: '{', push: 'entryBracketString'},
    rbracket: {match: '}', pop: true},
    text: {match: /[^{}]+/, lineBreaks: true},
    // comment: {match: /%.*$/, lineBreaks: false}
  }
})
