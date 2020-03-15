import { promisify } from 'util'
import { promises as fs } from 'fs'
import child_process from 'child_process'
import path from 'path'
import os from 'os'
import xml from 'xml2js'

const exec = promisify(child_process.exec)
const parseString = promisify(xml.parseString)
const opts = {}

export async function parse (input) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'bibtex-'))
  const inputFile = path.join(tmp, 'input.bib')
  const outputFile = path.join(tmp, 'output.xml')
  await fs.writeFile(inputFile, input)
  await exec(`/opt/jabref/bin/JabRef -n -console -i ${inputFile},bibtex -o ${outputFile},bibtexml`, opts)
  const output = await fs.readFile(outputFile, 'utf8')
  await exec(`rm -r ${tmp}`, opts)
  return parseString(output)
}

export function _intoFixtureOutput (result) {
  return result.file.entry.map(entry => ({
    id: entry.$.id,
    type: Object.keys(entry)[1],
    properties: Object.fromEntries(Object.entries(
      Object.values(entry)[1][0]
    ).map(
      ([key, value]) => [key, value[0]]
    ))
  }))
}
