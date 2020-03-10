const FOO = [{ type: 'book', id: 'a', properties: { title: 'foo' } }]

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
      a
    ,
      title="foo"
    }`,
    output: FOO
  },
  'entry with trailing comma': {
    input: `@book{a, title = "foo",}`,
    output: FOO
  },

  // KEYS
  'string key with colon': {
    input: `@string{ a:a = "o" }
            @string{ b:b = a:a }
            @book{a, title = "f" # a:a # b:b}`,
    output: FOO
  },
  'entry key with colon': {
    input: `@book{a, a:a = "foo" }`,
    output: [{ type: 'book', id: 'a', properties: { 'a:a': 'foo' } }]
  },

  // LABELS
  'entry label with number': {
    input: `@book{a1, title = "foo"}`,
    output: [{ type: 'book', id: 'a1', properties: { title: 'foo' } }]
  },
  'entry label with colon': {
    input: `@book{b:b, title = "foo"}`,
    output: [{ type: 'book', id: 'b:b', properties: { title: 'foo' } }]
  },
  'entry label with double quotes': {
    input: `@book{"a", title = "foo"}`,
    output: [{ type: 'book', id: '"a"', properties: { title: 'foo' } }]
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
    output: [{ type: 'book', id: 'a', properties: { title: 2020 } }],
    gimmick: 'REPRESENTATION'
  },
  'entry value with mid-and concatenation': {
    input: `@book{a, author = "foo an" # "d bar"}`,
    output: [{ type: 'book', id: 'a', properties: { author: ['foo', 'bar'] } }],
    gimmick: 'RARE'
  },
  'entry value with mid-command concatenation': {
    input: `@book{a, title = "foo \\copy" # "right{} bar"}`,
    output: [{ type: 'book', id: 'a', properties: { title: 'foo © bar' } }],
    gimmick: 'RARE'
  },
  'entry value with sentence-casing': {
    input: `@article{test, title = {Stability {Analysis} and Optimization}}`,
    output: [{
      id: 'test',
      properties: {
        title: 'Stability Analysis and optimization'
      },
      type: 'article'
    }],
    gimmick: 'REPRESENTATION'
  },
  'entry value with markup': {
    input: `@article{test, title = {Stability Analysis and {\\emph{Optimization}}}}`,
    output: [{
      id: 'test',
      properties: {
        title: 'Stability analysis and <i>optimization</i>'
      },
      type: 'article'
    }],
    gimmick: 'REPRESENTATION'
  },
  'entry value with literal names': {
    input: `@article{test, author = {Bausch and Lomb and {Bausch and Lomb}}}`,
    output: [{
      id: 'test',
      properties: {
        author: [
          'Bausch',
          'Lomb',
          'Bausch and Lomb'
        ]
      },
      type: 'article'
    }]
  },
  'entry value with extended names (biblatex)': {
    input: `@article{test, author = {family=Duchamp, given=Philippe, given-i={Ph}}}`,
    output: [{
      id: 'test',
      properties: {
        author: [
          'Duchamp'
        ]
      },
      type: 'article'
    }],
    only: 'biblatex'
  },
  'entry value with verbatim fields': {
    input: `@article{test, file = {files/Zuniga:2016jt/A4FA1025_A4E7{}422A-9368-1E1F1B9B0166.pdf}}`,
    output: [{
      id: 'test',
      properties: {
        file: 'files/Zuniga:2016jt/A4FA1025_A4E7{}422A-9368-1E1F1B9B0166.pdf'
      },
      type: 'article'
    }]
  },
  'entry value with diacritics': {
    input: `@article{test, publisher = {D{\\u{o}}\\"ead Poet Society}}`,
    output: [{
      id: 'test',
      properties: {
        publisher: 'Dŏëad Poet Society'
      },
      type: 'article'
    }]
  },
  'entry value with sub/superscript': {
    input: `@article{test, publisher = {Dead Po$_{eee}$t Society}}`,
    output: [{
      id: 'test',
      properties: {
        publisher: 'Dead Poₑₑₑt Society'
      },
      type: 'article'
    }]
  },
  'entry value with multi-argument commands': {
    input: `@article{test, title = {$\\frac 1 2$ and $\\frac{n}{2}$}}`,
    output: [{ id: 'test', properties: { title: '½ and ⁿ⁄₂' }, type: 'article'}]
  },
  // TODO
  'TODO': {
    only: 'display'
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
    output: [FOO[0], { ...FOO[0], id: 'b' }]
  },
  'string value with concatenated string': {
    input: `@string{ f = "f" }
@string{ o = "o" }
@string{ fo = f # o }
@book{a, title = fo # o}`,
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
  },
}
