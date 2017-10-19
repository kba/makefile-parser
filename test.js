/* eslint no-tabs:0 */
const tap = require('tap')
const parse = str => require('.')(str, {strict: true})

tap.test('target', t => {
  t.deepEquals(parse(`file1: file2\n\trecipe`).ast, [
    {
      "target": "file1",
      "deps": ["file2"],
      "recipe": ["recipe"]
    },
  ])
  t.end()
})

tap.test('export', t => {
  t.test('global', t => {
    t.deepEquals(parse('export').ast, [{export: {global: true}}])
    t.end()
  })
  t.test('variable', t => {
    t.deepEquals(parse('export foo').ast, [{export: {variable: 'foo', value: undefined}}])
    t.end()
  })
  t.test('variable=value', t => {
    t.deepEquals(parse('export foo=42').ast, [{export: {variable: 'foo', value: '42'}}])
    t.end()
  })
  t.end()
})
