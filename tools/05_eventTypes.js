#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies, no-underscore-dangle */
const fs = require('fs');
const os = require('os');
const { resolve } = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const { parallelLimit } = require('async');
const got = require('got').default;

const languages = require('../lib/languages');

const fsp = fs.promises;
const { log } = console;

const PROJECT_DIR = resolve(__dirname, '..');

const gData = JSON.parse(fs.readFileSync(`${PROJECT_DIR}/node_modules/cal-events/gregorian.json`, { encoding: 'utf8' }));
const iData = JSON.parse(fs.readFileSync(`${PROJECT_DIR}/node_modules/cal-events/hijri.json`, { encoding: 'utf8' }));
const pData = JSON.parse(fs.readFileSync(`${PROJECT_DIR}/node_modules/cal-events/jalali.json`, { encoding: 'utf8' }));

const gEvents = gData.events;
const iEvents = iData.events;
const pEvents = pData.events;

const getWikiUrlApi = (url) => {
  const u = new URL(url);
  const m = u.hostname.match(/([a-z]{2})\.wikipedia/);
  if (m && m[1]) {
    return {
      api: `https://${m[1]}.wikipedia.org/w/api.php`,
      lang: m[1],
    };
  }

  throw new Error('Invalid wikipedia url');
};


const getWikiLanguagesAndTitles = async (url) => {
  const cacheHash = crypto.createHash('md5').update(url).digest('hex');
  const cacheFile = resolve(os.tmpdir(), `wp-pl-${cacheHash}.json`);
  const cacheExist = await new Promise((res) => {
    fsp.access(cacheFile, fs.constants.F_OK).then(() => res(true)).catch(() => res(false));
  });
  if (cacheExist) {
    return JSON.parse(await fsp.readFile(cacheFile, { encoding: 'utf8' }));
  }

  const sourceUrl = new URL(url);
  const tm = sourceUrl.pathname.match(/wiki\/(.*)/);
  if (!tm || !tm[1]) {
    throw new Error('Invalid wikipedia url');
  }
  const { lang } = getWikiUrlApi(url);
  const u = new URL(`https://${lang}.wikipedia.org/w/api.php?action=query&prop=langlinks&format=json&llprop=url%7Clangname`);
  const title = decodeURIComponent(tm[1]).replace(/[_]+/g, ' ');
  u.searchParams.set('titles', title);
  const json = await got(u.href).json();
  const [pageId] = Object.keys(json.query.pages);
  u.searchParams.delete('titles');
  u.searchParams.set('pageids', pageId);
  const json2 = await got(u.href).json();
  const pageData = json2.query.pages[pageId];
  const data = {};
  if (!pageData.langlinks) {
    const errorMessage = `Cannot find: "${pageId}" "${title}" ${u.href}`;
    throw new Error(errorMessage);
  }
  pageData.langlinks.forEach((ln) => {
    if (languages.includes(ln.lang)) {
      data[ln.lang] = ln['*'];
    }
  });

  await fsp.writeFile(cacheFile, JSON.stringify(data));
  await new Promise((res) => setTimeout(res, 300));
  return data;
};


const allEvents = {};

const eventIterate = async (e, t2) => {
  const key = `${t2}${e.month.toString().padStart(2, '0')}${e.day.toString().padStart(2, '0')}`;
  const { year } = e;
  const holiday = {};
  if (e.holiday) {
    if (e.holiday.Iran) {
      holiday.IR = true;
    } else {
      log('Seems calendar add more than Iran');
      log(e);
      process.exit(1);
    }
  }

  const title = {};
  const sources = {};

  Object.keys(e.title).forEach((loc) => {
    const [l] = loc.match(/^([a-z]{2})/);
    const t = e.title[loc];
    title[l] = t;
  });
  if (e.sources) {
    e.sources.forEach((s) => {
      const u = new URL(s);
      const m = u.hostname.match(/([a-z]{2})\.wikipedia/);
      if (m && m[1] && languages.includes(m[1])) {
        sources[m[1]] = s;
      }
    });
  }

  if (!allEvents[key]) {
    allEvents[key] = [];
  }

  allEvents[key].push({
    title,
    sources,
    holiday,
    year,
  });

};

gEvents.forEach((e) => {
  eventIterate(e, 'g');
});

pEvents.forEach((e) => {
  eventIterate(e, 'p');
});

iEvents.forEach((e) => {
  eventIterate(e, 'i');
});



(async () => {


  const funcs = [];
  Object.keys(allEvents).forEach((eDate) => {
    const es = allEvents[eDate];
    es.forEach((e, ind) => {
      if (Object.keys(e.sources).length) {
        Object.keys(e.sources).forEach((sourceLang) => {
          const sourceUrl = new URL(e.sources[sourceLang]);
          const titles = allEvents[eDate][ind].title;
          funcs.push((cb) => {
            getWikiLanguagesAndTitles(sourceUrl.href).then((data) => {
              // console.log([data, allEvents[eDate][ind].title]);
              Object.keys(data).forEach((newLang) => {
                if (!allEvents[eDate][ind].title[newLang] && languages.includes(newLang) && !titles[newLang]) {
                  titles[newLang] = data[newLang];
                }
              });

              const sortedTitles = Object.keys(titles)
                .sort()
                .reduce((acc, key) => {
                  acc[key] = titles[key];
                  return acc;
                }, {});

              allEvents[eDate][ind].title = sortedTitles;

              cb(null);
            }).catch((er) => {
              log(er);
              cb(null);
            });
          });
        });
      }
    });
  });

  await new Promise((res) => {
    parallelLimit(funcs, 3, (e) => {
      if (e) {
        log(e);
      }
      res();
    });
  });

  const eventCollection = {};

  Object.keys(allEvents).forEach((eDate) => {
    const es = allEvents[eDate];
    es.forEach((e, ind) => {
      if (!eventCollection[eDate]) {
        eventCollection[eDate] = [];
      }
      eventCollection[eDate].push({
        title: allEvents[eDate][ind].title,
        holiday: allEvents[eDate][ind].holiday,
        year: allEvents[eDate][ind].year,
      });
    });
  });

  const sortedEventCollection = Object.keys(eventCollection)
    .sort()
    .reduce((acc, key) => {
      acc[key] = eventCollection[key];
      return acc;
    }, {});


  const defaultPath = `${PROJECT_DIR}/lib/events.js`;

  fs.writeFileSync(defaultPath, `module.exports = ${JSON.stringify(sortedEventCollection)}`);
  execSync(`${PROJECT_DIR}/node_modules/.bin/prettier --write ${defaultPath}`);

})();





