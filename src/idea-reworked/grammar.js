export class Grammar {
  constructor (rules, state) {
    this.rules = rules
    this.state = state
    this.mainRule = Object.keys(rules)[0]
    this.log = []
  }

  parse (iterator) {
    this.lexer = iterator
    this.token = this.lexer.next()
    return this.consumeRule(this.mainRule)
  }

  matchEndOfFile () {
    return !this.token
  }

  matchToken (type) {
    return this.token && type === this.token.type
  }

  consumeToken (type, optional) {
    let token = this.token

    if (!type || (token && token.type === type)) {
      this.token = this.lexer.next()
      return token
    } else if (optional) {
      return undefined
    } else {
      const got = token ? `"${token.type}"` : 'EOF'
      const error = new Error(this.lexer.formatError(token, `expected "${type}", got ${got}`))
      error.message += ` (${this.log.join('->')})`
      throw error
    }
  }

  consumeRule (rule) {
    this.log.push(rule)
    const result = this.rules[rule].call(this)
    this.log.pop()
    return result
  }
}
