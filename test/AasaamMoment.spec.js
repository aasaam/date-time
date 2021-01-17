/* eslint-env jest */

require('full-icu');

const {
  AasaamDateTime,
  languages,
  CALENDAR_TYPE_GREGORIAN,
  CALENDAR_TYPE_PERSIAN,
  CALENDAR_TYPE_ISLAMIC,
} = require('../lib/AasaamDateTime');

const calFormats = ['YY', 'iYY', 'jYY'];

describe('AasaamDateTime', () => {
  const calendars = [
    CALENDAR_TYPE_GREGORIAN,
    CALENDAR_TYPE_PERSIAN,
    CALENDAR_TYPE_ISLAMIC,
  ];
  it('getEventKey', () => {
    calendars.forEach((c) => {
      const mNum = Math.floor(Math.random() * 12) + 1;
      const dNum = Math.floor(Math.random() * 31) + 1;
      expect(AasaamDateTime.getEventKey(c, mNum, dNum)).toBeTruthy();
      expect(
        AasaamDateTime.getEventKey(c, mNum.toString(), dNum.toString()),
      ).toBeTruthy();
    });
  });
  it('getSupportedLanguages', () => {
    expect(languages).toBeTruthy();
  });
  it('getSupportedLanguages', () => {
    expect(AasaamDateTime.getTimeZone()).toBeTruthy();
  });
  it('errors', () => {
    let ad;
    expect(() => {
      // @ts-ignore
      // eslint-disable-next-line no-new
      new AasaamDateTime('fa');
    }).toThrow(Error);
    expect(() => {
      // @ts-ignore
      // eslint-disable-next-line no-new
      new AasaamDateTime('fa', 'xx');
    }).toThrow(Error);
    expect(() => {
      // @ts-ignore
      ad = new AasaamDateTime(new Date(), 'fa');
      ad.setLanguage('zz');
    }).toThrow(Error);
    expect(() => {
      // @ts-ignore
      ad = new AasaamDateTime(new Date(), 'fa');
      ad.isoFormatObject('fa', 'z');
    }).toThrow(Error);
    expect(() => {
      // @ts-ignore
      ad = new AasaamDateTime(new Date(), 'fa');
      ad.momentParse('2012', 'yyyy', 'z');
    }).toThrow(Error);
    expect(() => {
      // @ts-ignore
      ad = new AasaamDateTime(new Date(), 'fa');
      ad.getMoment('z');
    }).toThrow(Error);
    expect(() => {
      // @ts-ignore
      ad = new AasaamDateTime(new Date(), 'fa');
      ad.yearOffset(1, 'z');
    }).toThrow(Error);
    expect(() => {
      // @ts-ignore
      ad = new AasaamDateTime(new Date(), 'fa');
      ad.monthOffset(1, 'z');
    }).toThrow(Error);
    expect(() => {
      // @ts-ignore
      ad = new AasaamDateTime(new Date(), 'fa');
      ad.dayOffset(1, 'z');
    }).toThrow(Error);
    expect(() => {
      // @ts-ignore
      ad = new AasaamDateTime(new Date(), 'fa');
      ad.generateYearList('z', 1);
    }).toThrow(Error);
    expect(() => {
      // @ts-ignore
      ad = new AasaamDateTime(new Date(), 'fa');
      ad.generateMonthList('z');
    }).toThrow(Error);
    expect(() => {
      // @ts-ignore
      ad = new AasaamDateTime(new Date(), 'fa');
      ad.getAlternateCalendarData(new Date(), 'z');
    }).toThrow(Error);
    expect(() => {
      // @ts-ignore
      ad = new AasaamDateTime(new Date(), 'fa');
      ad.generateMonthWeekDays(['z']);
    }).toThrow(Error);
  });

  it('methods', () => {
    const ad = new AasaamDateTime(new Date('2021-03-21 12:00:00'), 'fa');
    ad.generateMonthWeekDays(undefined, true);
    ad.generateMonthWeekTable(undefined, true);
  });

  it('methods', () => {
    let ad;
    ad = new AasaamDateTime();
    ad = new AasaamDateTime(new Date('2021-01-27 12:00:00'), 'fa');
    ad.generateMonthWeekDays(undefined, true);
    ad = new AasaamDateTime(new Date('2021-01-17 12:00:00'), 'fa');
    ad.generateMonthWeekDays(
      [CALENDAR_TYPE_GREGORIAN, CALENDAR_TYPE_ISLAMIC, CALENDAR_TYPE_PERSIAN],
      true,
    );
    ad = new AasaamDateTime(new Date('2021-01-17 12:00:00'), 'de');
    ad.generateMonthWeekDays([CALENDAR_TYPE_GREGORIAN], true);
    ad.isoFormatObject();
    ad.generateYearList(undefined, 1);
    ad.generateYearList();
    ad.generateMonthList();
    calFormats.forEach((f) => {
      ad.isoFormat(f);
      ad.momentFormat(f);
    });
    calendars.forEach((c) => {
      ad.generateYearList(c);
      ad.generateMonthList(c);
      ad.generateMonthWeekDays([c]);
      ad.generateMonthWeekDays([c], true);
      ad.generateMonthWeekTable();
      ad.generateMonthWeekTable([c], true);
      ad.getAlternateCalendarData(new Date(), c);
    });

    const d1 = ad.getDate().toDateString();
    ad.setUnixTime(ad.getUnixTime());
    const d2 = ad.getDate().toDateString();
    expect(d1).toBe(d2);
    ad = new AasaamDateTime(ad.getUnixTime());
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
    languages.forEach((l) => {
      calFormats.forEach((f) => {
        ad.momentFormat(f, l);
        ad.momentParse('12', 'H');
        calendars.forEach((c) => {
          ad.momentParse('12', 'H', c);
          ad.isoFormatObject(l, c);
          ad.isoFormat(f, l, c);
        });
      });
    });
  });

  it('offset and moment', () => {
    const ad = new AasaamDateTime(new Date(), 'en');
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
      });
    }
  });

  it('samples', () => {
    // const ad = new AasaamDateTime(new Date('2021-03-20 12:00:00'), 'fa');
    const ad = new AasaamDateTime();
    // console.log(ad.isoFormatObject());
    console.log(ad.isoFormat('EEEE d MMMM YYYY HH:mm'));
  });
});
