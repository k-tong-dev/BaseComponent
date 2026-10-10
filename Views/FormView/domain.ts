/**
 * Tiny safe expression evaluator for Odoo-style field conditions.
 *
 * FormView fields support `invisible` / `readonly` expressions that are
 * evaluated against the current form values, e.g.:
 *
 *   invisible: "payment_method == 'cash'"
 *   readonly:  "status != 'draft'"
 *
 * The grammar is intentionally small (no eval, no assignments):
 *
 *   or        := and ( '||' and )*
 *   and       := unary ( '&&' unary )*
 *   unary     := '!' unary | comparison
 *   comparison:= primary ( ('==' | '!=' | '=' | '<>' | 'in' | 'not in') primary )?
 *   primary   := '(' or ')' | list | string | number | true | false | null | ident
 *   list      := '[' [ or (',' or)* ] ']'
 *
 * Field values are read from the flat form-values object (`values[field]`).
 */

type Token =
  | { kind: 'ident'; value: string }
  | { kind: 'string'; value: string }
  | { kind: 'number'; value: number }
  | { kind: 'op'; value: string }

const OPERATORS = ['==', '!=', '<>', '&&', '||', '!', '(', ')', '[', ']', ',', 'in', 'not in']

function tokenize(src: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (/\s/.test(ch)) { i++; continue }
    if (ch === "'" || ch === '"') {
      const quote = ch
      let j = i + 1
      let out = ''
      while (j < src.length && src[j] !== quote) {
        if (src[j] === '\\' && j + 1 < src.length) { out += src[j + 1]; j += 2 } else { out += src[j]; j++ }
      }
      if (j >= src.length) throw new Error('Unterminated string in expression')
      tokens.push({ kind: 'string', value: out })
      i = j + 1
      continue
    }
    if (/[0-9]/.test(ch) || (ch === '-' && /[0-9]/.test(src[i + 1] ?? ''))) {
      let j = i + 1
      while (j < src.length && /[0-9.]/.test(src[j])) j++
      tokens.push({ kind: 'number', value: Number(src.slice(i, j)) })
      i = j
      continue
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i
      while (j < src.length && /[A-Za-z0-9_.]/.test(src[j])) j++
      const word = src.slice(i, j)
      // Two-word operator: `x not in [a, b]`. Consume 'not' + 'in' exactly.
      if (word === 'not') {
        let k = j
        while (k < src.length && /\s/.test(src[k])) k++
        const followedByIn =
          src.slice(k, k + 2) === 'in' &&
          (k + 2 >= src.length || !/[A-Za-z0-9_]/.test(src[k + 2]))
        if (followedByIn) {
          tokens.push({ kind: 'op', value: 'not in' })
          i = k + 2
          continue
        }
      }
      if (word === 'in') tokens.push({ kind: 'op', value: 'in' })
      else if (word === 'true' || word === 'false') tokens.push({ kind: 'ident', value: word })
      else if (word === 'null') tokens.push({ kind: 'ident', value: word })
      else tokens.push({ kind: 'ident', value: word })
      i = j
      continue
    }
    const two = src.slice(i, i + 2)
    if (two === '==' || two === '!=' || two === '<>' || two === '&&' || two === '||') {
      tokens.push({ kind: 'op', value: two === '<>' ? '!=' : two })
      i += 2
      continue
    }
    if (ch === '=' || ch === '!' || ch === '(' || ch === ')' || ch === '[' || ch === ']' || ch === ',') {
      tokens.push({ kind: 'op', value: ch === '=' ? '==' : ch })
      i++
      continue
    }
    throw new Error(`Unexpected character "${ch}" in expression`)
  }
  return tokens
}

type Node =
  | { type: 'and' | 'or'; left: Node; right: Node }
  | { type: 'not'; child: Node }
  | { type: 'cmp'; op: string; left: Node; right: Node }
  | { type: 'list'; items: Node[] }
  | { type: 'literal'; value: any }
  | { type: 'ident'; name: string }

class Parser {
  private pos = 0
  constructor(private tokens: Token[]) {}

  parse(): Node {
    const node = this.parseOr()
    if (this.pos < this.tokens.length) throw new Error('Unexpected token in expression')
    return node
  }

  private peek(): Token | undefined { return this.tokens[this.pos] }
  private next(): Token {
    const t = this.tokens[this.pos]
    if (!t) throw new Error('Unexpected end of expression')
    this.pos++
    return t
  }
  private isOp(value: string): boolean {
    const t = this.peek()
    return t?.kind === 'op' && t.value === value
  }

  private parseOr(): Node {
    let left = this.parseAnd()
    while (this.isOp('||')) { this.next(); left = { type: 'or', left, right: this.parseAnd() } }
    return left
  }

