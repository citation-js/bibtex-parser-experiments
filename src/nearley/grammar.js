// Generated automatically by nearley, version 2.19.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

  const moo = require('moo')

  const whitespace = { match: /\s+/, lineBreaks: true }
  const identifier = /[a-zA-Z][a-zA-Z0-9_-]*/
  const text = {
    command: /\\[a-z]+ ?/,
    escape: /\\./,
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
      identifier,
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
      quote: { match: '"', pop: true },
      text: /./
    },
    bracedLiteral: {
      ...text,
      rbrace: { match: '}', pop: true },
      text: /./
    },
    mathLiteral: {
      ...text,
      matchShift: { match: '$', pop: true },
      text: /./
    }
  })
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "main$ebnf$1$subexpression$1", "symbols": [(lexer.has("junk") ? {type: "junk"} : junk)]},
    {"name": "main$ebnf$1$subexpression$1", "symbols": ["entry"]},
    {"name": "main$ebnf$1", "symbols": ["main$ebnf$1$subexpression$1"]},
    {"name": "main$ebnf$1$subexpression$2", "symbols": [(lexer.has("junk") ? {type: "junk"} : junk)]},
    {"name": "main$ebnf$1$subexpression$2", "symbols": ["entry"]},
    {"name": "main$ebnf$1", "symbols": ["main$ebnf$1", "main$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "main", "symbols": ["main$ebnf$1"], "postprocess": tokens => tokens[0].map(tokens => tokens[0]).filter(entry => typeof entry === 'object')},
    {"name": "entry$subexpression$1", "symbols": ["stringEntry"]},
    {"name": "entry$subexpression$1", "symbols": ["preambleEntry"]},
    {"name": "entry$subexpression$1", "symbols": ["dataEntry"]},
    {"name": "entry", "symbols": ["entry$subexpression$1"], "postprocess": tokens => tokens[0][0]},
    {"name": "stringEntry", "symbols": [(lexer.has("at") ? {type: "at"} : at), "_", {"literal":"string"}, "_", (lexer.has("lbrace") ? {type: "lbrace"} : lbrace), "_", "field", "_", (lexer.has("rbrace") ? {type: "rbrace"} : rbrace)]},
    {"name": "preambleEntry", "symbols": [(lexer.has("at") ? {type: "at"} : at), "_", {"literal":"preamble"}, "_", (lexer.has("lbrace") ? {type: "lbrace"} : lbrace), "_", "expression", "_", (lexer.has("rbrace") ? {type: "rbrace"} : rbrace)]},
    {"name": "dataEntry", "symbols": [(lexer.has("at") ? {type: "at"} : at), "_", (lexer.has("entryType") ? {type: "entryType"} : entryType), "_", (lexer.has("lbrace") ? {type: "lbrace"} : lbrace), "_", (lexer.has("label") ? {type: "label"} : label), "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "fields", "_", (lexer.has("rbrace") ? {type: "rbrace"} : rbrace)], "postprocess": 
        function (tokens) {
          return {
            type: tokens[2].value,
            label: tokens[6].value,
            fields: tokens[10]
          }
        }
        },
    {"name": "fields$ebnf$1", "symbols": []},
    {"name": "fields$ebnf$1", "symbols": ["fields$ebnf$1", "field_"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "fields$ebnf$2$subexpression$1", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma)]},
    {"name": "fields$ebnf$2", "symbols": ["fields$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "fields$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "fields", "symbols": ["fields$ebnf$1", "field", "fields$ebnf$2"], "postprocess": tokens => Object.fromEntries([...tokens[0], tokens[1]])},
    {"name": "field_", "symbols": ["field", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_"], "postprocess": id},
    {"name": "field", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "_", (lexer.has("equals") ? {type: "equals"} : equals), "_", "expression"], "postprocess": tokens => [tokens[0], tokens[4]]},
    {"name": "expression", "symbols": ["value", "_", (lexer.has("hash") ? {type: "hash"} : hash), "_", "expression"], "postprocess": tokens => tokens[0] + tokens[4]},
    {"name": "expression", "symbols": ["value"], "postprocess": id},
    {"name": "value$subexpression$1", "symbols": ["numeric"]},
    {"name": "value$subexpression$1", "symbols": ["identifier"]},
    {"name": "value$subexpression$1", "symbols": ["quoted"]},
    {"name": "value$subexpression$1", "symbols": ["braced"]},
    {"name": "value", "symbols": ["value$subexpression$1"], "postprocess": tokens => tokens[0][0]},
    {"name": "numeric", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": tokens => tokens[0].value},
    {"name": "identifier", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": tokens => tokens[0].value /* TODO */},
    {"name": "quoted$ebnf$1", "symbols": []},
    {"name": "quoted$ebnf$1", "symbols": ["quoted$ebnf$1", "contents"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "quoted", "symbols": [(lexer.has("quote") ? {type: "quote"} : quote), "quoted$ebnf$1", (lexer.has("quote") ? {type: "quote"} : quote)], "postprocess": tokens => tokens[1].join('')},
    {"name": "braced$ebnf$1", "symbols": []},
    {"name": "braced$ebnf$1", "symbols": ["braced$ebnf$1", "contents"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "braced", "symbols": [(lexer.has("lbrace") ? {type: "lbrace"} : lbrace), "braced$ebnf$1", (lexer.has("rbrace") ? {type: "rbrace"} : rbrace)], "postprocess": tokens => tokens[1].join('')},
    {"name": "math$ebnf$1", "symbols": []},
    {"name": "math$ebnf$1", "symbols": ["math$ebnf$1", "contents"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "math", "symbols": [(lexer.has("mathShift") ? {type: "mathShift"} : mathShift), "math$ebnf$1", (lexer.has("mathShift") ? {type: "mathShift"} : mathShift)], "postprocess": tokens => tokens[1].join('') /* TODO */},
    {"name": "contents", "symbols": [(lexer.has("command") ? {type: "command"} : command)], "postprocess": tokens => tokens[0].value /* TODO */},
    {"name": "contents", "symbols": [(lexer.has("escape") ? {type: "escape"} : escape)], "postprocess": tokens => tokens[0].value /* TODO */},
    {"name": "contents", "symbols": ["braced"], "postprocess": tokens => `{${tokens[0]}}`},
    {"name": "contents", "symbols": ["math"], "postprocess": tokens => tokens[0].value},
    {"name": "contents", "symbols": [(lexer.has("text") ? {type: "text"} : text)], "postprocess": tokens => tokens[0].value},
    {"name": "contents", "symbols": [(lexer.has("whitespace") ? {type: "whitespace"} : whitespace)], "postprocess": tokens => ' '},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", (lexer.has("whitespace") ? {type: "whitespace"} : whitespace)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"]}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
