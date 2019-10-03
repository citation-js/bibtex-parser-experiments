export class Grammar {
  constructor (rules, state) {
    this.tokens = []

    this.rules = rules
    this.state = state
    this.mainRule = Object.keys(rules)[0]
  }

  parse (iterator) {
    this.tokens = Array.from(iterator)
    this.lexer = iterator
    this.index = 0
    return this.consumeRule(this.mainRule)
  }

  matchEndOfFile () {
    return this.index >= this.tokens.length
  }

  matchToken (type) {
    return this.tokens[this.index] && type === this.tokens[this.index].type
  }

  matchTokens (types) {
    return types.every((type, i) => type === this.tokens[this.index + i] && this.tokens[this.index + i].type)
  }

  consumeToken (type, optional) {
    let token = this.tokens[this.index]

    if (!type || (token && token.type === type)) {
      this.index++
      return token
    } else if (optional) {
      return undefined
    } else {
      throw new Error(this.lexer.formatError(token, `expected "${type}", got "${token ? token.type : 'EOF'}"`))
    }
  }

  consumeRule (rule, optional) {
    try {
      let output = this.rules[rule].call(this)
      return output
    } catch (e) {
      if (!optional) {
        e.message += ` at ${rule}`
        throw e
      }
    }
  }

  consumeAnyRule (rules) {
    const oldIndex = this.index
    let errors = []

    for (let rule of rules) {
      try {
        let value = this.rules[rule].call(this)
        return value
      } catch (error) {
        errors.push(error)
      }
    }

    this.index = oldIndex
    throw errors[errors.length - 1]
  }
}
