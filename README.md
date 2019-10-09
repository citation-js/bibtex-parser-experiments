# BibTeX Parser Experiments

Experiments to determine the new BibTeX parser formula. The result may be applied
to other formats as well in the future.

## Results

|                                       | Time (single entry) | Time (3345 entries) | Syntax |
|---------------------------------------|--------------------:|--------------------:|--------|
| [Current](/src/current)               |                ~8ms |             ~1800ms | old    |
| [PEG.js](/src/astrocite) (astrocite)¹ |                ~9ms |             ~1670ms | new²   |
| [Idea](/src/idea)                     |                ~2ms |             ~1150ms | old    |
| [Idea (reworked)](/src/idea-reworked) |                ~3ms |              ~750ms | new    |
| [nearley](/src/nearley) (self-made)   |              ~20ms³ |              N/A³ ⁴ | new    |
| [fiduswriter](/src/fiduswriter)       |              ~160ms |                N/A⁵ | new    |
| [Zotero](/src/zotero)⁶                |              ~177ms |            ~31000ms | old    |

¹ Only creates an AST, not a JSON representation of the data itself  
² Although it misses some nuances, like the fact that braced `@comment`s do not really exist  
³ I fully expect this to be my fault, not nearley's  
⁴ Causes an `Allocation failed - JavaScript heap out of memory` error  
⁵ Does not seem to terminate within 30 seconds  
⁶ Converts to Zotero API JSON format

### Current

Currently, the `TokenStack` class is utilized, together with a simple RegExp that
tokenizes some rough commands.

### astrocite

The `astrocite-bibtex` by @dsifford package uses `PEG.js`.

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
file, and that is just with the npm package, not a copied, self-built grammar like
with `astrocite-bibtex`.

### Zotero

Zotero Translators are notoriously hard to use stand-alone, as they depend on a
Zotero framework in the global scope. Additionally, it converts to Zotero API JSON
while parsing the syntax. This results in it only returning 3322 entries, as it
does not recognise the BibLaTeX-only `@electronic` type.
