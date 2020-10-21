const fs = require('fs')
const path = require('path')
const http = require('https')
const util = require('util')
const constants = require('../lib/citationjs/constants')

function request (...args) {
  return new Promise((resolve) => http.get(...args, resolve))
}

function readStream (stream) {
  return new Promise((resolve) => {
    let data = ''
    stream.setEncoding('utf8')
    stream.on('data', chunk => { data += chunk })
    stream.on('end', () => resolve(data))
  })
}

async function main () {
  const res = await request('https://raw.githubusercontent.com/latex3/latex3/master/texmf/tex/latex/base/tuenc.def')
  const data = await readStream(res)
  const commands = data.match(/\\Declare.+?(?=\n\\)/sg)
  const output = {
    diacritics: {},
    commands: {}
  }

  for (const command of commands) {
    if (command.startsWith('\\DeclareUnicodeComposite')) {
      continue
    }

    let [name, ...def] = command.replace(/^\\\w+/, "").split(/(?<!\n) +|(?<=\})(?=\\)/)

    if (name.startsWith('\\UnicodeEncodingName') ||
        name.startsWith('#1#2#3')) {
      continue
    }

    name = name.replace(/^\{?\\|\}?$/g, '')
    def = def.join(' ').match(/(?<=")[0-9A-F]{4}/)
    const value = def && String.fromCharCode(parseInt(def[0], 16))

    if (command.startsWith('\\DeclareUnicodeAccent')) {
      output.diacritics[name] = value
    } else {
      output.commands[name] = value
    }
  }

  // patches
  output.diacritics.t = '\u0361'
  output.diacritics.textcommabelow = '\u0326' // https://github.com/latex3/latex2e/issues/310
  output.commands.copyright = '\u00A9'
  Object.assign(output.commands, {
    Gamma: '\u0393',
    Delta: '\u0394',
    Theta: '\u0398',
    Lambda: '\u039B',
    Xi: '\u039E',
    Pi: '\u03A0',
    Sigma: '\u03A3',
    Phi: '\u03A6',
    Psi: '\u03A8',
    Omega: '\u03A9',
    alpha: '\u03B1',
    beta: '\u03B2',
    gamma: '\u03B3',
    delta: '\u03B4',
    varepsilon: '\u03B5',
    zeta: '\u03B6',
    eta: '\u03B7',
    theta: '\u03B8',
    iota: '\u03B9',
    kappa: '\u03BA',
    lambda: '\u03BB',
    mu: '\u03BC',
    nu: '\u03BD',
    xi: '\u03BE',
    pi: '\u03C0',
    rho: '\u03C1',
    varsigma: '\u03C2',
    sigma: '\u03C3',
    tau: '\u03C4',
    upsilon: '\u03C5',
    varphi: '\u03C6',
    chi: '\u03C7',
    psi: '\u03C8',
    omega: '\u03C9',
    vartheta: '\u03D1',
    Upsilon: '\u03D2',
    phi: '\u03D5',
    varpi: '\u03D6',
    varrho: '\u03F1',
    epsilon: '\u03F5',
  })

  for (const category in output) {
    for (const name in constants[category]) {
      if (name in output[category]) {
        if (output[category][name] === constants[category][name]) {
          //
        } else {
          console.log(`(${category}) Diff ${name}: `, output[category][name], constants[category][name])
        }
      } else {
        console.log(`(${category}) No ${name}: `, constants[category][name])
      }
    }
  }

  fs.writeFileSync(path.join(__dirname, '../src/citationjs/unicode.json'), JSON.stringify(output))
}

main().catch(console.error)
