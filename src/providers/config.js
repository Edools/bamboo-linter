import {map, keys} from 'ramda';
import {promisify} from 'bluebird';
import fs from 'fs';
import {error} from '../utils';
import fetch from 'node-fetch';

const readFile = promisify(fs.readFile);

export function getApps (path) {
  return readFile(path, {encoding: 'utf8'})
    .then(json => JSON.parse(json))
    .then(apps => toArray(apps))
    .catch(() => error('Your Appfile doesn\'t exist'));
}

export function getAppRelease ({name, version}) {
  return getThemeConfig()
    .then(config => {
      return fetch(`https://api.myedools.com/apps/${name}/releases/${version}`, getRequestHeaders(config));
    })
    .then(res => res.json());
}

function getThemeConfig () {
  return readFile('theme-config.json', {encoding: 'utf8'})
    .then(res => JSON.parse(res))
    .catch(err => error('There is something wrong with your theme config file!', err));
}

function getRequestHeaders (config) {
  return {
    headers: {
      Authorization: `Token token=${config.token}`
    }
  };
}

function toArray (apps) {
  return map(app => ({
    name: app,
    version: apps[app]
  }), keys(apps));
}

