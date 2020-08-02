#!/usr/bin/env node
const fs = require('fs');
const { resolve } = require('path');
const { execSync } = require('child_process');

const languages = require('../lib/languages');

const PROJECT_DIR = resolve(__dirname, '..');

execSync(`rm -rf ${PROJECT_DIR}/lib/calendars`);
execSync(`mkdir ${PROJECT_DIR}/lib/calendars`);

const indexPath = `${PROJECT_DIR}/lib/calendars/index.js`;
const indexContent = [];
const indexModules = [];

languages.forEach((lang) => {
  const caGregorian = JSON.parse(fs.readFileSync(`${PROJECT_DIR}/node_modules/cldr-dates-full/main/${lang}/ca-gregorian.json`, { encoding: 'utf8' }));
  const caIslamic = JSON.parse(fs.readFileSync(`${PROJECT_DIR}/node_modules/cldr-cal-islamic-full/main/${lang}/ca-islamic.json`, { encoding: 'utf8' }));
  const caPersian = JSON.parse(fs.readFileSync(`${PROJECT_DIR}/node_modules/cldr-cal-persian-full/main/${lang}/ca-persian.json`, { encoding: 'utf8' }));

  const week = Object.values(caGregorian.main[lang].dates.calendars.gregorian.days.format.wide);
  const weekNarrow = Object.values(caGregorian.main[lang].dates.calendars.gregorian.days.format.narrow);

  const georgianEra = caGregorian.main[lang].dates.calendars.gregorian.eras.eraNames['1'];
  const georgianEraAbbr = caGregorian.main[lang].dates.calendars.gregorian.eras.eraAbbr['1'];

  const persianEra = caPersian.main[lang].dates.calendars.persian.eras.eraNames['0'];
  const persianEraAbbr = caPersian.main[lang].dates.calendars.persian.eras.eraAbbr['0'];

  const islamicEra = caIslamic.main[lang].dates.calendars.islamic.eras.eraNames['0'];
  const islamicEraAbbr = caIslamic.main[lang].dates.calendars.islamic.eras.eraAbbr['0'];

  const georgian = Object.values(caGregorian.main[lang].dates.calendars.gregorian.months.format.wide);
  const islamic = Object.values(caIslamic.main[lang].dates.calendars.islamic.months.format.wide);
  const persian = Object.values(caPersian.main[lang].dates.calendars.persian.months.format.wide);

  const calendar = {
    week,
    weekNarrow,
    g: {
      name: georgianEra,
      nameAbbr: georgianEraAbbr,
      month: georgian,
    },
    i: {
      name: islamicEra,
      nameAbbr: islamicEraAbbr,
      month: islamic,
    },
    p: {
      name: persianEra,
      nameAbbr: persianEraAbbr,
      month: persian,
    },
  };

  const path = `${PROJECT_DIR}/lib/calendars/${lang}.js`;
  fs.writeFileSync(path, `module.exports = ${JSON.stringify(calendar)}`);
  execSync(`${PROJECT_DIR}/node_modules/.bin/prettier --write ${path}`);
  indexContent.push(`const ${lang} = require('./${lang}');`)
  indexModules.push(`${lang},`);
});

indexContent.push('');

indexContent.push('module.exports = {');
indexContent.push(indexModules.join('\n'));
indexContent.push('}');
fs.writeFileSync(indexPath, indexContent.join('\n'));
execSync(`${PROJECT_DIR}/node_modules/.bin/prettier --write ${indexPath}`);
