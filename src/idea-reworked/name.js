/**
 * @param {String}
 * @returns {Boolean|null} true if uppercase, false if lowercase, null if neither
 */
export function getStringCase (string) {
  const a = string.toUpperCase()
  const b = string.toLowerCase()

  for (let i = 0; i < string.length; i++) {
    if (a[i] !== b[i]) {
      return a[i] === string[i]
    }
  }

  return null
}

/**
 * @param {Array<Object>} parts
 * @return {String|undefined}
 */
function formatNameParts (parts) {
  if (parts.length === 0) {
    return undefined
  }

  let piece = ''

  while (parts.length > 1) {
    const { namePart, hyphenated } = parts.shift()
    piece += namePart + (hyphenated ? '-' : ' ')
  }

  return piece + parts[0].namePart || undefined
}

/**
 * @param {Array<Object>} parts
 * @param {Boolean} [orderFirst=true] - also consider the first name
 * @return {Array<String>}
 */
export function orderNameParts (parts, orderFirst = true) {
  const first = []
  const undecided = []

  if (orderFirst) {
    while (parts.length > 1 && parts[0].upperCase !== false) {
      first.push(...undecided)
      undecided.length = 0

      while (parts.length > 1 && parts[0].upperCase !== false && !parts[0].hyphenated) {
        first.push(parts.shift())
      }

      while (parts.length > 0 && parts[0].upperCase !== false && parts[0].hyphenated) {
        undecided.push(parts.shift())
      }
    }
  }

  const von = []
  const last = []

  while (parts.length > 1) {
    von.push(...last)
    last.length = 0

    while (parts.length > 1 && parts[0].upperCase === false) {
      von.push(parts.shift())
    }

    while (parts.length > 0 && parts[0].upperCase !== false) {
      last.push(parts.shift())
    }
  }

  if (undecided.length) {
    last.unshift(...undecided)
  }
  if (parts.length) {
    last.push(parts[0])
  }

  return [
    formatNameParts(first),
    formatNameParts(von),
    formatNameParts(last)
  ]
}

/**
 * @param {Array<Array<Object>>} pieces
 * @return {Object}
 */
export function orderNamePieces (pieces) {
  if (pieces.length === 1 && pieces[0].length === 1) {
    return { last: pieces[0][0].namePart }
  }

  if (pieces.length === 0 || pieces.length > 3) {
    return { last: formatNameParts(pieces.flat()) }
  }

  const name = {}
  const [first, von, last] = orderNameParts(pieces[0], pieces.length === 1)

  if (last) {
    name.last = last
  }
  if (von) {
    name.von = von
  }

  if (pieces.length === 3) {
    name.first = formatNameParts(pieces[2])
    name.jr = formatNameParts(pieces[1])
  } else if (pieces.length === 2) {
    name.first = formatNameParts(pieces[1])
  } else if (first) {
    name.first = first
  }

  return name
}
