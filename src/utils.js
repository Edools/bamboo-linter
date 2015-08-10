import chalk from 'chalk';
import {compose} from 'ramda';

let error = compose(console.log, chalk.bold.red);
let success = compose(console.log, chalk.bold.green);
let info = compose(console.log, chalk.underline);
let highlight = compose(console.log, chalk.bold.yellow);

export { error, success, info, highlight };
