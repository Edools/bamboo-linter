import R from 'ramda';
import {load} from 'cheerio';

const onlyMessages = R.filter(R.compose(R.not, R.is(Boolean)));

export function lint (html, expectations) {
  let $ = load(html);
  return onlyMessages(R.map(exp => isValid($, exp), expectations));
}

export function hasAttribute ($, {name, value}) {
  let elems = $(`[${name}]`);
  let regexp = new RegExp(escapeRegex(value));
  let matchesAttr = elem => regexp.test(elem.attribs[name]);

  return R.any(matchesAttr, elems);
}

export function hasElement ($, {name, attributes}) {
  let elems = $(`${name}`);
  let matchesAllAttrs = elem => {
    let attrs = R.keys(elem.attribs);
    let matchesOrNoExpect = attr => {
      let regexp = new RegExp(escapeRegex(attributes[attr]));
      return !attributes[attr] || regexp.test(elem.attribs[attr]);
    };
    return R.all(matchesOrNoExpect, attrs);
  };

  return R.any(matchesAllAttrs, elems);
}

function escapeRegex (value = '') {
  return value
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function isValid ($, expectation) {
  let fn = expectation.type === 'A' ? hasAttribute : hasElement;
  return fn($, expectation) ? true : renderMessage(expectation);
}

function renderMessage (expectation) {
  let rendered = expectation.type === 'A'
    ? renderAttribute(expectation.name, expectation.value)
    : renderElement(expectation);
  let [prefix, suffix] = expectation.message.split('{{ value }}');

  return [prefix, rendered, suffix];
}

function renderAttribute (name, value) {
  return `${name}="${value}"`;
}

function renderElement ({name, attributes}) {
  let spacer = R.join(' ');
  let renderedAttrs = R.map(attr => {
    return renderAttribute(attr, attributes[attr]);
  }, R.keys(attributes));

  return `<${name} ${spacer(renderedAttrs)}></${name}>`;
}
