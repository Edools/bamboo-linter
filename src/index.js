import fs from 'fs';
import {any, forEach} from 'ramda';
import {Observable} from 'rx';
import {promisify} from 'bluebird';
import {error, success} from './utils';
import {getApps, getAppRelease} from './providers/config';
import {lint} from './linter';
import consoleReporter from './reporters/console';

const readFile = promisify(fs.readFile);

function hasTemplates(path) {
  try {
    return fs.lstatSync(path);
  } catch (e) {
    error('Your template folder doesn\'t exist');
  }
}

function readHTML (path) {
  return readFile(path, {encoding: 'utf8'});
}

function getTemplates ({expectations}, templatesDir) {
  let templateNames = Object.keys(expectations);

  return Observable.from(templateNames)
    .flatMap(name => {
      let parsedName = `${name}.html`;
      return Observable.fromPromise(readHTML(`${templatesDir}/${parsedName}`))
        .map(html => ({
          name: parsedName,
          html: html,
          expectations: expectations[name]
        }));
    });
}

function lintTemplate (template) {
  template.messages = lint(template.html, template.expectations);
  return template;
}

export function validateTheme (config) {
  console.log('Linting your Edools theme...');
  if (!hasTemplates(config.templatesDir)) {
    return;
  }

  Observable.fromPromise(getApps(config.appfileDir))
    .flatMap(apps => Observable.from(apps))
    .filter(({name}) => name !== 'bamboo')
    .flatMap(app => Observable.fromPromise(getAppRelease(app)))
    .flatMap(release => getTemplates(release, config.templatesDir))
    .map(template => lintTemplate(template))
    .reduce((templates, template) => {
      templates = templates.concat(template);
      return templates;
    }, [])
    .subscribe(templates => {
      let hasAnyMessage = any(({messages}) => messages.length > 0, templates);
      if (hasAnyMessage) {
        forEach(({name, messages}) => consoleReporter(name, messages), templates);
        error('Your theme isn\'t valid');
        process.exit(1);
      } else {
        success('Your theme is valid!');
      }
    });
}
