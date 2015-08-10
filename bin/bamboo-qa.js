#! /usr/bin/env node
var program = require('commander');
var pkg = require('../package.json');

program
  .version(pkg.version)
  .command('lint', 'Lints a bamboo theme')
  .option('-t, --templates [value]', 'Templates path')
  .option('-a, --appfile [value]', 'Appfile path')
  .parse(process.argv);
