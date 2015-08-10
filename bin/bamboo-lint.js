#! /usr/bin/env node
var ThemeQA = require('../dist/index');
var program = require('commander');
var Promise = require('bluebird');
var fs = require('fs');
var readFile = Promise.promisify(fs.readFile);

var DEFAULT_CONFIG = {
  templatesDir: 'app/templates',
  appfile: 'Appfile.json'
};

ThemeQA.validateTheme({
  templatesDir: program.templates || DEFAULT_CONFIG.templatesDir,
  appfileDir: program.appFile || DEFAULT_CONFIG.appfile
});
