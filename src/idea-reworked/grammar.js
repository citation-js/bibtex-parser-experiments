/**
 * @typedef Cite.util.Grammar~ruleName
 * @type {String}
 */

/**
 * @callback Cite.util.Grammar~rule
 * @this Cite.util.Grammar
 */

/**
 * @memberof Cite.util
 *
 * @param {Object<Cite.util.Grammar~ruleName,Cite.util.Grammar~rule>} rules
 * @param {Object} state
 */
export class Grammar {
  constructor (rules, state) {
    this.rules = rules
    this.state = state
    this.mainRule = Object.keys(rules)[0]
    this.log = []
  }

  /**
   * @param iterator - lexer supporting formatError() and next()
   * @return result of the main rule
   */
  parse (iterator, returnAST) {
    this.lexer = iterator
    this.token = this.lexer.next()

    this.returnAST = returnAST
    if (returnAST) { this.childrenCache = [[]] }

    const result = this.consumeRule(this.mainRule)
    return returnAST ? this.childrenCache[0][0] : result
  }

  /**
   * @return {Boolean} true if there are no more tokens
   */
  matchEndOfFile () {
    return !this.token
  }

  /**
   * @param {String} type - a token type
   * @return {Boolean} true if the current token has the given type
   */
  matchToken (type) {
    return this.token && type === this.token.type
  }

  /**
   * @param {String} [type] - a token type
   * @param {Boolean} [optional=false] - false if it should throw an error if the type does not match
   * @return {Object} token information
   * @throw {SyntaxError} detailed syntax error if the current token is not the expected type or if there are no tokens left
   */
  consumeToken (type, optional) {
    let token = this.token

    if (!type || (token && token.type === type)) {
      this.token = this.lexer.next()
      if (this.returnAST) {
        this.childrenCache[0].push({
          kind: token.type,
          loc: {
            start: { offset: token.offset, line: token.line, col: token.col },
            end: {
              offset: token.offset + token.text.length,
              line: token.line + token.lineBreaks,
              col: token.lineBreaks ? token.text.split('\n').pop().length : token.col + token.text.length
            }
          },
          value: token.value
        })
      }
      return token
    } else if (optional) {
      return undefined
    } else {
      const got = token ? `"${token.type}"` : 'EOF'
      const error = new SyntaxError(this.lexer.formatError(token, `expected "${type}", got ${got}`))
      error.message += ` (${this.log.join('->')})`
      throw error
    }
  }

  /**
   * @param {String} rule - a rule name
   * @return whatever the rule function returns
   */
  consumeRule (rule) {
    this.log.push(rule)
    if (this.returnAST) {
      this.childrenCache.unshift([])
    }
    const result = this.rules[rule].call(this)
    this.log.pop()

    const children = this.childrenCache.shift()
    if (this.returnAST && children.length) {
      const start = children[0]
      const end = children[children.length - 1]
      this.childrenCache[0].push({
        kind: rule,
        loc: {
          start: start.loc.start,
          end: end.loc.end
        },
        children,
        value: result
      })
    }

    return result
  }
}
