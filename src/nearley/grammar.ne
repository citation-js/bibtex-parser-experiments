@{%
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
%}

@lexer lexer

main  -> (%junk | entry):+                              {% tokens => tokens[0].map(tokens => tokens[0]).filter(entry => typeof entry === 'object') %}
entry -> (stringEntry | preambleEntry | dataEntry)      {% tokens => tokens[0][0] %}

stringEntry   -> %at _ "string" _ %lbrace _ field _ %rbrace
preambleEntry -> %at _ "preamble" _ %lbrace _ expression _ %rbrace
dataEntry     -> %at _ %entryType _ %lbrace _ %label _ %comma _ fields _ %rbrace {%
  function (tokens) {
    return {
      type: tokens[2].value,
      label: tokens[6].value,
      fields: tokens[10]
    }
  }
%}

fields      -> field_:* field (_ %comma):?              {% tokens => Object.fromEntries([...tokens[0], tokens[1]]) %}
field_      -> field _ %comma _                         {% id %}
field       -> %identifier _ %equals _ expression       {% tokens => [tokens[0], tokens[4]] %}
expression  -> value _ %hash _ expression               {% tokens => tokens[0] + tokens[4] %}
             | value                                    {% id %}

value       -> (numeric | identifier | quoted | braced) {% tokens => tokens[0][0] %}
numeric     -> %number                                  {% tokens => tokens[0].value %}
identifier  -> %identifier                              {% tokens => tokens[0].value /* TODO */ %}
quoted      -> %quote contents:* %quote                 {% tokens => tokens[1].join('') %}
braced      -> %lbrace contents:* %rbrace               {% tokens => tokens[1].join('') %}
math        -> %mathShift contents:* %mathShift         {% tokens => tokens[1].join('') /* TODO */ %}
contents    -> %command                                 {% tokens => tokens[0].value /* TODO */ %}
             | %escape                                  {% tokens => tokens[0].value /* TODO */ %}
             | braced                                   {% tokens => `{${tokens[0]}}` %}
             | math                                     {% tokens => tokens[0].value %}
             | %text                                    {% tokens => tokens[0].value %}
             | %whitespace                              {% tokens => ' ' %}

# _ -> (%whitespace | %comment):*
_ -> %whitespace:*
