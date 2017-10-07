#!/usr/bin/env node
const inspect = obj => require('util').inspect(obj, {colors: true, depth: 5})
const parseMakefile = require('./makefile-parser')
const {argv} = require('yargs')
  .option('dump', {type: Boolean, describe: 'Dump AST'})
  .option('make-help', {type: 'count', describe: 'Generate "make help"'})
  .option('indent', {type: String, default: '  '})
const makefile = require('fs').readFileSync(argv._[0], {encoding: 'utf8'})
const ctx = parseMakefile(makefile)
if (argv.dump) {
  console.log(inspect(ctx))
} else {
  let ret = []
  ;['target', 'variable'].map(prop => {
    ret.push('')
    ret.push('  ' + prop.substr(0, 1).toUpperCase() + prop.substr(1) + 's')
    ret.push('')
    const tokens = ctx.ast.filter(t => t[prop] && t.comment)
    const padWidth = Math.max(...tokens.map(t => t[prop].length)) + 2
    tokens.map(t => {
      const name = t[prop].padEnd(padWidth)
      ret.push(`${argv.indent.repeat(2)}${name}${t.comment[0]}`)
      if (t.comment.length > 1) {
        t.comment.slice(1).map(c => ret.push(`${argv.indent.repeat(2)}${' '.repeat(padWidth)}${c}`))
      }
    })
  })
  if (argv.makeHelp) {
    ret = ['', 'help:', ...ret.map(line => `\t@echo "${line}"`)]
  }
  console.log(ret.join('\n'))
}

