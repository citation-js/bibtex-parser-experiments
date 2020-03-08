const FOO = [{ type: 'book', label: 'a', keys: { title: 'foo' } }]

export default {
  // ENTRY
  'entry with lowercase type': {
    input: `@book{a, title = "foo"}`,
    output: FOO
  },
  'entry with mixed-case type': {
    input: `@BoOk{a, title = "foo"}`,
    output: FOO
  },
  'entry with uppercase type': {
    input: `@BOOK{a, title = "foo"}`,
    output: FOO
  },
  'entry with parentheses': {
    input: `@book(a, title = "foo")`,
    output: FOO
  },
  'entry with spacing': {
    input: `@
      book
    {
      d
    ,
      title = "mixed-case, spaced"
    }`,
    output: FOO
  },

  // PREAMBLE
  'preamble with quoted string': {
    input: `@preamble { "test" }`,
    output: []
  },
  'preamble with string': {
    input: `@string{ include = "a" }
@preamble { include }`,
    output: []
  },
  'preamble with concatenated string': {
    input: `@string{ include = "a" }
@preamble { include # include }`,
    output: []
  },

  // STRING
  'string with lowercase type': {
    input: `@string{ foo = "foo" }
@book{a, title = foo}`,
    output: FOO
  },
  'string with mixed-case type': {
    input: `@StRiNg{ foo = "foo" }
@book{a, title = foo}`,
    output: FOO
  },
  'string with uppercase type': {
    input: `@STRING{ foo = "foo" }
@book{a, title = foo}`,
    output: FOO
  },
  'string with parentheses': {
    input: `@string( foo = "foo" )
@book{a, title = foo}`,
    output: FOO
  },
  'string value with string': {
    input: `@string{ foo = "foo" }
@book{a, title = foo}
@book{b, title = FOO}`,
    output: [FOO[0], { label: 'b', ...FOO[0] }]
  },
  'string value with concatenated string': {
    input: `@string{ f = "f" }
@string{ o = "o" }
@string{ fo = f # o }
@book{a, title = fo # o}`,
    output: FOO
  },

  // KEYS
  'string key with colon': {
    input: `@string{ a:a = "foo" }
            @string{ b:b = a:a }`,
    output: [
      { type: 'string', keys: { 'a:a': 'foo' } },
      { type: 'string', keys: { 'b:b': 'foo' } }
    ]
  },
  'entry key with colon': {
    input: `@book{a, a:a = "foo" }`,
    output: [{ type: 'book', label: 'a', keys: { 'a:a': 'foo' } }]
  },

  // LABELS
  'entry label with number': {
    input: `@book{a1, title = "foo"}`,
    output: [{ type: 'book', label: 'a1', keys: { title: 'foo' } }]
  },
  'entry label with colon': {
    input: `@book{b:b, title = "foo"}`,
    output: [{ type: 'book', label: 'b:b', keys: { title: 'foo' } }]
  },
  'entry label with double quotes': {
    input: `@book{"a", title = "foo"}`,
    output: [{ type: 'book', label: '"a"', keys: { title: 'foo' } }]
  },

  // VALUES
  'entry value of quoted string': {
    input: `@book{a, title = "foo"}`,
    output: FOO
  },
  'entry value of braced string': {
    input: `@book{a, title = {foo}}`,
    output: FOO
  },
  'entry value of number': {
    input: `@book{a, title = 2020}`,
    output: [{ type: 'book', label: 'a', keys: { title: 2020 } }]
  },
  'entry value with mid-and concatenation': {
    input: `@book{a, author = "foo an" # "d bar"}`,
    output: [{ type: 'book', label: 'a', keys: { author: ['a', 'b'] } }],
    gimmic: true
  },
  'entry value with mid-command concatenation': {
    input: `@book{a, title = "foo \\copy" # "right bar"}`,
    output: [{ type: 'book', label: 'a', keys: { title: 'foo © bar' } }],
    gimmic: true
  },
  // TODO

  // COMMENT
  'comment before entry': {
    input: `@comment{This is a comment}`,
    output: []
  },
  'comment before entry': {
    input: `@comment{@book{a, title = "foo"}}`,
    output: []
  },
  'comment around entry (natbib)': {
    input: `@comment{
      @book{a, title = "foo"}
    }`,
    output: FOO,
    only: 'natbib'
  },
  'comment around entry (biblatex)': {
    input: `@comment{
      @book{a, title = "foo"}
    }`,
    output: [],
    only: 'natbib'
  }
}
