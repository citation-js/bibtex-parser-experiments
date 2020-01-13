const Benchmark = require('benchmark')
const fs = require('fs')
const path = require('path')

let parsers = [
  'current',
  // 'nearley',
  'idea',
  'idea-reworked',
  'astrocite',
  'fiduswriter',
  'zotero',
  'bbt'
]

parsers = parsers.map(function(name) {
  const parser = require(`../lib/${name}`)
  parser.parse_async = async function(text) { await this.parse(text) }
  if (!parser.init) parser.init = async function() {}

  return { name, parser }
})

const dirPath = path.join(__dirname, 'fixtures', 'benchmark')

function run(method, filename) {
  return new Promise(function(resolve, reject) {
    const suite = new Benchmark.Suite()

    suite.on('cycle', function(event) {
      const bench = event.target

      if (bench.error) {
        console.log(bench.toString())
      } else {
        console.log(`${bench.name} ${filename || ''}:\t\t ${1000 / bench.hz}ms \xb1 ${bench.stats.rme}% (${bench.stats.sample.length} run${bench.stats.sample.length === 1 ? '' : 's'} sampled)`)
      }
    })

    suite.on('complete', function() {
      console.log('Fastest is ' + this.filter('fastest').map('name'))
      resolve()
    })

    const text = filename ? fs.readFileSync(path.join(dirPath, filename), 'utf8') : null

    for (const parser of parsers) {
      (function(p) {
        suite.add(`${p.name}.${method}`, {
          defer: true,
          fn: function(test) {
            p.parser[method](text).then(() => test.resolve())
          }
        })
      })(parser)
    }

    suite.run({ async: true })
  })
}

async function main() {
  await run('init')

  for (let filename of fs.readdirSync(dirPath)) {
    await run('parse_async', filename)
  }
}

main()
  .then(console.table)
  .catch(console.error)
