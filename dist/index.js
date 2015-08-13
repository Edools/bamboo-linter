function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('fs'), require('ramda'), require('rx'), require('bluebird'), require('chalk'), require('node-fetch'), require('cheerio')) : typeof define === 'function' && define.amd ? define(['exports', 'fs', 'ramda', 'rx', 'bluebird', 'chalk', 'node-fetch', 'cheerio'], factory) : factory(global.ThemeQA = {}, global.fs, global.R, global.rx, global.bluebird, global.chalk, global.fetch, global.cheerio);
})(this, function (exports, fs, R, rx, bluebird, chalk, fetch, cheerio) {
  'use strict';

  fs = 'default' in fs ? fs['default'] : fs;
  var R__default = 'default' in R ? R['default'] : R;
  chalk = 'default' in chalk ? chalk['default'] : chalk;
  fetch = 'default' in fetch ? fetch['default'] : fetch;

  var utils__error = R.compose(console.log, chalk.bold.red);
  var utils__success = R.compose(console.log, chalk.bold.green);
  var utils__info = R.compose(console.log, chalk.underline);
  var utils__highlight = R.compose(console.log, chalk.bold.yellow);

  var providers_config__readFile = bluebird.promisify(fs.readFile);

  function getApps(path) {
    return providers_config__readFile(path, { encoding: 'utf8' }).then(function (json) {
      return JSON.parse(json);
    }).then(function (apps) {
      return toArray(apps);
    })['catch'](function () {
      return utils__error('Your Appfile doesn\'t exist');
    });
  }

  function getAppRelease(_ref) {
    var name = _ref.name;
    var version = _ref.version;

    return getThemeConfig().then(function (config) {
      return fetch('https://api.myedools.com/apps/' + name + '/releases/' + version, getRequestHeaders(config));
    }).then(function (res) {
      return res.json();
    });
  }

  function getThemeConfig() {
    return providers_config__readFile('theme-config.json', { encoding: 'utf8' }).then(function (res) {
      return JSON.parse(res);
    })['catch'](function (err) {
      return utils__error('There is something wrong with your theme config file!', err);
    });
  }

  function getRequestHeaders(config) {
    return {
      headers: {
        Authorization: 'Token token=' + config.token
      }
    };
  }

  function toArray(apps) {
    return R.map(function (app) {
      return {
        name: app,
        version: apps[app]
      };
    }, R.keys(apps));
  }

  var onlyMessages = R__default.filter(R__default.compose(R__default.not, R__default.is(Boolean)));

  function lint(html, expectations) {
    var $ = cheerio.load(html);
    return onlyMessages(R__default.map(function (exp) {
      return isValid($, exp);
    }, expectations));
  }

  function hasAttribute($, _ref2) {
    var name = _ref2.name;
    var value = _ref2.value;

    var elems = $('[' + name + ']');
    var regexp = new RegExp(escapeRegex(value));
    var matchesAttr = function matchesAttr(elem) {
      return regexp.test(elem.attribs[name]);
    };

    return R__default.any(matchesAttr, elems);
  }

  function hasElement($, _ref3) {
    var name = _ref3.name;
    var attributes = _ref3.attributes;

    var elems = $('' + name);
    var matchesAllAttrs = function matchesAllAttrs(elem) {
      var attrs = R__default.keys(elem.attribs);
      var matchesOrNoExpect = function matchesOrNoExpect(attr) {
        var regexp = new RegExp(escapeRegex(attributes[attr]));
        return !attributes[attr] || regexp.test(elem.attribs[attr]);
      };
      return R__default.all(matchesOrNoExpect, attrs);
    };

    return R__default.any(matchesAllAttrs, elems);
  }

  function escapeRegex() {
    var value = arguments[0] === undefined ? '' : arguments[0];

    return value.replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  function isValid($, expectation) {
    var fn = expectation.type === 'A' ? hasAttribute : hasElement;
    return fn($, expectation) ? true : renderMessage(expectation);
  }

  function renderMessage(expectation) {
    var rendered = expectation.type === 'A' ? renderAttribute(expectation.name, expectation.value) : renderElement(expectation);

    var _expectation$message$split = expectation.message.split('{{ value }}');

    var _expectation$message$split2 = _slicedToArray(_expectation$message$split, 2);

    var prefix = _expectation$message$split2[0];
    var suffix = _expectation$message$split2[1];

    return [prefix, rendered, suffix];
  }

  function renderAttribute(name, value) {
    return name + '="' + value + '"';
  }

  function renderElement(_ref4) {
    var name = _ref4.name;
    var attributes = _ref4.attributes;

    var spacer = R__default.join(' ');
    var renderedAttrs = R__default.map(function (attr) {
      return renderAttribute(attr, attributes[attr]);
    }, R__default.keys(attributes));

    return '<' + name + ' ' + spacer(renderedAttrs) + '></' + name + '>';
  }

  function consoleReporter(filename, messages) {
    if (messages && messages.length > 0) {
      utils__info(filename + ' :');
      R.forEach(function (message) {
        var _message = _slicedToArray(message, 3);

        var prefix = _message[0];
        var target = _message[1];
        var suffix = _message[2];

        utils__error(prefix);
        utils__highlight('     ' + target);
        utils__error(suffix, '\n');
      }, messages);
    }
  }

  var console__default = consoleReporter;

  var index__readFile = bluebird.promisify(fs.readFile);

  function hasTemplates(path) {
    try {
      return fs.lstatSync(path);
    } catch (e) {
      utils__error('Your template folder doesn\'t exist');
    }
  }

  function readHTML(path) {
    return index__readFile(path, { encoding: 'utf8' });
  }

  function getTemplates(_ref5, templatesDir) {
    var expectations = _ref5.expectations;

    var templateNames = Object.keys(expectations);

    return rx.Observable.from(templateNames).flatMap(function (name) {
      var parsedName = name + '.html';
      return rx.Observable.fromPromise(readHTML(templatesDir + '/' + parsedName)).map(function (html) {
        return {
          name: parsedName,
          html: html,
          expectations: expectations[name]
        };
      });
    });
  }

  function lintTemplate(template) {
    template.messages = lint(template.html, template.expectations);
    return template;
  }

  function validateTheme(config) {
    console.log('Linting your Edools theme...');
    if (!hasTemplates(config.templatesDir)) {
      return;
    }

    rx.Observable.fromPromise(getApps(config.appfileDir)).flatMap(function (apps) {
      return rx.Observable.from(apps);
    }).filter(function (_ref6) {
      var name = _ref6.name;
      return name !== 'bamboo';
    }).flatMap(function (app) {
      return rx.Observable.fromPromise(getAppRelease(app));
    }).flatMap(function (release) {
      return getTemplates(release, config.templatesDir);
    }).map(function (template) {
      return lintTemplate(template);
    }).reduce(function (templates, template) {
      templates = templates.concat(template);
      return templates;
    }, []).subscribe(function (templates) {
      var hasAnyMessage = R.any(function (_ref7) {
        var messages = _ref7.messages;
        return messages.length > 0;
      }, templates);
      if (hasAnyMessage) {
        R.forEach(function (_ref8) {
          var name = _ref8.name;
          var messages = _ref8.messages;
          return console__default(name, messages);
        }, templates);
        utils__error('Your theme isn\'t valid');
        process.exit(1);
      } else {
        utils__success('Your theme is valid!');
      }
    });
  }

  exports.validateTheme = validateTheme;
});
//# sourceMappingURL=./index.js.map