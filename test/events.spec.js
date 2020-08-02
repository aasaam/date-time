/* eslint-env jest */

require('full-icu');

const events = require('../lib/events');
const languages = require('../lib/languages');

const { log } = console;

describe('events', () => {
  const calendars = ['g', 'p', 'i'];
  it('check', () => {
    Object.keys(events).forEach((eventKey) => {
      const evs = events[eventKey];
      const m = eventKey.match(/^([a-z]{1})([0-9]{2})([0-9]{2})$/);
      expect(calendars.includes(m[1]));

      evs.forEach((ev) => {
        if (!ev.title.en) {
          log(ev);
        }
        expect(ev.title.en).toBeTruthy();
        Object.keys(ev.title).forEach((lang) => {
          expect(languages.includes(lang));
        });
      });
    });
  });
});
