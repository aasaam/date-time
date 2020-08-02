/* eslint-env jest */

require('full-icu');

const AasaamDateTime = require('../lib/AasaamDateTime');
const languages = require('../lib/languages');

describe('AasaamDateTime', () => {
  const calendars = ['g', 'p', 'i'];
  it('errors', () => {
    let ad;
    expect(() => {
      // @ts-ignore
      // eslint-disable-next-line no-new
      new AasaamDateTime(1);
    }).toThrow(Error);
    expect(() => {
      // @ts-ignore
      // eslint-disable-next-line no-new
      new AasaamDateTime('en', { foo: 1 });
    }).toThrow(Error);
    expect(() => {
      ad = new AasaamDateTime('fa');
      // @ts-ignore
      ad.yearOffset(1, 'z');
    }).toThrow(Error);
    expect(() => {
      ad = new AasaamDateTime('fa');
      // @ts-ignore
      ad.monthOffset(1, 'z');
    }).toThrow(Error);
    expect(() => {
      ad = new AasaamDateTime('fa');
      // @ts-ignore
      ad.dayOffset(1, 'z');
    }).toThrow(Error);
    expect(() => {
      ad = new AasaamDateTime('fa');
      // @ts-ignore
      ad.getMoment('z');
    }).toThrow(Error);
    expect(() => {
      ad = new AasaamDateTime();
      // @ts-ignore
      ad.isoFormatList('fa', 'z');
    }).toThrow(Error);
    expect(() => {
      ad = new AasaamDateTime();
      // @ts-ignore
      ad.parse('04:05:06', 'HH:mm:ss', 'z');
    }).toThrow(Error);
    expect(() => {
      ad = new AasaamDateTime();
      // @ts-ignore
      ad.generateYearList('z');
    }).toThrow(Error);
    expect(() => {
      ad = new AasaamDateTime();
      // @ts-ignore
      ad.generateMonthList('z');
    }).toThrow(Error);
    expect(() => {
      ad = new AasaamDateTime();
      // @ts-ignore
      ad.generateMonthWeekDays(['z']);
    }).toThrow(Error);
  });

  it('methods', () => {
    let ad;
    ad = new AasaamDateTime(undefined, new Date());
    ad = new AasaamDateTime('de', Math.round(Date.now() / 1000));
    expect(typeof AasaamDateTime.getTimeZone() === 'string');
    const d1 = ad.getDate().toDateString();
    ad.setUnixTime(ad.getUnixTime());
    const d2 = ad.getDate().toDateString();
    expect(d1).toBe(d2);
    ad.yearOffset(1);
    ad.monthOffset(1);
    ad.dayOffset(1);
    expect(ad.setDate(new Date()) instanceof AasaamDateTime);
    expect(ad.setHours(8) instanceof AasaamDateTime);
    expect(ad.setMinutes(8) instanceof AasaamDateTime);
    expect(ad.setSeconds(8) instanceof AasaamDateTime);
    expect(ad.changeCountry('IR') instanceof AasaamDateTime);
    expect(ad.changeCountry('US') instanceof AasaamDateTime);
    expect(ad.changeCountry('DE') instanceof AasaamDateTime);
    expect(ad.changeCountry('SA') instanceof AasaamDateTime);
    expect(ad.changeCountry('UK') instanceof AasaamDateTime);
    expect(ad.getDate() instanceof Date);
  });

  it('manipulation', () => {
    const ad = new AasaamDateTime('fa', new Date());
    ad.getMoment();
    for (let i = -5; i <= 5; i += 1) {
      calendars.forEach((cal) => {
        // @ts-ignore
        ad.yearOffset(i, cal);
        // @ts-ignore
        ad.monthOffset(i, cal);
        // @ts-ignore
        ad.dayOffset(i, cal);
        // @ts-ignore
        ad.getMoment(cal);
      })
    }
  });

  it('format', () => {
    const ad = new AasaamDateTime('fa', new Date("2001-04-29 04:05:06"));
    ad.isoFormatList();
    ad.isoFormat('EEEE d MMMM YYYY');
    ad.isoFormat('bbbb EEEE');
    ad.parse('04:05:06', 'HH:mm:ss');
    calendars.forEach((cal) => {
      ad.parse('04:05:06', 'HH:mm:ss', cal);
      languages.forEach((l) => {
        // @ts-ignore
        ad.isoFormatList(l, cal);
      });
    });
    ad.format('LLLL');
    ad.format('LLLL', 'fr');
    ad.format('jD');
    ad.format('iD');
  });

  it('generate 1', () => {
    const ad = new AasaamDateTime('fa');
    ad.generateYearList(undefined, 5);
    ad.generateYearList();
    ad.generateMonthList();
    calendars.forEach((cal) => {
      ad.generateYearList(cal);
      ad.generateMonthList(cal);
    });
  });

  it('generate loop', () => {
    languages.forEach((lang) => {
      const ad = new AasaamDateTime(lang);
      ad.generateMonthWeekDays();
      ad.generateMonthWeekTable();
      calendars.forEach((cal) => {
        ad.generateMonthWeekDays([cal]);
        ad.generateMonthWeekTable([cal]);
        ad.generateMonthWeekDays([cal], true);
        ad.generateMonthWeekTable([cal], true);
        ad.generateMonthWeekDays([cal], false);
        ad.generateMonthWeekTable([cal], false);
      });
    });

  });

  it('generate sample 2', () => {
    const ad = new AasaamDateTime('zh');
    ad.generateMonthWeekDays(['g', 'p']);
    ad.generateMonthWeekDays(['i', 'p']);
  });
});
