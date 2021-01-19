#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');
const { resolve } = require('path');
const { execSync } = require('child_process');
const { uniq } = require('lodash');

const PROJECT_DIR = resolve(__dirname, '..');

const unicodeData = JSON.parse(
  fs.readFileSync(
    `${PROJECT_DIR}/node_modules/cldr-core/supplemental/calendarPreferenceData.json`,
    { encoding: 'utf8' },
  ),
);

const { calendarPreferenceData } = unicodeData.supplemental;

const matched = {};

Object.keys(calendarPreferenceData).forEach((code) => {
  if (!code.match(/^[A-Z]{2}$/)) {
    return;
  }
  const calendars = uniq(
    calendarPreferenceData[code]
      .split(' ')
      .map((cal) => {
        if (cal === 'gregorian') {
          return 'g';
        }
        if (cal === 'persian') {
          return 'p';
        }
        return false;
      })
      .filter((c) => c),
  );

  matched[code] = calendars;
});

const sortedMatched = Object.keys(matched)
  .sort()
  .reduce((acc, key) => {
    acc[key] = matched[key];
    return acc;
  }, {});

const preferredCalendarsPath = `${PROJECT_DIR}/lib/preferredCalendars.js`;

fs.writeFileSync(
  preferredCalendarsPath,
  `module.exports = ${JSON.stringify(sortedMatched)}`,
);
execSync(
  `${PROJECT_DIR}/node_modules/.bin/prettier --write ${preferredCalendarsPath}`,
);
