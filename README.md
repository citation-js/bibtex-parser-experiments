# BibTeX Parser Experiments

Experiments to determine the new BibTeX parser formula. The result may be applied
to other formats as well in the future.

## Results

|                                       | Time (single entry) | Time (3345 entries) | Syntax    |
|---------------------------------------|--------------------:|--------------------:|-----------|
| [Current](/src/current)               |                ~8ms |             ~1800ms | basic     |
| [PEG.js](/src/astrocite) (astrocite)  |                ~9ms |             ~1670ms | complete¹ |
| [Idea](/src/idea)                     |                ~2ms |             ~1150ms | basic     |
| [Idea (reworked)](/src/idea-reworked) |                ~3ms |              ~750ms | complete  |
| [nearley](/src/nearley) (self-made)   |              ~20ms² |              N/A² ³ | basic     |
| [fiduswriter](/src/fiduswriter)       |              ~160ms |           ~119000ms | complete  |
| [Zotero](/src/zotero)⁴                |              ~177ms |            ~31000ms | basic     |
| [Better BibTeX (BBT)](/src/bbt)       |               ~10ms |            ~12000ms | complete⁵ |

¹ Although it misses some nuances, like the fact that braced `@comment`s do not really exist  
² I fully expect this to be my fault, not nearley's  
³ Causes an `Allocation failed - JavaScript heap out of memory` error  
⁴ Converts to Zotero API JSON format  
⁵ Misses some forms of diacritics  

### Current

Currently, the `TokenStack` class is utilized, together with a simple RegExp that
tokenizes some rough commands.

### astrocite

The `astrocite-bibtex` package by @dsifford uses PEG.js. It is capable of returning
an AST.

### Idea (& reworked idea)

The idea was to explore tokenization without introducing a formal grammar, as
formal grammars introduce extra build steps, runtime dependencies and large swaths
of generated code. However, used as I was to the syntax of `PEG.js` and `nearley.js`,
I made some unnecessarily complicated features like `consumeAnyRule()`, and some
weird loops in the rules. This was partly due to bad tokenization.

The reworked version has new tokens, a simpler `Grammar` class and simplified
rules. It also has more features, including more commands and diacritics, including
more ways to write them.

### nearley

In parallel to reworking the idea, I used the tokenizer in a `nearley.js` grammar,
which failed miserably. As I mentioned in the footnotes of the table, this is
probably the result of bad grammar-writing on my part. However, an additional
downside of this route is that it introduces an extra build step — `nearleyc` —
and a runtime dependency — `nearley` itself.

### fiduswriter

Fiduswriter's `biblatex-csl-converter` seems to perform very poorly on the larger
file.

### Zotero

Zotero Translators are hard to use stand-alone, as they depend on a Zotero
framework in the global scope. Additionally, because it converts to Zotero API
JSON while parsing the syntax, it only returns 3322 entries, as it does not
recognise the BibLaTeX-only `@electronic` type.

### Better BibTeX for Zotero (BBT)

Using `@retorquere/bibtex-parser`, this performs very well. It is capable of
returning an AST. I have not had a chance to test out all the parser features
for literal/text/name values yet.
