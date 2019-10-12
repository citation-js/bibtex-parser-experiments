const fs = require('fs').promises
const path = require('path')

function transform (input) {
  return input
    .replace(
      /(abstract = \{)([^]+?)(\},\n {4}author)/g,
      (_, g1, g2, g3) => g1 + g2
        .replace(/[a-z]/g, 'a')
        .replace(/[A-Z]/g, 'A')
        .replace(/[0-9]/g, '0') + g3
    )
}

async function main () {
  const file = path.resolve(process.argv[2])
  const input = await fs.readFile(file, 'utf8')
  const output = transform(input)
  process.stdout.write(output)
}

if (require.main === module) {
  main().catch(console.error)
} else {
  module.exports = transform
}
