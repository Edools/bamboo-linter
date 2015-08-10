import {error, highlight, info} from '../utils';
import {forEach} from 'ramda';

function consoleReporter (filename, messages) {
  if (messages && messages.length > 0) {
    info(`${filename} :`);
    forEach(message => {
      let [prefix, target, suffix] = message;
      error(prefix);
      highlight(`     ${target}`);
      error(suffix, '\n');
    }, messages);
  }
}

export default consoleReporter;
