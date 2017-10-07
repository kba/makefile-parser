# makefile-parser

> Parse a Makefile into an abstract syntax tree

## Installation

```sh
npm install -g @kba/makefile-parser
```

## Usage

```js
const parseMakefile = require('./makefile-parser')
const {ast} = parseMakefile(
`# Comment on VAR.
VAR = 23
# Comment on foo
foo: fizz\\ buzz bar
	step 1 $@
	step 2 $<`)
console.log(ast)
```

Output:

```js
[ { variable: 'VAR', value: '23', comment: [ 'Comment on VAR.' ] },
  { target: 'foo',
    deps: [ 'fizz\\ buzz', 'bar' ],
    recipe: [ 'step 1 $@', 'step 2 $<' ],
    comment: [ 'Comment on foo' ] } ]
```

## CLI

```sh
Options:
  --help       Show help                                               [boolean]
  --version    Show version number                                     [boolean]
  --dump       Dump AST
  --make-help  Generate "make help"                                      [count]
  --indent                                                       [default: "  "]
```