  private parseAnd(): Node {
    let left = this.parseUnary()
    while (this.isOp('&&')) { this.next(); left = { type: 'and', left, right: this.parseUnary() } }
    return left
  }

  private parseUnary(): Node {
    if (this.isOp('!')) { this.next(); return { type: 'not', child: this.parseUnary() } }
    return this.parseComparison()
  }

  private parseComparison(): Node {
    const left = this.parsePrimary()
    const t = this.peek()
    if (t?.kind === 'op' && ['==', '!=', 'in', 'not in'].includes(t.value)) {
      this.next()
      return { type: 'cmp', op: t.value, left, right: this.parsePrimary() }
    }
    return left
  }

  private parsePrimary(): Node {
    const t = this.next()
    if (t.kind === 'op' && t.value === '(') {
      const node = this.parseOr()
      const close = this.next()
      if (close.kind !== 'op' || close.value !== ')') throw new Error('Missing closing parenthesis')
      return node
    }
    if (t.kind === 'op' && t.value === '[') {
      const items: Node[] = []
      if (!this.isOp(']')) {
        items.push(this.parseOr())
        while (this.isOp(',')) { this.next(); items.push(this.parseOr()) }
      }
      const close = this.next()
      if (close.kind !== 'op' || close.value !== ']') throw new Error('Missing closing bracket')
      return { type: 'list', items }
    }
    if (t.kind === 'string') return { type: 'literal', value: t.value }
    if (t.kind === 'number') return { type: 'literal', value: t.value }
    if (t.kind === 'ident') {
      if (t.value === 'true') return { type: 'literal', value: true }
      if (t.value === 'false') return { type: 'literal', value: false }
      if (t.value === 'null') return { type: 'literal', value: null }
      // Any other identifier is a FIELD reference — its value is looked up
      // against the current form values (e.g. `status != 'draft'`).
      return { type: 'ident', name: t.value }
    }
    throw new Error('Unexpected token in expression')
  }
}

function lookup(values: Record<string, any>, name: string): any {
  if (name === 'true') return true
  if (name === 'false') return false
  if (name === 'null') return null
  return values?.[name]
}

function truthy(v: any): boolean {
  if (Array.isArray(v)) return v.length > 0
  return Boolean(v)
}

function isEqual(a: any, b: any): boolean {
  if (Array.isArray(a) || Array.isArray(b)) return false
  return a === b || String(a) === String(b)
}

function evalNode(node: Node, values: Record<string, any>): any {
  switch (node.type) {
    case 'and': return truthy(evalNode(node.left, values)) && truthy(evalNode(node.right, values))
    case 'or': return truthy(evalNode(node.left, values)) || truthy(evalNode(node.right, values))
    case 'not': return !truthy(evalNode(node.child, values))
    case 'cmp': {
      const l = evalNode(node.left, values)
      const r = evalNode(node.right, values)
      switch (node.op) {
        case '==': return isEqual(l, r)
        case '!=': return !isEqual(l, r)
        case 'in': return Array.isArray(r) && r.some((item) => isEqual(item, l))
        case 'not in': return Array.isArray(r) && !r.some((item) => isEqual(item, l))
        default: return false
      }
    }
    case 'list': return node.items.map((item) => evalNode(item, values))
    case 'literal': return node.value
    case 'ident': return lookup(values, node.name)
  }
}

/** Evaluate an Odoo-style expression against form values. Throws on syntax errors. */
export function evaluateExpression(expr: string, values: Record<string, any>): boolean {
  const trimmed = expr.trim()
  if (!trimmed) return false
  const ast = new Parser(tokenize(trimmed)).parse()
  return truthy(evalNode(ast, values))
}

/** Context passed to condition functions (e.g. `invisible: (data, ctx) => ...`). */
export interface FormConditionContext {
  mode: 'create' | 'edit'
  source?: string
  /** Odoo-style view context — conditions can reference these values. */
  context?: Record<string, any>
}

type Condition = boolean | string | ((data: any, ctx?: FormConditionContext) => boolean) | undefined

/**
 * Resolve a form condition (boolean, expression string, or function) against the
 * current form values. Functions receive the values and a small context.
 */
export function resolveCondition(
  cond: Condition,
  data: Record<string, any>,
  ctx?: FormConditionContext
): boolean {
  if (cond == null) return false
  if (typeof cond === 'function') return Boolean(cond(data, ctx))
  if (typeof cond === 'string') {
    try {
      // Merge view context into the values so expressions can reference
      // context keys (e.g. "default_status == 'draft'").
      const merged = ctx?.context ? { ...ctx.context, ...data } : data
      return evaluateExpression(cond, merged)
    } catch { return false }
  }
  return Boolean(cond)
}
