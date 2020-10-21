const Benchmark = require('benchmark')
const fs = require('fs')
const path = require('path')

const console = global.console
global.console = global.logger = {
  error (message) {
    throw new SyntaxError(message)
  }
}
const cacheBase = Object.keys(require.cache)

const parsers = [
  'citationjs-old',
  // 'citationjs-nearley',
  // 'citationjs-idea',
  'citationjs',
  'astrocite',
  'fiduswriter',
  'zotero',
  'bbt'
]
const dirPath = path.join(__dirname, 'fixtures', 'benchmark')
const files = ['single.bib', 'long.bib'].reduce((files, name) => {
  const file = fs.readFileSync(path.join(dirPath, name), 'utf8')
  files[name] = file
  return files
}, {})

function run (parserName) {
  return new Promise(function (resolve, reject) {
    const suite = new Benchmark.Suite()
    let parser = null
    process.stdout.write(`| ${parserName} |`)

    suite.on('cycle', function (event) {
      const bench = event.target

      if (bench.error) {
        console.log(bench.error)
      } else {
        process.stdout.write(` ${(1000 / bench.hz).toPrecision(3)}ms ± ${bench.stats.rme.toFixed(1)}% |`)
      }
    })

    suite.on('complete', function () {
      process.stdout.write('\n')
      resolve()
    })

    suite.add('init', {
      defer: true,
      fn (defer) {
        // clear cache
        for (const entry in require.cache) {
          if (cacheBase.includes(entry)) { continue }
          delete require.cache[entry]
        }

        parser = require(`../lib/${parserName}`)
        if (parser.init) {
          Promise.resolve(parser.init()).then(() => defer.resolve())
        } else {
          defer.resolve()
        }
      }
    })

    for (const filename in files) {
      (function(filename) {
        suite.add(`parse.${filename}`, {
          defer: true,
          fn (defer) {
            Promise.resolve(parser.parse(files[filename])).then(() => defer.resolve())
          }
        })
      })(filename)
    }

    suite.run({ async: true })
  })
}

async function main() {
  console.log('|              | Init             | Time (single entry) | Time (3345 entries) |')
  console.log('|--------------|-----------------:|--------------------:|--------------------:|')

  const altParsers = process.argv.slice(2)
  for (const parser of altParsers.length ? altParsers : parsers) {
    await run(parser)
  }
}

main()
  .catch(console.error)
