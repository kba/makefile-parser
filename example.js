/* eslint no-tabs:0 */
const parseMakefile = require('./makefile-parser')
const {ast} = parseMakefile(
`# Comment on VAR.
VAR = 23
# Comment on foo
foo: fizz\\ buzz bar
	step 1 $@
	step 2 $<`)
console.log(ast)
// console.log(JSON.stringify(ast, null, 2))

