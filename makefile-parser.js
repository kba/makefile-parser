const {readFileSync} = require("fs");
const path = require("path");

class Matcher {
  constructor({name, re, match, handle, terminal}) {
    this.name = name
    this.re = re
    this.match = (ctx, line) => {
      if (this.re && ! this.re.test(line)) return false
      if (match && ! match(ctx, line)) return false
      return true
    }
    this.handle = (ctx, line) => this.re
      ? line.replace(this.re, (_, ...args) => handle(ctx, line, ...args))
      : handle(ctx, line)
  }
}

const matchers = [
  {
    name: 'empty-line',
    re: /^(?:(?: \s*)?|#[^\s]*)$/,
    handle(ctx, line, recipe) {
      ctx.ast.push({emptyLine: true})
    }
  },
  {
    name: 'export',
    // re: /^export(?:\s*(?:([^=]+)(?:=(.*))))/,
    re: /^export(?:\s*(?:([^=]+)(?:=(.*))?)?)?/,
    handle(ctx, line, variable, value) {
      const global = variable === undefined && value === undefined
      ctx.ast.push({export: global ? {global} : {variable, value}})
    }
  },
  {
    name: 'recipe',
    re: /^\t+(.*)/,
    match(ctx, line) {
      const lastToken = ctx.ast[ctx.ast.length - 1]
      return lastToken && lastToken.target
    },
    handle(ctx, line, recipe) {
      const target = ctx.ast[ctx.ast.length - 1]
      target.recipe.push(recipe)
    }
  },
  {
    name: 'comment',
    re: /^# (.*)/,
    handle(ctx, line, comment) {
      const lastToken = ctx.ast[ctx.ast.length - 1]
      if (lastToken && lastToken.comment && Object.keys(lastToken).length == 1) {
        lastToken.comment.push(comment)
      } else {
        comment = [comment]
        ctx.ast.push({comment})
      }
    }
  },
  {
    name: 'include',
    re: /^include (.*)/,
    handle(ctx, line, filename) {
      const include_token = { include: filename };
      let lastToken = ctx.ast[ctx.ast.length - 1]
      if( lastToken && lastToken.comment ) {
        include_token['comment'] = lastToken.comment;

        // Pop the comment token, since it's already added in include_token
	ctx.ast.pop()
      }

      ctx.ast.push(include_token)
    }
  },
  {
    name: 'target',
    re: /^((?:[^:\t\s]|\:)+)\s*:([^=].*)?$/,
    handle(ctx, line, target, deps) {
      deps = (deps === undefined)
        ? []
        : deps.trim()
          .match(/([^\\ ]|\\\ ?)+/g)
          .map(s => s.trim())
          .filter(s => s)
      if (target === '.PHONY') {
        ctx.PHONY.push(...deps)
      } else {
        const lastToken = ctx.ast[ctx.ast.length - 1]
        const token = {target, deps, recipe: []}
        if (lastToken && lastToken.comment) {
          token.comment = ctx.ast.pop().comment
        }
        ctx.ast.push(token)
      }
    }
  },
  {
    name: 'variable',
    re: /^([^=\s]+)\s*[:\?\+]?=\s*(.*)$/,
    handle(ctx, line, variable, value) {
      const lastToken = ctx.ast[ctx.ast.length - 1]
      const token = {variable, value}
      if (lastToken && lastToken.comment) {
        token.comment = ctx.ast.pop().comment
      }
      ctx.ast.push(token)
    }
  },
].map(def => new Matcher(def))

module.exports = function parseMakefile(str, options={}) {
  if (!('strict' in options)) options.strict = false
  if (!('unhandled' in options)) options.unhandled = false
  if (!('isfilename' in options)) options.isfilename = false;

  function handleError(err) {
    if (options.strict) throw new Error(err)
    else console.error(err)
  }

  // 'Maybe' a filename, depending on options.isfilename, DONT use this variable elsewhere
  let filename = str;

  if( options.isfilename ) {
    str = readFileSync(filename).toString();
  }

  // Join continued lines
  str = str.replace(/\\\n\s*/g, '')
  const lines = str.split(/\n/)
  const ctx = {
    PHONY: [],
    ast: [],
    unhandled: []
  }

  for (let line of lines) {
    const list = matchers.filter(m => m.match(ctx, line))
    if (list.length === 0) {
      if (options.unhandled) {
        ctx.unhandled.push(`!! UNHANDLED: '${line}'`)
      } else {
        handleError(`!! UNHANDLED: '${line}'`)
      }
      continue
    } else if (list.length > 1) {
      handleError(`!! AMBIGUOUS: (${list.map(x => x.name)}) '${line}'`)
      continue
    } else {
      // Ensured in this branch, list contains only one element, so list[0] is fine
      list.map(m => m.handle(ctx, line))

      if (list[0].name === 'include') {
	if( options.isfilename === false ) {
	  handleError("Ignoring 'include' statements. For it to work, filename is required instead of content string.\nTo use it, use like this: parseMakefile(\"/path/to/makefile\", {isfilename: true})");
	} else {
	  const relative_path = ctx.ast[ctx.ast.length - 1].include;
	  const parent_dir = path.dirname(filename);
	  const absolute_path = path.join(parent_dir, relative_path);

	  // recursively call parseMakefile on the included file
	  const included_ctx = parseMakefile(absolute_path, {...options, isfilename: true});

	  // `included_ctx` contains context for the included file, merge it with our context
	  ctx.PHONY = ctx.PHONY.concat( included_ctx.PHONY );
	  ctx.ast = ctx.ast.concat( included_ctx.ast );
	  ctx.unhandled = ctx.unhandled.concat( included_ctx.unhandled );
	}
      }
    }
  }
  return ctx
}
