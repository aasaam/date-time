#!/usr/bin/env node
const fs = require('fs');
const { resolve } = require('path');
const { execSync } = require('child_process');

const languages = require('../lib/languages');

const PROJECT_DIR = resolve(__dirname, '..');

const caGregorian = JSON.parse(
  fs.readFileSync(`${PROJECT_DIR}/node_modules/cldr-core/defaultContent.json`, {
    encoding: 'utf8',
  }),
);

const founded = [];
const matched = {};

caGregorian.defaultContent.forEach((locale) => {
  const m = locale.match(/^([a-z]{2})-([A-Z]{2})$/);
  if (m && m[1] && m[2] && languages.includes(m[1])) {
    founded.push(m[1]);
    const country = m[2];
    matched[m[1]] = country;
  }
});

const notFounded = languages.filter((x) => !founded.includes(x));
const specials = ['ar', 'az', 'zh'];
const diff1 = notFounded.filter((x) => !specials.includes(x));
const diff2 = specials.filter((x) => !notFounded.includes(x));

if (diff1.length !== 0 || diff2.length !== 0) {
  throw new Error('Special not match well');
}

matched.ar = 'EG';
matched.az = 'AZ';
matched.zh = 'CN';

const sortedMatched = Object.keys(matched)
  .sort()
  .reduce((acc, key) => {
    acc[key] = matched[key];
    return acc;
  }, {});

const defaultCountryPath = `${PROJECT_DIR}/lib/defaultCountry.js`;

fs.writeFileSync(
  defaultCountryPath,
  `module.exports = ${JSON.stringify(sortedMatched)}`,
);
execSync(
  `${PROJECT_DIR}/node_modules/.bin/prettier --write ${defaultCountryPath}`,
);
