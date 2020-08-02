#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies, no-underscore-dangle */
const fs = require('fs');
const { resolve } = require('path');
const { execSync } = require('child_process');
const { isEqual, uniq } = require('lodash');

const PROJECT_DIR = resolve(__dirname, '..');

const weekData = JSON.parse(fs.readFileSync(`${PROJECT_DIR}/node_modules/cldr-core/supplemental/weekData.json`, { encoding: 'utf8' }));

const { firstDay } = weekData.supplemental.weekData;
const { weekendStart } = weekData.supplemental.weekData;
const { weekendEnd } = weekData.supplemental.weekData;

const jsMap = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const weekDays = {
};

Object.keys(firstDay).forEach((code) => {
  if (!code.match(/^[A-Z]{2}$/)) {
    return;
  }

  const start = jsMap[firstDay[code]];
  const days = [];
  for (let i = start; i <= (start + 6); i += 1) {
    let j = i;
    if (j > 6) {
      j = Math.abs(7 - j);
    }
    days.push(j);
  }

  if (!isEqual(weekDays._default, days)) {
    weekDays[code] = days;
  }

});

const weekend = {
};

Object.keys(weekendStart).forEach((code) => {
  if (!code.match(/^[A-Z]{2}$/)) {
    return;
  }

  const start = jsMap[weekendStart[code]];
  const end = jsMap[weekendEnd[code]];
  const days = [start, end];
  if (!isEqual(weekend._default, days)) {
    weekend[code] = uniq(days).filter((o) => o >= 0);
  }
});

const sortedWeekDays = Object.keys(weekDays)
  .sort()
  .reduce((acc, key) => {
    acc[key] = weekDays[key];
    return acc;
  }, {});

const sortedWeekend = Object.keys(weekend)
  .sort()
  .reduce((acc, key) => {
    acc[key] = weekend[key];
    return acc;
  }, {});

const weekDaysPath = `${PROJECT_DIR}/lib/weekDays.js`;
const weekendsPath = `${PROJECT_DIR}/lib/weekends.js`;

fs.writeFileSync(weekDaysPath, `module.exports = ${JSON.stringify(sortedWeekDays)}`);
fs.writeFileSync(weekendsPath, `module.exports = ${JSON.stringify(sortedWeekend)}`);
execSync(`${PROJECT_DIR}/node_modules/.bin/prettier --write ${weekDaysPath}`);
execSync(`${PROJECT_DIR}/node_modules/.bin/prettier --write ${weekendsPath}`);

