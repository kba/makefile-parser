# makefile-parser

> Parse a Makefile into an abstract syntax tree

<!-- BEGIN-MARKDOWN-TOC -->
* [Installation](#installation)
* [API](#api)
* [CLI](#cli)
* [`make help`](#make-help)

<!-- END-MARKDOWN-TOC -->

## Installation

```sh
npm install -g @kba/makefile-parser
```

## API

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

Without options, build a plain-text help

## `make help`

1. Install [shinclude](https://github.com/kba/shinclude).
2. Add the following before the first target of your `Makefile`:

```make
# BEGIN-EVAL makefile-parser --make-help Makefile
# END-EVAL
```

3. Document all variables and targets useful to be shown help for with a single line comment directly above the declaration:

```make
# Spell to use. Default $(SPELL)
SPELL = xyzzy

# BEGIN-EVAL makefile-parser --make-help Makefile
# END-EVAL

# Casts the spell
cast:
	do stuff
```

4. Whenever you change the makefile, run

```
shinclude -c pound -i Makefile
```

which will result in

```make
# Spell to use. Default $(SPELL)
SPELL = xyzzy

# BEGIN-EVAL makefile-parser --make-help Makefile

help:
	@echo ""
	@echo "  Targets"
	@echo ""
	@echo "    cast  Casts the spell"
	@echo ""
	@echo "  Variables"
	@echo ""
	@echo "    SPELL  Spell to use. Default $(SPELL)"

# END-EVAL

# Casts the spell
cast:
	do stuff
```

5. Users of the makefile can then run

```sh
make help
```

or just

```sh
make
```

to get basic information on the targets and variables of the Makefile.
