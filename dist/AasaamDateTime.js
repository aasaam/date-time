(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const groupBy = require('lodash.groupby');
const momentG = require('moment');
const momentH = require('moment-hijri');
const momentJ = require('moment-jalaali');

const calendars = require('./calendars');
const languages = require('./languages');
const defaultCountry = require('./defaultCountry');
const events = require('./events');
const preferredCalendars = require('./preferredCalendars');
const weekDays = require('./weekDays');
const weekends = require('./weekends');

const CALENDAR_TYPE_GREGORIAN = 'g';
const CALENDAR_TYPE_ISLAMIC = 'i';
const CALENDAR_TYPE_PERSIAN = 'p';

class AasaamDateTime {
  /**
   * @param {('p'|'i'|'g')} calendar Calendar type
   * @param {Number|String} month
   * @param {Number|String} day
   * @return {String}
   */
  static getEventKey(calendar, month, day) {
    return `${calendar}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`
  }

  /**
   * @returns {String}
   */
  static getTimeZone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * @param {('ar'|'az'|'bn'|'de'|'en'|'es'|'fa'|'fr'|'hi'|'id'|'it'|'ja'|'ko'|'ku'|'nl'|'pl'|'ps'|'pt'|'ru'|'sw'|'tr'|'ur'|'zh')} lang Supported language
   * @param {Date|Number} date Standard JavaScript Date object or integer unix time
   */
  constructor(lang = 'fa', date = new Date()) {
    if (date instanceof Date) {
      /** @type {Date} */
      this.date = date;
    } else if (Number.isInteger(date)) {
      this.date = new Date(date * 1000);
    } else {
      throw new Error('Invalid `Date` Object');
    }

    this.date.setMilliseconds(0);

    if (calendars[lang] && languages.includes(lang)) {
      this.lang = lang;
    } else {
      throw new Error('Unsupported language');
    }

    this.changeCountry(defaultCountry[this.lang]);
  }

  /**
   * @param {Date} date Standard JavaScript Date object
   * @return {AasaamDateTime}
   */
  setDate(date) {
    this.date = date;
    this.date.setMilliseconds(0);
    return this;
  }

  /**
   * @param {Number} num Unix time integer
   * @return {AasaamDateTime}
   */
  setUnixTime(num) {
    this.date = new Date(parseInt(num, 10) * 1000);
    return this;
  }

  /**
   * @return {Number}
   */
  getUnixTime() {
    return Math.round(this.date.getTime() / 1000);
  }

  /**
   * @returns {Date}
   */
  getDate() {
    return this.date;
  }

  /**
   * @param {Number} hours Hour number
   * @return {AasaamDateTime}
   */
  setHours(hours) {
    this.date.setHours(hours);
    return this;
  }

  /**
   * @param {Number} minutes Minute number
   * @return {AasaamDateTime}
   */
  setMinutes(minutes) {
    this.date.setMinutes(minutes);
    return this;
  }

  /**
   * @param {Number} seconds Second number
   * @return {AasaamDateTime}
   */
  setSeconds(seconds) {
    this.date.setSeconds(seconds);
    return this;
  }

  /**
   * @param {String} country Country ISO 2 code
   */
  changeCountry(country) {
    this.country = country;

    if (weekDays[this.country]) {
      this.weekDays = weekDays[this.country];
    } else {
      this.weekDays = [1, 2, 3, 4, 5, 6, 0];
    }

    if (preferredCalendars[this.country]) {
      this.calendars = preferredCalendars[this.country];
    } else {
      this.calendars = ['g'];
    }
    if (weekends[this.country]) {
      this.weekend = weekends[this.country];
    } else {
      this.weekend = [6, 0];
    }
    return this;
  }

  /**
   * @param {('p'|'i'|'g')} calendar Calendar type
   * @return {import('moment').Moment|import('moment-jalaali').Moment|import('moment-hijri').Moment}
   */
  getMoment(calendar = undefined) {
    let [cal] = this.calendars;
    if (calendar !== undefined) {
      cal = calendar;
    }
    if (cal === CALENDAR_TYPE_PERSIAN) {
      return momentJ(this.date);
    }

    if (cal === CALENDAR_TYPE_ISLAMIC) {
      return momentH(this.date);
    }

    if (cal === CALENDAR_TYPE_GREGORIAN) {
      return momentG(this.date);
    }

    throw new Error('Calendar not supported');
  }

  /**
   * @param {Number} offset Could be negative or positive number
   * @param {('p'|'i'|'g')} calendar Calendar type
   * @return {AasaamDateTime}
   */
  yearOffset(offset, calendar = undefined) {
    let [cal] = this.calendars;
    if (calendar !== undefined) {
      cal = calendar;
    }
    if (cal === CALENDAR_TYPE_PERSIAN) {
      if (offset >= 0) {
        this.date = momentJ(this.date).add(offset, 'jYear').toDate();
      } else {
        this.date = momentJ(this.date).subtract(offset, 'jYear').toDate();
      }
    } else if (cal === CALENDAR_TYPE_ISLAMIC) {
      if (offset >= 0) {
        this.date = momentH(this.date).add(offset, 'iYear').toDate();
      } else {
        this.date = momentH(this.date).subtract(offset, 'iYear').toDate();
      }
    } else if (cal === CALENDAR_TYPE_GREGORIAN) {
      if (offset >= 0) {
        this.date = momentG(this.date).add(offset, 'year').toDate();
      } else {
        this.date = momentG(this.date).subtract(offset, 'year').toDate();
      }
    } else {
      throw new Error('Calendar not supported');
    }

    return this;
  }

  /**
   * @param {Number} offset Could be negative or positive number
   * @param {('p'|'i'|'g')} calendar Calendar type
   * @return {AasaamDateTime}
   */
  monthOffset(offset, calendar = undefined) {
    let [cal] = this.calendars;
    if (calendar !== undefined) {
      cal = calendar;
    }
    if (cal === CALENDAR_TYPE_PERSIAN) {
      if (offset >= 0) {
        this.date = momentJ(this.date).add(offset, 'jMonth').toDate();
      } else {
        this.date = momentJ(this.date).subtract(offset, 'jMonth').toDate();
      }
    } else if (cal === CALENDAR_TYPE_ISLAMIC) {
      if (offset >= 0) {
        this.date = momentH(this.date).add(offset, 'iMonth').toDate();
      } else {
        this.date = momentH(this.date).subtract(offset, 'iMonth').toDate();
      }
    } else if (cal === CALENDAR_TYPE_GREGORIAN) {
      if (offset >= 0) {
        this.date = momentG(this.date).add(offset, 'month').toDate();
      } else {
        this.date = momentG(this.date).subtract(offset, 'month').toDate();
      }
    } else {
      throw new Error('Calendar not supported');
    }

    return this;
  }

  /**
   * @param {Number} offset Could be negative or positive number
   * @param {('p'|'i'|'g')} calendar Calendar type
   * @return {AasaamDateTime}
   */
  dayOffset(offset, calendar = undefined) {
    let [cal] = this.calendars;
    if (calendar !== undefined) {
      cal = calendar;
    }
    if (cal === CALENDAR_TYPE_PERSIAN) {
      if (offset >= 0) {
        this.date = momentJ(this.date).add(offset, 'day').toDate();
      } else {
        this.date = momentJ(this.date).subtract(offset, 'day').toDate();
      }
    } else if (cal === CALENDAR_TYPE_ISLAMIC) {
      if (offset >= 0) {
        this.date = momentH(this.date).add(offset, 'day').toDate();
      } else {
        this.date = momentH(this.date).subtract(offset, 'day').toDate();
      }
    } else if (cal === CALENDAR_TYPE_GREGORIAN) {
      if (offset >= 0) {
        this.date = momentG(this.date).add(offset, 'day').toDate();
      } else {
        this.date = momentG(this.date).subtract(offset, 'day').toDate();
      }
    } else {
      throw new Error('Calendar not supported');
    }

    return this;
  }

  /**
   * ISO format list
   *
   * Return object contains standard ISO 8601 Date
   * - `H` _Hour, (0-23), one or two digit_ (**۴**)
   * - `HH` _Hour, (00-23), two digit_ (**۰۴**)
   * - `m` _Minute, (0-59), one or two digit_ (**۵**)
   * - `mm` _Minute, (00-59), two digit_ (**۰۵**)
   * - `s` _Second, (0-59), one or two digit_ (**۶**)
   * - `ss` _Second, (00-59), two digit_ (**۰۶**)
   * - `YYYY` _Year according to ISO 8601, at least four digit_ (**۱۳۸۰**)
   * - `YY` _Year according to ISO 8601, at least two digit_ (**۸۰**)
   * - `MMMM` _Month, localized, complete_ (**اردیبهشت**)
   * - `MM` _Month, two digit_ (**۰۲**)
   * - `M` _Month, one or two digit_ (**۲**)
   * - `d` _Day of the month, one or two digit_ (**۹**)
   * - `dd` _Day of the month, two digit_ (**۰۹**)
   * - `E` _Day of the week, localized, number, one char_ (**۱**)
   * - `EEEE` _Day of the week, localized, complete_ (**یکشنبه**)
   * - `EE` _Day of the week, localized, abbreviated, one char_ (**ی**)
   * - `e` _Day of the week, Sunday 0 to Saturday 6_ (**0**)
   * - `G` _Epoch, localized, abbreviated_ (**ه‍.ش.**)
   * - `GGGG` _Epoch, localized, complete_ (**هجری شمسی**)
   * - `zzzz` _Time zone, NOT localized, complete_ (**Asia/Tehran**)
   *
   * @param {('ar'|'az'|'bn'|'de'|'en'|'es'|'fa'|'fr'|'hi'|'id'|'it'|'ja'|'ko'|'ku'|'nl'|'pl'|'ps'|'pt'|'ru'|'sw'|'tr'|'ur'|'zh')} language Supported language
   * @param {('p'|'i'|'g')} calendar Calendar type
   * @return {{H: String, HH: String, m: String, mm: String, s: String, ss: String, YYYY: String, YY: String, MMMM: String, MM: String, M: String, d: String, dd: String, E: String, EEEE: String, EE: String, e: String, G: String, GGGG: String, zzzz: String}}
   */
  isoFormatList(language = undefined, calendar = undefined) {
    let [cal] = this.calendars;
    if (calendar !== undefined) {
      cal = calendar;
    }

    let { lang } = this;
    if (language !== undefined && calendars[language]) {
      // @ts-ignore
      lang = language;
    }

    const numberFormatter = new Intl.NumberFormat(lang, { useGrouping: false });

    const result = {
      // format as locale number
      H: this.date.getHours(),
      m: this.date.getMinutes(),
      s: this.date.getSeconds(),
      YYYY: 0,
      M: 0,
      d: 0,

      // non format locale number
      e: this.date.getDay(),
      EEEE: '',
      EE: '',
      MMMM: '',
      MM: '',
      dd: '',
      zzzz: this.constructor.getTimeZone(),
    };

    result.E = result.e + 1;
    result.EE = calendars[lang].weekNarrow[result.e];
    result.EEEE = calendars[lang].week[result.e];
    result.HH = `${numberFormatter.format(result.H)}`.padStart(2, numberFormatter.format(0));
    result.mm = `${numberFormatter.format(result.m)}`.padStart(2, numberFormatter.format(0));
    result.ss = `${numberFormatter.format(result.s)}`.padStart(2, numberFormatter.format(0));

    if (cal === CALENDAR_TYPE_PERSIAN) {
      const lst = momentJ(this.date).locale('en').format('jYYYY jM jD').split(' ').map((o) => parseInt(o, 10));
      [
        result.YYYY,
        result.M,
        result.d,
      ] = lst;
      result.dd = `${numberFormatter.format(result.d)}`.padStart(2, numberFormatter.format(0));
      result.MM = `${numberFormatter.format(result.M)}`.padStart(2, numberFormatter.format(0));
      result.MMMM = calendars[lang].p.month[result.M - 1];
      result.YY = numberFormatter.format(result.YYYY).slice(-2);
    } else if (cal === CALENDAR_TYPE_ISLAMIC) {
      const lst = momentH(this.date).locale('en').format('iYYYY iM iD').split(' ').map((o) => parseInt(o, 10));
      [
        result.YYYY,
        result.M,
        result.d,
      ] = lst;
      result.dd = `${numberFormatter.format(result.d)}`.padStart(2, numberFormatter.format(0));
      result.MM = `${numberFormatter.format(result.M)}`.padStart(2, numberFormatter.format(0));
      result.MMMM = calendars[lang].i.month[result.M - 1];
      result.YY = numberFormatter.format(result.YYYY).slice(-2);
    } else if (cal === CALENDAR_TYPE_GREGORIAN) {
      const lst = momentG(this.date).locale('en').format('YYYY M D').split(' ').map((o) => parseInt(o, 10));
      [
        result.YYYY,
        result.M,
        result.d,
      ] = lst;
      result.dd = `${numberFormatter.format(result.d)}`.padStart(2, numberFormatter.format(0));
      result.MM = `${numberFormatter.format(result.M)}`.padStart(2, numberFormatter.format(0));
      result.MMMM = calendars[lang].g.month[result.M - 1];
      result.YY = numberFormatter.format(result.YYYY).slice(-2);
    } else {

      throw new Error('Calendar not supported');
    }

    result.G = calendars[lang][cal].nameAbbr;
    result.GGGG = calendars[lang][cal].name;

    const out = {};
    Object.keys(result).forEach((fmt) => {
      const o = result[fmt];
      if (['MMMM', 'G', 'GGGG', 'EE', 'EEE', 'EEEE', 'dd', 'e', 'zzzz', 'HH', 'mm', 'ss', 'YY', 'MM'].includes(fmt)) {
        out[fmt] = o;
      } else {
        out[fmt] = numberFormatter.format(parseInt(o, 10));
      }
    });

    // @ts-ignore
    return out;
  }

  /**
   * ISO format
   *
   * Return object contains standard ISO 8601 Date
   * - `H` _Hour, (0-23), one or two digit_ (**۴**)
   * - `HH` _Hour, (00-23), two digit_ (**۰۴**)
   * - `m` _Minute, (0-59), one or two digit_ (**۵**)
   * - `mm` _Minute, (00-59), two digit_ (**۰۵**)
   * - `s` _Second, (0-59), one or two digit_ (**۶**)
   * - `ss` _Second, (00-59), two digit_ (**۰۶**)
   * - `YYYY` _Year according to ISO 8601, at least four digit_ (**۱۳۸۰**)
   * - `YY` _Year according to ISO 8601, at least two digit_ (**۸۰**)
   * - `MMMM` _Month, localized, complete_ (**اردیبهشت**)
   * - `MM` _Month, two digit_ (**۰۲**)
   * - `M` _Month, one or two digit_ (**۲**)
   * - `d` _Day of the month, one or two digit_ (**۹**)
   * - `dd` _Day of the month, two digit_ (**۰۹**)
   * - `E` _Day of the week, localized, number, one char_ (**۱**)
   * - `EEEE` _Day of the week, localized, complete_ (**یکشنبه**)
   * - `EE` _Day of the week, localized, abbreviated, one char_ (**ی**)
   * - `e` _Day of the week, Sunday 0 to Saturday 6_ (**0**)
   * - `G` _Epoch, localized, abbreviated_ (**ه‍.ش.**)
   * - `GGGG` _Epoch, localized, complete_ (**هجری شمسی**)
   * - `zzzz` _Time zone, NOT localized, complete_ (**Asia/Tehran**)
   *
   * @param {String} format ISO format
   * @param {('ar'|'az'|'bn'|'de'|'en'|'es'|'fa'|'fr'|'hi'|'id'|'it'|'ja'|'ko'|'ku'|'nl'|'pl'|'ps'|'pt'|'ru'|'sw'|'tr'|'ur'|'zh')} language Supported language
   * @param {('p'|'i'|'g')} calendar Calendar type
   * @return {String}
   */
  isoFormat(format, language = undefined, calendar = undefined) {
    const o = this.isoFormatList(language, calendar);
    const formatItems = format.split(' ').map((el) => el.trim());
    const result = [];

    formatItems.forEach((f) => {
      if (o[f]) {
        result.push(o[f]);
      }
    });

    return result.join(' ');
  }

  /**
   * Moment format
   *
   * @param {String} format
   * @param {('ar'|'az'|'bn'|'de'|'en'|'es'|'fa'|'fr'|'hi'|'id'|'it'|'ja'|'ko'|'ku'|'nl'|'pl'|'ps'|'pt'|'ru'|'sw'|'tr'|'ur'|'zh')} language Supported language
   */
  format(format, language = undefined) {
    let { lang } = this;
    if (language !== null && calendars[language]) {
      // @ts-ignore
      lang = language;
    }

    if (format.match(/jM|jD|jw|jYY|jgg/gm)) {
      return momentJ(this.date).locale(lang).format(format);
    }

    if (format.match(/iM|iD|iw|iYY|igg/gm)) {
      return momentH(this.date).locale(lang).format(format);
    }

    return momentG(this.date).locale(lang).format(format);
  }

  /**
   * Moment parse
   *
   * @param {String} str String want to parse
   * @param {String} fmt Formatted string of passed
   * @param {('p'|'i'|'g')} calendar Calendar type
   * @return {AasaamDateTime}
   */
  parse(str, fmt, calendar = undefined) {
    let [cal] = this.calendars;
    if (calendar !== undefined) {
      cal = calendar;
    }

    if (cal === CALENDAR_TYPE_PERSIAN) {
      this.date = momentJ(str, fmt).toDate();
    } else if (cal === CALENDAR_TYPE_ISLAMIC) {
      this.date = momentH(str, fmt).toDate();
    } else if (cal === CALENDAR_TYPE_GREGORIAN) {
      this.date = momentG(str, fmt).toDate();
    } else {
      throw new Error('Calendar not supported');
    }

    return this;
  }

  /**
   * @param {('p'|'i'|'g')} calendar Calendar type
   * @param {Number} offset Offset of before and after
   * @return {{name: String, localeName: String, i: Number, selectedYear: Boolean, date: Date}[]}
   */
  generateYearList(calendar = undefined, offset = 60) {
    let [cal] = this.calendars;
    if (calendar !== undefined) {
      cal = calendar;
    }

    let current;
    if (cal === CALENDAR_TYPE_PERSIAN) {
      current = momentJ(this.date).locale('en').format('jYYYY');
    } else if (cal === CALENDAR_TYPE_ISLAMIC) {
      current = momentH(this.date).locale('en').format('iYYYY');
    } else if (cal === CALENDAR_TYPE_GREGORIAN) {
      current = momentG(this.date).locale('en').format('YYYY');
    } else {
      throw new Error('Calendar not supported');
    }

    const selectedYear = parseInt(current, 10);

    const years = [];
    for (let i = selectedYear - offset; i <= selectedYear + offset; i += 1) {
      let dateObject;
      let f;
      let locale;
      let native;
      if (cal === CALENDAR_TYPE_PERSIAN) {
        dateObject = momentJ(this.date).jYear(i).toDate();
        f = parseInt(momentJ(dateObject).locale('en').format('jYYYY'), 10);
        native = new Intl.NumberFormat('fa', { useGrouping: false }).format(f);
        locale = new Intl.NumberFormat(this.lang, { useGrouping: false }).format(f);
      } else if (cal === CALENDAR_TYPE_ISLAMIC) {
        dateObject = momentH(this.date).iYear(i).toDate();
        f = parseInt(momentH(dateObject).locale('en').format('iYYYY'), 10);
        native = new Intl.NumberFormat('ar', { useGrouping: false }).format(f);
        locale = new Intl.NumberFormat(this.lang, { useGrouping: false }).format(f);
      } else {
        dateObject = momentG(this.date).year(i).toDate();
        f = parseInt(momentG(dateObject).locale('en').format('YYYY'), 10);
        native = f.toString();
        locale = new Intl.NumberFormat(this.lang, { useGrouping: false }).format(f);
      }
      years.push({
        i: f,
        native,
        locale,
        selected: i === selectedYear,
        date: dateObject,
      });
    }
    return years;
  }

  /**
   * @param {('p'|'i'|'g')} calendar Calendar type
   * @return {{name: String, localeName: String, i: Number, selected: Boolean, date: Date}[]}
   */
  generateMonthList(calendar = undefined) {
    let [cal] = this.calendars;
    if (calendar !== undefined) {
      cal = calendar;
    }

    let current;
    if (cal === CALENDAR_TYPE_PERSIAN) {
      current = momentJ(this.date).locale('en').format('jM');
    } else if (cal === CALENDAR_TYPE_ISLAMIC) {
      current = momentH(this.date).locale('en').format('iM');
    } else if (cal === CALENDAR_TYPE_GREGORIAN) {
      current = momentG(this.date).locale('en').format('M');
    } else {
      throw new Error('Calendar not supported');
    }

    const selectedMonth = parseInt(current, 10);

    const monthList = [];
    for (let i = 0; i <= 11; i += 1) {
      let dateObject;
      let native;
      let locale;
      if (cal === CALENDAR_TYPE_PERSIAN) {
        dateObject = momentJ(this.date).jMonth(i).toDate();
        locale = calendars[this.lang].p.month[i];
        native = calendars.fa.p.month[i];
      } else if (cal === CALENDAR_TYPE_ISLAMIC) {
        dateObject = momentH(this.date).iMonth(i).toDate();
        locale = calendars[this.lang].i.month[i];
        native = calendars.ar.i.month[i];
      } else {
        dateObject = momentG(this.date).month(i).toDate();
        locale = calendars[this.lang].g.month[i];
        native = calendars.en.g.month[i];
      }
      monthList.push({
        i,
        native,
        locale,
        selected: selectedMonth === i,
        date: dateObject,
      });
    }
    return monthList;
  }

  /**
   * Get alternate calendar for special date
   *
   * @private
   * @param {Date} date
   * @param {('p'|'i'|'g')} cal Calendar type
   */
  getAlternateCalendarData(date, cal) {
    const eventKeys = [];
    let monthNameNative;
    let monthName;
    let dayLocale;
    let dayNative;
    let monthNumber;
    let i;
    let calendar;
    if (cal === CALENDAR_TYPE_PERSIAN) {
      calendar = 'p';
      const yearNumber = parseInt(momentJ(date).locale('en').format('jYYYY'), 10);
      i = parseInt(momentJ(date).locale('en').format('jD'), 10);

      dayNative = new Intl.NumberFormat('fa', { useGrouping: false }).format(i);
      dayLocale = new Intl.NumberFormat(this.lang, { useGrouping: false }).format(i);

      monthNumber = parseInt(momentJ(date).locale('en').format('jM'), 10);
      monthName = calendars[this.lang].p.month[monthNumber - 1];
      monthNameNative = calendars.fa.p.month[monthNumber - 1];
      eventKeys.push({
        key: this.constructor.getEventKey(cal, monthNumber, i),
        yearNumber,
      });
    } else if (cal === CALENDAR_TYPE_ISLAMIC) {
      calendar = 'i';
      const yearNumber = parseInt(momentH(date).locale('en').format('iYYYY'), 10);
      i = parseInt(momentH(date).locale('en').format('iD'), 10);
      dayNative = new Intl.NumberFormat('ar', { useGrouping: false }).format(i);
      dayLocale = new Intl.NumberFormat(this.lang, { useGrouping: false }).format(i);

      monthNumber = parseInt(momentH(date).locale('en').format('iM'), 10);
      monthName = calendars[this.lang].i.month[monthNumber - 1];
      monthNameNative = calendars.ar.i.month[monthNumber - 1];
      eventKeys.push({
        key: this.constructor.getEventKey(cal, monthNumber, i),
        yearNumber,
      });
    } else {
      calendar = 'g';
      const yearNumber = parseInt(momentG(date).locale('en').format('YYYY'), 10);
      i = parseInt(momentG(date).locale('en').format('D'), 10);
      dayNative = i.toString();
      dayLocale = new Intl.NumberFormat(this.lang, { useGrouping: false }).format(i);
      monthNumber = parseInt(momentH(date).locale('en').format('M'), 10);
      monthName = calendars[this.lang].g.month[monthNumber - 1];
      monthNameNative = calendars.en.g.month[monthNumber - 1];
      eventKeys.push({
        key: this.constructor.getEventKey(cal, monthNumber, i),
        yearNumber,
      });
    }

    return {
      eventKeys,
      calendar,
      dayLocale,
      dayNative,
      monthName,
      monthNumber,
      monthNameNative,
    };
  }

  /**
   * List of days in month
   *
   * @param {('p'|'i'|'g')[]} calendarsList Calendar type list
   * @param {Boolean} addEvents Add
   * @return {{ date: Date, dateOnly: Date, dayNative: String, dayLocale: String, localeDate: String, eventKeys: String[], alt: { calendar: String, dayNative: String, dayLocale: String, monthName: String, monthNameNative: String }[],  weekSeq: Number, selected: Boolean}[]}
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  generateMonthWeekDays(calendarsList = [], addEvents = false) {
    let calendarList = [... this.calendars];
    if (calendarsList.length > 0) {
      calendarList = calendarsList;
    }

    const cal = calendarList.shift();

    let start;
    let daysInMonth;
    if (cal === CALENDAR_TYPE_PERSIAN) {
      start = momentJ(this.date).startOf('jMonth');
      const y = parseInt(start.locale('en').format('jYYYY'), 10);
      const m = parseInt(start.locale('en').format('jM'), 10);
      daysInMonth = momentJ.jDaysInMonth(y, m - 1);
    } else if (cal === CALENDAR_TYPE_ISLAMIC) {
      start = momentH(this.date).startOf('iMonth');
      const y = parseInt(start.locale('en').format('iYYYY'), 10);
      const m = parseInt(start.locale('en').format('iM'), 10);
      daysInMonth = momentH.iDaysInMonth(y, m - 1);
    } else if (cal === CALENDAR_TYPE_GREGORIAN) {
      start = momentG(this.date).startOf('month');
      daysInMonth = start.daysInMonth();
    } else {
      throw new Error('Calendar not supported');
    }

    const selectedDay = momentG(this.date).format('YYYYMMDD');
    const [weekStart] = this.weekDays;
    const days = [];

    let weekSeq = 0;
    for (let i = 1; i <= daysInMonth; i += 1) {
      let eventKeys = [];

      let momentObject;
      let localeDate;
      let dayNative;
      const dayLocale = new Intl.NumberFormat(this.lang, { useGrouping: false }).format(i);

      if (cal === CALENDAR_TYPE_PERSIAN) {
        momentObject = momentJ(this.date).jDate(i);
        const yearNumber = parseInt(momentObject.locale('en').format('jYYYY'), 10);
        localeDate = `${momentObject.locale('en').format('jYYYY')}-${momentObject.locale('en').format('jMM')}-${momentObject.locale('en').format('jDD')}`;
        dayNative = new Intl.NumberFormat('fa', { useGrouping: false }).format(i);
        eventKeys.push({
          key: this.constructor.getEventKey(cal, momentObject.locale('en').format('jMM'), momentObject.locale('en').format('jDD')),
          yearNumber,
        });
      } else if (cal === CALENDAR_TYPE_ISLAMIC) {
        momentObject = momentH(this.date).iDate(i);
        const yearNumber = parseInt(momentObject.locale('en').format('iYYYY'), 10);
        localeDate = `${momentObject.locale('en').format('iYYYY')}-${momentObject.locale('en').format('iMM')}-${momentObject.locale('en').format('iDD')}`;
        dayNative = new Intl.NumberFormat('ar', { useGrouping: false }).format(i);
        eventKeys.push({
          key: this.constructor.getEventKey(cal, momentObject.locale('en').format('iMM'), momentObject.locale('en').format('iDD')),
          yearNumber,
        });
      } else {
        momentObject = momentG(this.date).date(i);
        const yearNumber = parseInt(momentObject.locale('en').format('YYYY'), 10);
        localeDate = `${momentObject.locale('en').format('YYYY')}-${momentObject.locale('en').format('MM')}-${momentObject.locale('en').format('DD')}`;
        dayNative = new Intl.NumberFormat('en', { useGrouping: false }).format(i);
        eventKeys.push({
          key: this.constructor.getEventKey(cal, momentObject.locale('en').format('MM'), momentObject.locale('en').format('DD')),
          yearNumber,
        });
      }

      const dayDate = momentObject.toDate();
      const dateOnly = new Date(dayDate);
      dateOnly.setUTCHours(12, 0, 0, 0);

      const iterateDay = momentG(dayDate).format('YYYYMMDD');

      if (dayDate.getDay() === weekStart) {
        weekSeq += 1;
      }

      const alt = [];
      calendarList.forEach((altCal) => {
        const altResult = this.getAlternateCalendarData(dateOnly, altCal);
        eventKeys = eventKeys.concat(altResult.eventKeys);
        alt.push({
          calendar: altResult.calendar,
          dayNative: altResult.dayNative,
          dayLocale: altResult.dayLocale,
          monthName: altResult.monthName,
          monthNameNative: altResult.monthNameNative,
        });
      });

      const dayResult = {
        date: dayDate,
        dateOnly,
        dayNative,
        dayLocale,
        localeDate,

        holiday: false,
        alt,
        weekSeq,
        weekend: this.weekend.includes(dayDate.getDay()),
        selected: iterateDay === selectedDay,
      };

      if (addEvents) {
        const ev = [];
        eventKeys.forEach(({ key, yearNumber }) => {
          if (events[key]) {
            events[key].forEach((pEvent) => {
              const e = {};
              if (pEvent.year) {
                e.th = yearNumber - pEvent.year;
                e.thLocale = new Intl.NumberFormat(this.lang, { useGrouping: false }).format(yearNumber - pEvent.year);
              }
              if (pEvent.holiday[this.country] && dayResult.holiday === false) {
                dayResult.holiday = true;
              }
              if (pEvent.title[this.lang]) {
                e.title = pEvent.title[this.lang];
              } else {
                e.title = pEvent.title.en;
              }
              ev.push(e);
            });
          }
        });
        dayResult.events = ev;
      }

      days.push(dayResult);

    }
    return {
      calendar: cal,
      days,
    };
  }

  /**
   * @param {('p'|'i'|'g')[]} calendarsList Calendar type list
   * @param {Boolean} addEvents Add
   */
  generateMonthWeekTable(calendarsList = [], addEvents = false) {
    const wdLocale = [];
    this.weekDays.forEach((wn) => {
      wdLocale.push(({
        name: calendars[this.lang].week[wn],
        narrow: calendars[this.lang].weekNarrow[wn],
        weekend: this.weekend.includes(wn),
      }));
    });

    const { calendar, days } = this.generateMonthWeekDays(calendarsList, addEvents);

    const weeksDayList = groupBy(days, (e) => e.weekSeq);

    const r = [];
    Object.values(weeksDayList).forEach((weeks) => {
      /** @type {Array[Object]} */
      const w = [false, false, false, false, false, false, false];
      weeks.forEach((day) => {
        const i = this.weekDays.indexOf(day.date.getDay());

        const dayResult = {
          date: day.date,
          dateOnly: day.dateOnly,
          dayNative: day.dayNative,
          dayLocale: day.dayLocale,
          localeDate: day.localeDate,
          holiday: day.holiday,
          selected: day.selected,
          weekend: day.weekend,
          alt: day.alt,
        };

        if (addEvents && day.events) {
          dayResult.events = day.events;
        }

        w.splice(i, 1, dayResult);
      });
      r.push(w);
    });

    return {
      calendar,
      calendarName: calendars[this.lang][calendar].name,
      calendarNameAbbr: calendars[this.lang][calendar].nameAbbr,
      head: wdLocale,
      weeks: r,
    };
  }
}

module.exports = AasaamDateTime;

},{"./calendars":12,"./defaultCountry":26,"./events":27,"./languages":28,"./preferredCalendars":29,"./weekDays":30,"./weekends":31,"lodash.groupby":33,"moment":36,"moment-hijri":34,"moment-jalaali":35}],2:[function(require,module,exports){
module.exports = {
  week: [
    'الأحد',
    'الاثنين',
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
    'الجمعة',
    'السبت',
  ],
  weekNarrow: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
  g: {
    name: 'ميلادي',
    nameAbbr: 'م',
    month: [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ],
  },
  i: {
    name: 'هـ',
    nameAbbr: 'هـ',
    month: [
      'محرم',
      'صفر',
      'ربيع الأول',
      'ربيع الآخر',
      'جمادى الأولى',
      'جمادى الآخرة',
      'رجب',
      'شعبان',
      'رمضان',
      'شوال',
      'ذو القعدة',
      'ذو الحجة',
    ],
  },
  p: {
    name: 'ه‍.ش',
    nameAbbr: 'ه‍.ش',
    month: [
      'فرفردن',
      'أذربيهشت',
      'خرداد',
      'تار',
      'مرداد',
      'شهرفار',
      'مهر',
      'آيان',
      'آذر',
      'دي',
      'بهمن',
      'اسفندار',
    ],
  },
};

},{}],3:[function(require,module,exports){
module.exports = {
  week: [
    'bazar',
    'bazar ertəsi',
    'çərşənbə axşamı',
    'çərşənbə',
    'cümə axşamı',
    'cümə',
    'şənbə',
  ],
  weekNarrow: ['7', '1', '2', '3', '4', '5', '6'],
  g: {
    name: 'yeni era',
    nameAbbr: 'y.e.',
    month: [
      'yanvar',
      'fevral',
      'mart',
      'aprel',
      'may',
      'iyun',
      'iyul',
      'avqust',
      'sentyabr',
      'oktyabr',
      'noyabr',
      'dekabr',
    ],
  },
  i: {
    name: 'AH',
    nameAbbr: 'AH',
    month: [
      'Məhərrəm',
      'Səfər',
      'Rəbiüləvvəl',
      'Rəbiülaxır',
      'Cəmadiyələvvəl',
      'Cəmadiyəlaxır',
      'Rəcəb',
      'Şaban',
      'Ramazan',
      'Şəvval',
      'Zilqədə',
      'Zilhiccə',
    ],
  },
  p: {
    name: 'AP',
    nameAbbr: 'AP',
    month: [
      'Farvardin',
      'Ordibehesht',
      'Khordad',
      'Tir',
      'Mordad',
      'Shahrivar',
      'Mehr',
      'Aban',
      'Azar',
      'Dey',
      'Bahman',
      'Esfand',
    ],
  },
};

},{}],4:[function(require,module,exports){
module.exports = {
  week: [
    'রবিবার',
    'সোমবার',
    'মঙ্গলবার',
    'বুধবার',
    'বৃহস্পতিবার',
    'শুক্রবার',
    'শনিবার',
  ],
  weekNarrow: ['র', 'সো', 'ম', 'বু', 'বৃ', 'শু', 'শ'],
  g: {
    name: 'খ্রীষ্টাব্দ',
    nameAbbr: 'খৃষ্টাব্দ',
    month: [
      'জানুয়ারী',
      'ফেব্রুয়ারী',
      'মার্চ',
      'এপ্রিল',
      'মে',
      'জুন',
      'জুলাই',
      'আগস্ট',
      'সেপ্টেম্বর',
      'অক্টোবর',
      'নভেম্বর',
      'ডিসেম্বর',
    ],
  },
  i: {
    name: 'যুগ',
    nameAbbr: 'যুগ',
    month: [
      'মহররম',
      'সফর',
      'রবিউল আউয়াল',
      'রবিউস সানি',
      'জমাদিউল আউয়াল',
      'জমাদিউস সানি',
      'রজব',
      'শা‘বান',
      'রমজান',
      'শাওয়াল',
      'জ্বিলকদ',
      'জ্বিলহজ্জ',
    ],
  },
  p: {
    name: 'AP',
    nameAbbr: 'AP',
    month: [
      'ফ্যাভার্ডিন',
      'অরডিবেহেশ্ত',
      'খোর্দ্দ',
      'তীর',
      'মর্যাদ',
      'শাহরিবার',
      'মেহের',
      'আবান',
      'বাজার',
      'দে',
      'বাহমান',
      'এসফ্যান্ড',
    ],
  },
};

},{}],5:[function(require,module,exports){
module.exports = {
  week: [
    'Sonntag',
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag',
    'Samstag',
  ],
  weekNarrow: ['S', 'M', 'D', 'M', 'D', 'F', 'S'],
  g: {
    name: 'n. Chr.',
    nameAbbr: 'n. Chr.',
    month: [
      'Januar',
      'Februar',
      'März',
      'April',
      'Mai',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober',
      'November',
      'Dezember',
    ],
  },
  i: {
    name: 'AH',
    nameAbbr: 'AH',
    month: [
      'Muharram',
      'Safar',
      'Rabiʻ I',
      'Rabiʻ II',
      'Dschumada I',
      'Dschumada II',
      'Radschab',
      'Shaʻban',
      'Ramadan',
      'Shawwal',
      'Dhu l-qaʿda',
      'Dhu l-Hiddscha',
    ],
  },
  p: {
    name: 'AP',
    nameAbbr: 'AP',
    month: [
      'Farwardin',
      'Ordibehescht',
      'Chordād',
      'Tir',
      'Mordād',
      'Schahriwar',
      'Mehr',
      'Ābān',
      'Āsar',
      'Déi',
      'Bahman',
      'Essfand',
    ],
  },
};

},{}],6:[function(require,module,exports){
module.exports = {
  week: [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ],
  weekNarrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  g: {
    name: 'Anno Domini',
    nameAbbr: 'AD',
    month: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
  },
  i: {
    name: 'AH',
    nameAbbr: 'AH',
    month: [
      'Muharram',
      'Safar',
      'Rabiʻ I',
      'Rabiʻ II',
      'Jumada I',
      'Jumada II',
      'Rajab',
      'Shaʻban',
      'Ramadan',
      'Shawwal',
      'Dhuʻl-Qiʻdah',
      'Dhuʻl-Hijjah',
    ],
  },
  p: {
    name: 'AP',
    nameAbbr: 'AP',
    month: [
      'Farvardin',
      'Ordibehesht',
      'Khordad',
      'Tir',
      'Mordad',
      'Shahrivar',
      'Mehr',
      'Aban',
      'Azar',
      'Dey',
      'Bahman',
      'Esfand',
    ],
  },
};

},{}],7:[function(require,module,exports){
module.exports = {
  week: [
    'domingo',
    'lunes',
    'martes',
    'miércoles',
    'jueves',
    'viernes',
    'sábado',
  ],
  weekNarrow: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
  g: {
    name: 'después de Cristo',
    nameAbbr: 'd. C.',
    month: [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ],
  },
  i: {
    name: 'AH',
    nameAbbr: 'AH',
    month: [
      'muharram',
      'safar',
      'rabiʻ I',
      'rabiʻ II',
      'jumada I',
      'jumada II',
      'rajab',
      'shaʻban',
      'ramadán',
      'shawwal',
      'dhuʻl-qiʻdah',
      'dhuʻl-hijjah',
    ],
  },
  p: {
    name: 'AP',
    nameAbbr: 'AP',
    month: [
      'farvardin',
      'ordibehesht',
      'khordad',
      'tir',
      'mordad',
      'shahrivar',
      'mehr',
      'aban',
      'azar',
      'dey',
      'bahman',
      'esfand',
    ],
  },
};

},{}],8:[function(require,module,exports){
module.exports = {
  week: ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'],
  weekNarrow: ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'],
  g: {
    name: 'میلادی',
    nameAbbr: 'م.',
    month: [
      'ژانویهٔ',
      'فوریهٔ',
      'مارس',
      'آوریل',
      'مهٔ',
      'ژوئن',
      'ژوئیهٔ',
      'اوت',
      'سپتامبر',
      'اکتبر',
      'نوامبر',
      'دسامبر',
    ],
  },
  i: {
    name: 'هجری قمری',
    nameAbbr: 'ه‍.ق.',
    month: [
      'محرم',
      'صفر',
      'ربیع‌الاول',
      'ربیع‌الثانی',
      'جمادی‌الاول',
      'جمادی‌الثانی',
      'رجب',
      'شعبان',
      'رمضان',
      'شوال',
      'ذیقعدهٔ',
      'ذیحجهٔ',
    ],
  },
  p: {
    name: 'هجری شمسی',
    nameAbbr: 'ه‍.ش.',
    month: [
      'فروردین',
      'اردیبهشت',
      'خرداد',
      'تیر',
      'مرداد',
      'شهریور',
      'مهر',
      'آبان',
      'آذر',
      'دی',
      'بهمن',
      'اسفند',
    ],
  },
};

},{}],9:[function(require,module,exports){
module.exports = {
  week: [
    'dimanche',
    'lundi',
    'mardi',
    'mercredi',
    'jeudi',
    'vendredi',
    'samedi',
  ],
  weekNarrow: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  g: {
    name: 'après Jésus-Christ',
    nameAbbr: 'ap. J.-C.',
    month: [
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre',
    ],
  },
  i: {
    name: 'ère de l’Hégire',
    nameAbbr: 'AH',
    month: [
      'mouharram',
      'safar',
      'rabia al awal',
      'rabia ath-thani',
      'joumada al oula',
      'joumada ath-thania',
      'rajab',
      'chaabane',
      'ramadan',
      'chawwal',
      'dhou al qi`da',
      'dhou al-hijja',
    ],
  },
  p: {
    name: 'Anno Persico',
    nameAbbr: 'A. P.',
    month: [
      'farvardin',
      'ordibehešt',
      'khordâd',
      'tir',
      'mordâd',
      'šahrivar',
      'mehr',
      'âbân',
      'âzar',
      'dey',
      'bahman',
      'esfand',
    ],
  },
};

},{}],10:[function(require,module,exports){
module.exports = {
  week: [
    'रविवार',
    'सोमवार',
    'मंगलवार',
    'बुधवार',
    'गुरुवार',
    'शुक्रवार',
    'शनिवार',
  ],
  weekNarrow: ['र', 'सो', 'मं', 'बु', 'गु', 'शु', 'श'],
  g: {
    name: 'ईसवी सन',
    nameAbbr: 'ईस्वी',
    month: [
      'जनवरी',
      'फ़रवरी',
      'मार्च',
      'अप्रैल',
      'मई',
      'जून',
      'जुलाई',
      'अगस्त',
      'सितंबर',
      'अक्तूबर',
      'नवंबर',
      'दिसंबर',
    ],
  },
  i: {
    name: 'AH',
    nameAbbr: 'AH',
    month: [
      'मुहर्रम',
      'सफर',
      'राबी प्रथम',
      'राबी द्वितीय',
      'जुम्डा प्रथम',
      'जुम्डा द्वितीय',
      'रजब',
      'शावन',
      'रमजान',
      'शव्व्ल',
      'जिल-क्दाह',
      'जिल्-हिज्जाह',
    ],
  },
  p: {
    name: 'AP',
    nameAbbr: 'AP',
    month: [
      'फर्वादिन',
      'ओर्दिवेहेस्ट',
      'खोरर्दाद',
      'टिर',
      'मोरदाद',
      'शाहरीवर्',
      'मेहर',
      'अवन',
      'अज़र',
      'डे',
      'बहमन',
      'ईस्फन्द्',
    ],
  },
};

},{}],11:[function(require,module,exports){
module.exports = {
  week: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  weekNarrow: ['M', 'S', 'S', 'R', 'K', 'J', 'S'],
  g: {
    name: 'Masehi',
    nameAbbr: 'M',
    month: [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ],
  },
  i: {
    name: 'H',
    nameAbbr: 'H',
    month: [
      'Muharam',
      'Safar',
      'Rabiulawal',
      'Rabiulakhir',
      'Jumadilawal',
      'Jumadilakhir',
      'Rajab',
      'Syakban',
      'Ramadan',
      'Syawal',
      'Zulkaidah',
      'Zulhijah',
    ],
  },
  p: {
    name: 'AP',
    nameAbbr: 'AP',
    month: [
      'Farvardin',
      'Ordibehesht',
      'Khordad',
      'Tir',
      'Mordad',
      'Shahrivar',
      'Mehr',
      'Aban',
      'Azar',
      'Dey',
      'Bahman',
      'Esfand',
    ],
  },
};

},{}],12:[function(require,module,exports){
const ar = require('./ar');
const az = require('./az');
const bn = require('./bn');
const de = require('./de');
const en = require('./en');
const es = require('./es');
const fa = require('./fa');
const fr = require('./fr');
const hi = require('./hi');
const id = require('./id');
const it = require('./it');
const ja = require('./ja');
const ko = require('./ko');
const ku = require('./ku');
const nl = require('./nl');
const pl = require('./pl');
const ps = require('./ps');
const pt = require('./pt');
const ru = require('./ru');
const sw = require('./sw');
const tr = require('./tr');
const ur = require('./ur');
const zh = require('./zh');

module.exports = {
  ar,
  az,
  bn,
  de,
  en,
  es,
  fa,
  fr,
  hi,
  id,
  it,
  ja,
  ko,
  ku,
  nl,
  pl,
  ps,
  pt,
  ru,
  sw,
  tr,
  ur,
  zh,
};

},{"./ar":2,"./az":3,"./bn":4,"./de":5,"./en":6,"./es":7,"./fa":8,"./fr":9,"./hi":10,"./id":11,"./it":13,"./ja":14,"./ko":15,"./ku":16,"./nl":17,"./pl":18,"./ps":19,"./pt":20,"./ru":21,"./sw":22,"./tr":23,"./ur":24,"./zh":25}],13:[function(require,module,exports){
module.exports = {
  week: [
    'domenica',
    'lunedì',
    'martedì',
    'mercoledì',
    'giovedì',
    'venerdì',
    'sabato',
  ],
  weekNarrow: ['D', 'L', 'M', 'M', 'G', 'V', 'S'],
  g: {
    name: 'dopo Cristo',
    nameAbbr: 'd.C.',
    month: [
      'gennaio',
      'febbraio',
      'marzo',
      'aprile',
      'maggio',
      'giugno',
      'luglio',
      'agosto',
      'settembre',
      'ottobre',
      'novembre',
      'dicembre',
    ],
  },
  i: {
    name: 'AH',
    nameAbbr: 'AH',
    month: [
      'Muharram',
      'Safar',
      'Rabiʻ I',
      'Rabiʻ II',
      'Jumada I',
      'Jumada II',
      'Rajab',
      'Shaʻban',
      'Ramadan',
      'Shawwal',
      'Dhuʻl-Qiʻdah',
      'Dhuʻl-Hijjah',
    ],
  },
  p: {
    name: 'AP',
    nameAbbr: 'AP',
    month: [
      'Farvardin',
      'Ordibehesht',
      'Khordad',
      'Tir',
      'Mordad',
      'Shahrivar',
      'Mehr',
      'Aban',
      'Azar',
      'Dey',
      'Bahman',
      'Esfand',
    ],
  },
};

},{}],14:[function(require,module,exports){
module.exports = {
  week: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  weekNarrow: ['日', '月', '火', '水', '木', '金', '土'],
  g: {
    name: '西暦',
    nameAbbr: '西暦',
    month: [
      '1月',
      '2月',
      '3月',
      '4月',
      '5月',
      '6月',
      '7月',
      '8月',
      '9月',
      '10月',
      '11月',
      '12月',
    ],
  },
  i: {
    name: 'AH',
    nameAbbr: 'AH',
    month: [
      'ムハッラム',
      'サフアル',
      'ラビー・ウル・アウワル',
      'ラビー・ウッ・サーニー',
      'ジュマーダル・アウワル',
      'ジュマーダッサーニー',
      'ラジャブ',
      'シャアバーン',
      'ラマダーン',
      'シャウワール',
      'ズル・カイダ',
      'ズル・ヒッジャ',
    ],
  },
  p: {
    name: 'AP',
    nameAbbr: 'AP',
    month: [
      'ファルヴァルディーン',
      'オルディーベヘシュト',
      'ホルダード',
      'ティール',
      'モルダード',
      'シャハリーヴァル',
      'メフル',
      'アーバーン',
      'アーザル',
      'デイ',
      'バフマン',
      'エスファンド',
    ],
  },
};

},{}],15:[function(require,module,exports){
module.exports = {
  week: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  weekNarrow: ['일', '월', '화', '수', '목', '금', '토'],
  g: {
    name: '서기',
    nameAbbr: 'AD',
    month: [
      '1월',
      '2월',
      '3월',
      '4월',
      '5월',
      '6월',
      '7월',
      '8월',
      '9월',
      '10월',
      '11월',
      '12월',
    ],
  },
  i: {
    name: '히즈라력',
    nameAbbr: 'AH',
    month: [
      '무하람',
      '사파르',
      '라비 알 아왈',
      '라비 알 쎄니',
      '주마다 알 아왈',
      '주마다 알 쎄니',
      '라잡',
      '쉐아반',
      '라마단',
      '쉐왈',
      '듀 알 까다',
      '듀 알 히자',
    ],
  },
  p: {
    name: 'AP',
    nameAbbr: 'AP',
    month: [
      '화르바딘',
      '오르디베헤쉬트',
      '호르다드',
      '티르',
      '모르다드',
      '샤흐리바르',
      '메흐르',
      '아반',
      '아자르',
      '다이',
      '바흐만',
      '에스판드',
    ],
  },
};

},{}],16:[function(require,module,exports){
module.exports = {
  week: ['yekşem', 'duşem', 'sêşem', 'çarşem', 'pêncşem', 'în', 'şemî'],
  weekNarrow: ['Y', 'D', 'S', 'Ç', 'P', 'Î', 'Ş'],
  g: {
    name: 'piştî zayînê',
    nameAbbr: 'PZ',
    month: [
      'rêbendanê',
      'reşemiyê',
      'adarê',
      'avrêlê',
      'gulanê',
      'pûşperê',
      'tîrmehê',
      'gelawêjê',
      'rezberê',
      'kewçêrê',
      'sermawezê',
      'berfanbarê',
    ],
  },
  i: {
    name: 'AH',
    nameAbbr: 'AH',
    month: [
      'Muharram',
      'Safar',
      'Rabiʻ I',
      'Rabiʻ II',
      'Jumada I',
      'Jumada II',
      'Rajab',
      'Shaʻban',
      'Ramadan',
      'Shawwal',
      'Dhuʻl-Qiʻdah',
      'Dhuʻl-Hijjah',
    ],
  },
  p: {
    name: 'AP',
    nameAbbr: 'AP',
    month: [
      'Farvardin',
      'Ordibehesht',
      'Khordad',
      'Tir',
      'Mordad',
      'Shahrivar',
      'Mehr',
      'Aban',
      'Azar',
      'Dey',
      'Bahman',
      'Esfand',
    ],
  },
};

},{}],17:[function(require,module,exports){
module.exports = {
  week: [
    'zondag',
    'maandag',
    'dinsdag',
    'woensdag',
    'donderdag',
    'vrijdag',
    'zaterdag',
  ],
  weekNarrow: ['Z', 'M', 'D', 'W', 'D', 'V', 'Z'],
  g: {
    name: 'na Christus',
    nameAbbr: 'n.Chr.',
    month: [
      'januari',
      'februari',
      'maart',
      'april',
      'mei',
      'juni',
      'juli',
      'augustus',
      'september',
      'oktober',
      'november',
      'december',
    ],
  },
  i: {
    name: 'Saʻna Hizjria',
    nameAbbr: 'AH',
    month: [
      'Moeharram',
      'Safar',
      'Rabiʻa al awal',
      'Rabiʻa al thani',
      'Joemadʻal awal',
      'Joemadʻal thani',
      'Rajab',
      'Sjaʻaban',
      'Ramadan',
      'Sjawal',
      'Doe al kaʻaba',
      'Doe al hizja',
    ],
  },
  p: {
    name: 'AP',
    nameAbbr: 'AP',
    month: [
      'Farvardin',
      'Ordibehesht',
      'Khordad',
      'Tir',
      'Mordad',
      'Shahrivar',
      'Mehr',
      'Aban',
      'Azar',
      'Dey',
      'Bahman',
      'Esfand',
    ],
  },
};

},{}],18:[function(require,module,exports){
module.exports = {
  week: [
    'niedziela',
    'poniedziałek',
    'wtorek',
    'środa',
    'czwartek',
    'piątek',
    'sobota',
  ],
  weekNarrow: ['n', 'p', 'w', 'ś', 'c', 'p', 's'],
  g: {
    name: 'naszej ery',
    nameAbbr: 'n.e.',
    month: [
      'stycznia',
      'lutego',
      'marca',
      'kwietnia',
      'maja',
      'czerwca',
      'lipca',
      'sierpnia',
      'września',
      'października',
      'listopada',
      'grudnia',
    ],
  },
  i: {
    name: 'AH',
    nameAbbr: 'AH',
    month: [
      'Muharram',
      'Safar',
      'Rabiʻ I',
      'Rabiʻ II',
      'Dżumada I',
      'Dżumada II',
      'Radżab',
      'Szaban',
      'Ramadan',
      'Szawwal',
      'Zu al-kada',
      'Zu al-hidżdża',
    ],
  },
  p: {
    name: 'AP',
    nameAbbr: 'AP',
    month: [
      'Farwardin',
      'Ordibeheszt',
      'Chordād',
      'Tir',
      'Mordād',
      'Szahriwar',
      'Mehr',
      'Ābān',
      'Āsar',
      'Déi',
      'Bahman',
      'Esfand',
    ],
  },
};

},{}],19:[function(require,module,exports){
module.exports = {
  week: ['يونۍ', 'دونۍ', 'درېنۍ', 'څلرنۍ', 'پينځنۍ', 'جمعه', 'اونۍ'],
  weekNarrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  g: {
    name: 'له میلاد څخه وروسته',
    nameAbbr: 'م.',
    month: [
      'جنوري',
      'فبروري',
      'مارچ',
      'اپریل',
      'مۍ',
      'جون',
      'جولای',
      'اګست',
      'سېپتمبر',
      'اکتوبر',
      'نومبر',
      'دسمبر',
    ],
  },
  i: {
    name: 'AH',
    nameAbbr: 'AH',
    month: [
      'محرم',
      'صفر',
      'ربيع',
      'ربيع II',
      'جماعه',
      'جموما II',
      'رجب',
      'شعبان',
      'رمضان',
      'شوال',
      'ذي القعده',
      'ذي الحج',
    ],
  },
  p: {
    name: 'AP',
    nameAbbr: 'AP',
    month: [
      'وری',
      'غویی',
      'غبرگولی',
      'چنگاښ',
      'زمری',
      'وږی',
      'تله',
      'لړم',
      'لیندۍ',
      'مرغومی',
      'سلواغه',
      'کب',
    ],
  },
};

},{}],20:[function(require,module,exports){
module.exports = {
  week: [
    'domingo',
    'segunda-feira',
    'terça-feira',
    'quarta-feira',
    'quinta-feira',
    'sexta-feira',
    'sábado',
  ],
  weekNarrow: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  g: {
    name: 'depois de Cristo',
    nameAbbr: 'd.C.',
    month: [
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ],
  },
  i: {
    name: 'AH',
    nameAbbr: 'AH',
    month: [
      'Muharram',
      'Safar',
      'Rabiʻ I',
      'Rabiʻ II',
      'Jumada I',
      'Jumada II',
      'Rajab',
      'Shaʻban',
      'Ramadan',
      'Shawwal',
      'Dhuʻl-Qiʻdah',
      'Dhuʻl-Hijjah',
    ],
  },
  p: {
    name: 'AP',
    nameAbbr: 'AP',
    month: [
      'Farvardin',
      'Ordibehesht',
      'Khordad',
      'Tir',
      'Mordad',
      'Shahrivar',
      'Mehr',
      'Aban',
      'Azar',
      'Dey',
      'Bahman',
      'Esfand',
    ],
  },
};

},{}],21:[function(require,module,exports){
module.exports = {
  week: [
    'воскресенье',
    'понедельник',
    'вторник',
    'среда',
    'четверг',
    'пятница',
    'суббота',
  ],
  weekNarrow: ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
  g: {
    name: 'от Рождества Христова',
    nameAbbr: 'н. э.',
    month: [
      'января',
      'февраля',
      'марта',
      'апреля',
      'мая',
      'июня',
      'июля',
      'августа',
      'сентября',
      'октября',
      'ноября',
      'декабря',
    ],
  },
  i: {
    name: 'после хиджры',
    nameAbbr: 'AH',
    month: [
      'мухаррам',
      'сафар',
      'раби-уль-авваль',
      'раби-уль-ахир',
      'джумад-уль-авваль',
      'джумад-уль-ахир',
      'раджаб',
      'шаабан',
      'рамадан',
      'шавваль',
      'зуль-каада',
      'зуль-хиджжа',
    ],
  },
  p: {
    name: 'персидский год',
    nameAbbr: 'перс. год',
    month: [
      'фарвардин',
      'ордибехешт',
      'хордад',
      'тир',
      'мордад',
      'шахривер',
      'мехр',
      'абан',
      'азер',
      'дей',
      'бахман',
      'эсфанд',
    ],
  },
};

},{}],22:[function(require,module,exports){
module.exports = {
  week: [
    'Jumapili',
    'Jumatatu',
    'Jumanne',
    'Jumatano',
    'Alhamisi',
    'Ijumaa',
    'Jumamosi',
  ],
  weekNarrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  g: {
    name: 'Baada ya Kristo',
    nameAbbr: 'BK',
    month: [
      'Januari',
      'Februari',
      'Machi',
      'Aprili',
      'Mei',
      'Juni',
      'Julai',
      'Agosti',
      'Septemba',
      'Oktoba',
      'Novemba',
      'Desemba',
    ],
  },
  i: {
    name: 'AH',
    nameAbbr: 'AH',
    month: [
      'Muharram',
      'Safar',
      'Rabiʻ I',
      'Rabiʻ II',
      'Jumada I',
      'Jumada II',
      'Rajab',
      'Shaʻban',
      'Ramadan',
      'Shawwal',
      'Dhuʻl-Qiʻdah',
      'Dhuʻl-Hijjah',
    ],
  },
  p: {
    name: 'AP',
    nameAbbr: 'AP',
    month: [
      'Farvardin',
      'Ordibehesht',
      'Khordad',
      'Tir',
      'Mordad',
      'Shahrivar',
      'Mehr',
      'Aban',
      'Azar',
      'Dey',
      'Bahman',
      'Esfand',
    ],
  },
};

},{}],23:[function(require,module,exports){
module.exports = {
  week: [
    'Pazar',
    'Pazartesi',
    'Salı',
    'Çarşamba',
    'Perşembe',
    'Cuma',
    'Cumartesi',
  ],
  weekNarrow: ['P', 'P', 'S', 'Ç', 'P', 'C', 'C'],
  g: {
    name: 'Milattan Sonra',
    nameAbbr: 'MS',
    month: [
      'Ocak',
      'Şubat',
      'Mart',
      'Nisan',
      'Mayıs',
      'Haziran',
      'Temmuz',
      'Ağustos',
      'Eylül',
      'Ekim',
      'Kasım',
      'Aralık',
    ],
  },
  i: {
    name: 'Hicri',
    nameAbbr: 'Hicri',
    month: [
      'Muharrem',
      'Safer',
      'Rebiülevvel',
      'Rebiülahir',
      'Cemaziyelevvel',
      'Cemaziyelahir',
      'Recep',
      'Şaban',
      'Ramazan',
      'Şevval',
      'Zilkade',
      'Zilhicce',
    ],
  },
  p: {
    name: 'AP',
    nameAbbr: 'AP',
    month: [
      'Ferverdin',
      'Ordibeheşt',
      'Hordad',
      'Tir',
      'Mordad',
      'Şehriver',
      'Mehr',
      'Aban',
      'Azer',
      'Dey',
      'Behmen',
      'Esfend',
    ],
  },
};

},{}],24:[function(require,module,exports){
module.exports = {
  week: ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'],
  weekNarrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  g: {
    name: 'عیسوی',
    nameAbbr: 'عیسوی',
    month: [
      'جنوری',
      'فروری',
      'مارچ',
      'اپریل',
      'مئی',
      'جون',
      'جولائی',
      'اگست',
      'ستمبر',
      'اکتوبر',
      'نومبر',
      'دسمبر',
    ],
  },
  i: {
    name: 'ہجری',
    nameAbbr: 'ہجری',
    month: [
      'محرم',
      'صفر',
      'ر بیع الاول',
      'ر بیع الثانی',
      'جمادی الاول',
      'جمادی الثانی',
      'رجب',
      'شعبان',
      'رمضان',
      'شوال',
      'ذوالقعدۃ',
      'ذوالحجۃ',
    ],
  },
  p: {
    name: 'AP',
    nameAbbr: 'AP',
    month: [
      'فروردن',
      'آرڈبائش',
      'خداداد',
      'تیر',
      'مرداد',
      'شہریوار',
      'مہر',
      'ابان',
      'آزر',
      'ڈے',
      'بہمن',
      'اسفند',
    ],
  },
};

},{}],25:[function(require,module,exports){
module.exports = {
  week: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  weekNarrow: ['日', '一', '二', '三', '四', '五', '六'],
  g: {
    name: '公元',
    nameAbbr: '公元',
    month: [
      '一月',
      '二月',
      '三月',
      '四月',
      '五月',
      '六月',
      '七月',
      '八月',
      '九月',
      '十月',
      '十一月',
      '十二月',
    ],
  },
  i: {
    name: '伊斯兰历',
    nameAbbr: '伊斯兰历',
    month: [
      '一月',
      '二月',
      '三月',
      '四月',
      '五月',
      '六月',
      '七月',
      '八月',
      '九月',
      '十月',
      '十一月',
      '十二月',
    ],
  },
  p: {
    name: '波斯历',
    nameAbbr: '波斯历',
    month: [
      '一月',
      '二月',
      '三月',
      '四月',
      '五月',
      '六月',
      '七月',
      '八月',
      '九月',
      '十月',
      '十一月',
      '十二月',
    ],
  },
};

},{}],26:[function(require,module,exports){
module.exports = {
  ar: 'EG',
  az: 'AZ',
  bn: 'BD',
  de: 'DE',
  en: 'US',
  es: 'ES',
  fa: 'IR',
  fr: 'FR',
  hi: 'IN',
  id: 'ID',
  it: 'IT',
  ja: 'JP',
  ko: 'KR',
  ku: 'TR',
  nl: 'NL',
  pl: 'PL',
  ps: 'AF',
  pt: 'BR',
  ru: 'RU',
  sw: 'TZ',
  tr: 'TR',
  ur: 'PK',
  zh: 'CN',
};

},{}],27:[function(require,module,exports){
module.exports = {
  g0104: [
    {
      title: {
        en:
          'World Braille Day',

        ar:
          'يوم بريل العالمي',
        es:
          'Día Mundial del Braille',
        fa:
          'روز جهانی بریل',
        fr:
          'Journée mondiale du braille',
        id:
          'Hari Braille Sedunia',
        ja:
          '世界点字デー',
      },
      holiday: {},
      year: 2018,
    },
  ],
  g0124: [
    {
      title: {
        en:
          'International Day of Education',

        ar:
          'اليوم الدولي للتعليم',
        az:
          'Beynəlxalq Təhsil Günü',
        es:
          'Día Internacional de la Educación',
        fa:
          'روز جهانی آموزش',
        sw:
          'Siku ya Elimu Duniani',
      },
      holiday: {},
      year: 2018,
    },
  ],
  g0127: [
    {
      title: {
        en:
          'International Day of Commemoration in Memory of the Victims of the Holocaust',

        ar:
          'اليوم العالمي لذكرى الهولوكوست',
        de:
          'Internationaler Tag des Gedenkens an die Opfer des Holocaust',
        fa:
          'روز جهانی بزرگداشت به یاد قربانیان هولوکاست',
      },
      holiday: {},
      year: 2005,
    },
  ],
  g0204: [
    {
      title: {
        en:
          'World cancer day',

        ar:
          'اليوم العالمي للسرطان',
        bn:
          'বিশ্ব ক্যান্সার দিবস',
        de:
          'Weltkrebstag',
        es:
          'Día Mundial contra el Cáncer',
        fa:
          'روز جهانی سرطان',
      },
      holiday: {},
      year: 2000,
    },
  ],
  g0206: [
    {
      title: {
        en:
          'International Day of Zero Tolerance for Female Genital Mutilation',

        ar:
          'اليوم العالمي لرفض ختان الإناث',
        de:
          'Internationaler Tag gegen weibliche Genitalverstümmelung',
        es:
          'Día Internacional de Tolerancia Cero con la Mutilación Genital Femenina',
        fa:
          'روز جهانی عدم هرگونه مدارا با مثله‌کردن جنسی زنان',
        fr:
          "Journée internationale de la tolérance zéro à l'égard des mutilations génitales féminines",
        id:
          'Hari Anti-Sunat Wanita Sedunia',
        nl:
          'Zero Tolerance Dag',
      },
      holiday: {},
      year: 2003,
    },
  ],
  g0210: [
    {
      title: {
        en:
          'World Pulses Day',

        ar:
          'اليوم العالمي للبقول',
        es:
          'World Pulses Day',
        fa:
          'روز جهانی حبوبات',
      },
      holiday: {},
      year: 2018,
    },
  ],
  g0211: [
    {
      title: {
        en:
          'International Day of Women and Girls in Science',
        fa:
          'روز جهانی زنان و دختران در علم',
      },
      holiday: {},
      year: 2015,
    },
  ],
  g0213: [
    {
      title: {
        en:
          'World Radio Day',

        ar:
          'اليوم العالمي للإذاعة',
        az:
          'Beynəlxalq Radio Günü',
        de:
          'Welttag des Radios',
        es:
          'Día Mundial de la Radio',
        fa:
          'روز جهانی رادیو',
        fr:
          'Journée mondiale de la radio',
      },
      holiday: {},
      year: 2012,
    },
  ],
  g0220: [
    {
      title: {
        en:
          'World Day of Social Justice',

        ar:
          'اليوم العالمي للعدالة الاجتماعية',
        es:
          'Día Mundial de la Justicia Social',
        fa:
          'روز جهانی عدالت اجتماعی',
        it:
          'Giornata mondiale della giustizia sociale',
        pl:
          'Światowy Dzień Sprawiedliwości Społecznej',
        ru:
          'Всемирный день социальной справедливости',
      },
      holiday: {},
      year: 2007,
    },
  ],
  g0221: [
    {
      title: {
        en:
          'International Mother Language Day',

        ar:
          'اليوم العالمي للغة الأم',
        az:
          'Beynəlxalq Ana Dili Günü',
        fa:
          'روز جهانی زبان مادری',
      },
      holiday: {},
      year: 2002,
    },
  ],
  g0301: [
    {
      title: {
        en:
          'Zero Discrimination Day',

        ar:
          'يوم الانعدام التام للتمييز',
        es:
          'Día de la Cero Discriminación',
        fa:
          'روز جهانی تبعیض',
        hi:
          'शून्य भेदभाव दिवस',
        pl:
          'Zero dla Dyskryminacji',
      },
      holiday: {},
      year: 2014,
    },
  ],
  g0303: [
    {
      title: {
        en:
          'World Wildlife Day',

        ar:
          'اليوم العالمي للحياة البرية',
        bn:
          'বিশ্ব বন্যপ্রাণী দিবস',
        de:
          'Tag des Artenschutzes',
        es:
          'Día Mundial de la Vida Silvestre',
        fa:
          'روز جهانی حیات وحش',
        fr:
          'Journée mondiale de la vie sauvage',
      },
      holiday: {},
      year: 2013,
    },
  ],
  g0308: [
    {
      title: {
        en:
          "International Women's Day",

        ar:
          'اليوم العالمي للمرأة',
        az:
          'Beynəlxalq Qadınlar Günü',
        fa:
          'روز جهانی زنان',
      },
      holiday: {},
      year: 1975,
    },
  ],
  g0320: [
    {
      title: {
        en:
          'International Day of Happiness',

        ar:
          'يوم السعادة العالمي',
        bn:
          'আন্তর্জাতিক সুখ দিবস',
        de:
          'Weltglückstag',
        es:
          'Día Internacional de la Felicidad',
        fa:
          'روز جهانی خوشبختی',
      },
      holiday: {},
      year: 2013,
    },
  ],
  g0321: [
    {
      title: {
        en:
          'International Day for the Elimination of Racial Discrimination',

        ar:
          'اليوم الدولي للقضاء على التمييز العنصري',
        bn:
          'আন্তর্জাতিক সুখ দিবস',
        de:
          'Internationaler Tag gegen Rassismus',
        es:
          'Día Internacional de la Eliminación de la Discriminación Racial',
        fa:
          'روز مبارزه با تبعیض نژادی',
        fr:
          "Journée internationale pour l'élimination de la discrimination raciale",
      },
      holiday: {},
      year: 1966,
    },
    {
      title: {
        en:
          'World Poetry Day',

        ar:
          'اليوم العالمي للشعر',
        bn:
          'বিশ্ব কবিতা দিবস',
        fa:
          'روز جهانی شعر',
      },
      holiday: {},
      year: 1999,
    },
    {
      title: {
        en:
          'International Day of Happiness',

        ar:
          'اليوم العالمي لمتلازمة داون',
        de:
          'Welt-Down-Syndrom-Tag',
        es:
          'Día Mundial del Síndrome de Down',
        fa:
          'روز جهانی سندروم داون',
        fr:
          'Journée mondiale de la trisomie 21',
        id:
          'Hari Sindrom Down Sedunia',
      },
      holiday: {},
      year: 2012,
    },
    {
      title: {
        en:
          'International Day of Forests',

        ar:
          'اليوم العالمي للغابات',
        de:
          'Internationaler Tag des Waldes',
        es:
          'Día Internacional de los Bosques',
        fa:
          'روز جهانی جنگل‌ها',
        fr:
          'Journée internationale des forêts',
      },
      holiday: {},
      year: 2012,
    },
  ],
  g0322: [
    {
      title: {
        en:
          'World Water Day',

        ar:
          'اليوم العالمي للمياه',
        bn:
          'বিশ্ব জল দিবস',
        fa:
          'روز جهانی آب',
      },
      holiday: {},
      year: 1993,
    },
  ],
  g0323: [
    {
      title: {
        en:
          'World Meteorological Day',

        de:
          'Welttag der Meteorologie',
        es:
          'Día Meteorológico Mundial',
        fa:
          'روز جهانی هواشناسی',
        fr:
          'Journée météorologique mondiale',
        it:
          'Giornata mondiale della meteorologia',
        ko:
          '세계 기상의 날',
        pl:
          'Światowy Dzień Meteorologii',
      },
      holiday: {},
      year: 1950,
    },
  ],
  g0324: [
    {
      title: {
        en:
          'World Tuberculosis Day',

        ar:
          'اليوم العالمي للسل',
        de:
          'Welttuberkulosetag',
        es:
          'Día Mundial de la Tuberculosis',
        fa:
          'روز جهانی سل',
        fr:
          'Journée mondiale de lutte contre la tuberculose',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'International Day for the Right to the Truth concerning Gross Human Rights Violations and for the Dignity of Victims',

        fa:
          'روز جهانی حق برای حقیقت در مورد نقض فاحش حقوق بشر و عزت قربانیان',
      },
      holiday: {},
    },
  ],
  g0325: [
    {
      title: {
        en:
          'International Day of Remembrance of the Victims of Slavery and the Transatlantic Slave Trade',

        es:
          'Día Internacional de Rememoración de las Víctimas de la Esclavitud y la Trata Transatlántica de Esclavos',
        fa:
          'روز جهانی یادبود قربانیان برده‌داری و تجارت برده‌',
        it:
          'Giornata internazionale in ricordo delle vittime delle schiavitù e della tratta transatlantica degli schiavi',
        ko:
          '노예제 및 대서양 노예 무역 희생자 국제 추모의 날',
        ru:
          'Международный день памяти жертв рабства и трансатлантической работорговли',
        zh:
          '奴隶制和跨大西洋奴隶贸易受害者国际纪念日',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'International Day of Solidarity with Detained and Missing Staff Members',

        es:
          'Día Internacional de Solidaridad con los miembros del personal detenidos o desaparecidos',
        fa:
          'روز جهانی همبستگی با اعضای بازداشت شده و مفقود شده کارکنان',
        ko:
          '억류되고 행방불명된 활동가를 위한 국제 연대의 날',
      },
      holiday: {},
      year: 2007,
    },
  ],
  g0402: [
    {
      title: {
        en:
          'World Autism Awareness Day',

        ar:
          'اليوم العالمي للتوحد',
        bn:
          'বিশ্ব অটিজম সচেতনতা দিবস',
        de:
          'Welt-Autismus-Tag',
        es:
          'Día Mundial de Concienciación sobre el Autismo',
        fa:
          'روز آگاهی جهانی اوتیسم',
        fr:
          "Journée mondiale de la sensibilisation à l'autisme",
      },
      holiday: {},
      year: 2007,
    },
  ],
  g0406: [
    {
      title: {
        en:
          'International Day of Sport for Development and Peace',

        ar:
          'اليوم الدولي للرياضة من أجل التنمية والسلام',
        de:
          'Internationaler Tag des Sports für Entwicklung und Frieden',
        es:
          'Día Internacional del Deporte para el Desarrollo y la Paz',
        fa:
          'روز جهانی ورزش برای صلح و توسعه',
        it:
          'Giornata internazionale dello sport per lo sviluppo e la pace',
        pl:
          'Międzynarodowy Dzień Sportu dla Rozwoju i Pokoju',
        ru:
          'Международный день спорта на благо развития и мира',
      },
      holiday: {},
      year: 2014,
    },
  ],
  g0407: [
    {
      title: {
        en:
          'World Health Day',

        ar:
          'يوم الصحة العالمي',
        bn:
          'বিশ্ব স্বাস্থ্য দিবস',
        de:
          'Weltgesundheitstag',
        es:
          'Día Mundial de la Salud',
        fa:
          'روز جهانی بهداشت',
      },
      holiday: {},
      year: 1950,
    },
  ],
  g0412: [
    {
      title: {
        en:
          'International Day of Human Space Flight',

        az:
          'Beynəlxalq insanın kosmosa uçuşu günü',
        es:
          'Día Internacional de los Vuelos Espaciales Tripulados',
        fa:
          'روز جهانی پرواز فضایی انسان',
        pl:
          'Międzynarodowy Dzień Załogowych Lotów Kosmicznych',
        ru:
          'Международный день полёта человека в космос',
      },
      holiday: {},
      year: 2011,
    },
  ],
  g0421: [
    {
      title: {
        en:
          'World Creativity and Innovation Day',

        ar:
          'اليوم العالمي للإبداع والابتكار',
        es:
          'Día Mundial de la Creatividad y la Innovación',
        fa:
          'روز جهانی خلاقیت و نوآوری',
        hi:
          'विश्व रचनात्मकता एवं नवाचार दिवस',
        pt:
          'Dia Mundial da Criatividade e Inovação',
      },
      holiday: {},
      year: 2018,
    },
  ],
  g0422: [
    {
      title: {
        en:
          'International Earth Day',

        ar:
          'يوم الأرض',
        az:
          'Yer günü',
        fa:
          'روز جهانی زمین',
      },
      holiday: {},
      year: 1970,
    },
  ],
  g0423: [
    {
      title: {
        en:
          'World Book and Copyright Day',

        ar:
          'اليوم العالمي للكتاب',
        bn:
          'বিশ্ব বই দিবস',
        fa:
          'روز جهانی کتاب و حق مؤلف',
      },
      holiday: {},
      year: 1995,
    },
  ],
  g0425: [
    {
      title: {
        en:
          'World Malaria Day',

        ar:
          'اليوم العالمي للملاريا',
        bn:
          'বিশ্ব ম্যালেরিয়া দিবস',
        de:
          'Weltmalariatag',
        es:
          'Día Mundial del Paludismo',
        fa:
          'روز جهانی مالاریا',
        fr:
          'Journée mondiale du paludisme',
      },
      holiday: {},
      year: 2001,
    },
  ],
  g0428: [
    {
      title: {
        en:
          'World Day for Safety and Health at Work',

        ar:
          'يوم السلامة العالمي',
        de:
          'Workers’ Memorial Day',
        es:
          'Día Mundial de la Seguridad y Salud en el Trabajo',
        fa:
          'روز جهانی ایمنی و سلامت در محل کار',
        id:
          'Hari Peringatan Pekerja',
        ko:
          '노동자 추모일',
        pl:
          'Światowy Dzień Bezpieczeństwa i Ochrony Zdrowia w Pracy',
        ru:
          'Всемирный день охраны труда',
      },
      holiday: {},
      year: 2003,
    },
  ],
  g0430: [
    {
      title: {
        en:
          'International Jazz Day',

        ar:
          'يوم الجاز الدولي',
        de:
          'Internationaler Tag des Jazz',
        es:
          'Día Internacional del Jazz',
        fa:
          'روز جهانی موسیقی جاز',
        fr:
          'Journée internationale du jazz',
      },
      holiday: {},
      year: 2012,
    },
  ],
  g0502: [
    {
      title: {
        en:
          'World Tuna Day',

        ar:
          'تونة',
        bn:
          'টুনা (মাছ)',
        de:
          'Thunfische',
        es:
          'Thunini',
        fa:
          'روز جهانی ماهی تن',
      },
      holiday: {},
      year: 2017,
    },
  ],
  g0503: [
    {
      title: {
        en:
          'World Press Freedom Day',

        ar:
          'اليوم العالمي لحرية الصحافة',
        az:
          'Ümumdünya Mətbuat Azadlığı Günü',
        de:
          'Internationaler Tag der Pressefreiheit',
        es:
          'Día Mundial de la Libertad de Prensa',
        fa:
          'روز جهانی آزادی مطبوعات',
      },
      holiday: {},
      year: 1993,
    },
  ],
  g0508: [
    {
      title: {
        en:
          'Time of Remembrance and Reconciliation for Those Who Lost Their Lives during the Second World War',

        ar:
          'مناسبة للتذكر والمصالحة إجلالا لذكرى جميع ضحايا الحرب العالمية الثانية',
        de:
          'Tage des Gedenkens und der Versöhnung',
        es:
          'Jornadas de Recuerdo y Reconciliación en Honor de Quienes Perdieron la Vida en la Segunda Guerra Mundial',
        fa:
          'روز جهانی یادبود درگذشتگان در جنگ جهانی دوم',
        ja:
          '第二次大戦中に命を失った全ての人に追悼を捧げる日',
        ko:
          '제2차 세계 대전 희생자를 위한 추모와 화해의 기간',
        ru:
          'Дни памяти и примирения, посвящённые погибшим во Второй мировой войне',
      },
      holiday: {},
      year: 2004,
    },
  ],
  g0509: [
    {
      title: {
        en:
          'Time of Remembrance and Reconciliation for Those Who Lost Their Lives during the Second World War',

        ar:
          'مناسبة للتذكر والمصالحة إجلالا لذكرى جميع ضحايا الحرب العالمية الثانية',
        de:
          'Tage des Gedenkens und der Versöhnung',
        es:
          'Jornadas de Recuerdo y Reconciliación en Honor de Quienes Perdieron la Vida en la Segunda Guerra Mundial',
        fa:
          'روز جهانی یادبود درگذشتگان در جنگ جهانی دوم',
        ja:
          '第二次大戦中に命を失った全ての人に追悼を捧げる日',
        ko:
          '제2차 세계 대전 희생자를 위한 추모와 화해의 기간',
        ru:
          'Дни памяти и примирения, посвящённые погибшим во Второй мировой войне',
      },
      holiday: {},
      year: 2004,
    },
  ],
  g0511: [
    {
      title: {
        en:
          'World Migratory Bird Day',

        bn:
          'বিশ্ব পরিযায়ী পাখি দিবস',
        fa:
          'روز جهانی مهاجرت پرندگان',
        ru:
          'День птиц',
      },
      holiday: {},
      year: 2006,
    },
  ],
  g0515: [
    {
      title: {
        en:
          'International Day of Families',

        ar:
          'اليوم الدولي للأسر',
        az:
          'Beynəlxalq Ailə Günü',
        de:
          'Internationaler Tag der Familie',
        es:
          'Día Internacional de la Familia',
        fa:
          'روز جهانی خانواده',
      },
      holiday: {},
      year: 1993,
    },
  ],
  g0516: [
    {
      title: {
        en:
          'International Day of Light',

        fa:
          'روز جهانی نور',
      },
      holiday: {},
      year: 2017,
    },
    {
      title: {
        en:
          'International Day of Living Together in Peace',

        fa:
          'روز جهانی زندگی صلح‌آمیز در کنارهم',
      },
      holiday: {},
      year: 2018,
    },
  ],
  g0517: [
    {
      title: {
        en:
          'World Telecommunication and Information Society Day',

        fa:
          'روز جهانی ارتباطات و جامعه اطلاعاتی',
      },
      holiday: {},
      year: 1969,
    },
    {
      title: {
        en:
          'International Day of Vesak',
        fa:
          'روز جهانی وساک',
      },
      holiday: {},
      year: 2000,
    },
  ],
  g0520: [
    {
      title: {
        en:
          'World Bee Day',

        ar:
          'اليوم العالمي للنحل',
        de:
          'Weltbienentag',
        es:
          'Día Mundial de las Abejas',
        fa:
          'روز جهانی زنبور عسل',
      },
      holiday: {},
      year: 2017,
    },
  ],
  g0521: [
    {
      title: {
        en:
          'World Day for Cultural Diversity for Dialogue and Development',

        ar:
          'اليوم العالمي للتنوع الثقافي من أجل الحوار والتنمية',
        de:
          'Welttag für kulturelle Entwicklung',
        es:
          'Día Mundial de la Diversidad Cultural para el Diálogo y el Desarrollo',
        fa:
          'روز جهانی تنوع فرهنگی برای گفتگو و توسعه',
        fr:
          'Journée mondiale pour la diversité culturelle, le dialogue et le développement',
        ko:
          '대화와 발전을 위한 세계 문화 다양성의 날',
      },
      holiday: {},
      year: 2002,
    },
  ],
  g0522: [
    {
      title: {
        en:
          'International Day for Biological Diversity',

        ar:
          'اليوم العالمي للتنوع الأحيائي',
        az:
          'Bioloji müxtəliflik',
        bn:
          'জীববৈচিত্র্য',
        es:
          'Día Internacional de la Diversidad Biológica',
        fa:
          'روز جهانی تنوع زیستی',
        fr:
          'Journée internationale de la biodiversité',
        hi:
          'विश्व जैव विविधता दिवस',
      },
      holiday: {},
      year: 2000,
    },
  ],
  g0523: [
    {
      title: {
        en:
          'International Day to End Obstetric Fistula',

        ar:
          'ناسور الولادة',
        fa:
          'روز جهانی مبارزه با فیستول زایمانی',
        fr:
          'Fistule obstétricale',
        ja:
          '産科瘻孔',
        pt:
          'Fístula obstétrica',
      },
      holiday: {},
      year: 2013,
    },
  ],
  g0529: [
    {
      title: {
        en:
          'International Day of United Nations Peacekeepers',

        ar:
          'اليوم الدولي لحفظة السلام',
        bn:
          'আন্তর্জাতিক জাতিসংঘ শান্তিরক্ষী দিবস',
        es:
          'Día Internacional del Personal de Paz de las Naciones Unidas',
        fa:
          'روز جهانی حافظان صلح سازمان ملل متحد',
        fr:
          'Journée internationale des Casques bleus',
      },
      holiday: {},
      year: 2002,
    },
  ],
  g0531: [
    {
      title: {
        en:
          'World No Tobacco Day',

        ar:
          'اليوم العالمي دون تدخين',
        bn:
          'বিশ্ব তামাকমুক্ত দিবস',
        de:
          'Weltnichtrauchertag',
        es:
          'Día Mundial Sin Tabaco',
        fa:
          'روز جهانی بدون دخانیات',
      },
      holiday: {},
      year: 1987,
    },
  ],
  g0601: [
    {
      title: {
        en:
          "Parents' Day",

        ar:
          'اليوم العالمي للوالدين',
        es:
          'Día de los Padres',
        fa:
          'روز والدین',
        fr:
          'Fête des parents',
        hi:
          'माता - पिता दिवस',
        id:
          'Hari Orang Tua',
        ko:
          '어버이날',
      },
      holiday: {},
      year: 2012,
    },
  ],
  g0603: [
    {
      title: {
        en:
          'World Bicycle Day',

        ar:
          'اليوم العالمي للدراجات الهوائية',
        bn:
          'বিশ্ব সাইকেল দিবস',
        de:
          'Weltfahrradtag',
        es:
          'Día Mundial de la Bicicleta',
        fa:
          'روز جهانی دوچرخه',
        it:
          'Giornata mondiale della bicicletta',
        ja:
          '世界自転車デー',
      },
      holiday: {},
      year: 2018,
    },
  ],
  g0604: [
    {
      title: {
        en:
          'International Day of Innocent Children Victims of Aggression',

        es:
          'Día Internacional de los Niños Víctimas Inocentes de Agresión',
        fa:
          'روز جهانی کودکان بی‌گناه قربانی پرخاشگری',
        fr:
          "Journée internationale des enfants victimes innocentes de l'agression",
        ru:
          'Международный день невинных детей — жертв агрессии',
        zh:
          '受侵略戕害的无辜儿童国际日',
      },
      holiday: {},
      year: 1982,
    },
  ],
  g0605: [
    {
      title: {
        en:
          'World Environment Day',

        ar:
          'اليوم العالمي للبيئة',
        az:
          'Ümumdünya Ətraf Mühit Günü',
        bn:
          'বিশ্ব পরিবেশ দিবস',
        fa:
          'روز جهانی محیط زیست',
      },
      holiday: {},
      year: 1974,
    },
    {
      title: {
        en:
          'International Day for the Fight against Illegal, Unreported and Unregulated Fishing',

        ar:
          'صيد غير قانوني، غير مبلغ عنه، غير منظم',
        de:
          'Illegale Fischerei',
        fa:
          'روز مبارزه با ماهیگیری غیرقانونی',
        fr:
          'Pêche illégale, non déclarée et non réglementée',
        id:
          'Penangkapan ikan ilegal',
        ko:
          '불법 비보고 비규제 어업',
        nl:
          'Illegale visserij',
        ru:
          'ННН-рыболовство',
        zh:
          'IUU',
      },
      holiday: {},
      year: 2017,
    },
  ],
  g0606: [
    {
      title: {
        en:
          'Russian Language Day',

        ar:
          'اليوم العالمي للغة الروسية',
        es:
          'Día de la Lengua Rusa en las Naciones Unidas',
        fa:
          'روز زبان روسی',
        it:
          'Giornata della lingua russa nelle Nazioni Unite',
        ko:
          '유엔 러시아어의 날',
        pt:
          'Dia da Língua Russa nas Nações Unidas',
        ru:
          'День русского языка',
      },
      holiday: {},
      year: 2010,
    },
  ],
  g0607: [
    {
      title: {
        en:
          'Food Safety Day',

        ar:
          'سلامة الغذاء',
        az:
          'Qida təhlükəsizliyi',
        de:
          'Lebensmittelsicherheit',
        es:
          'Seguridad alimentaria (inocuidad)',
        fa:
          'روز ایمنی غذا',
      },
      holiday: {},
      year: 2017,
    },
  ],
  g0608: [
    {
      title: {
        en:
          'World Oceans Day',

        ar:
          'اليوم العالمي للمحيطات',
        bn:
          'বিশ্ব মহাসাগর দিবস',
        de:
          'Welttag der Ozeane',
        es:
          'Día Mundial de los Océanos',
        fa:
          'روز جهانی اقیانوس‌ها',
      },
      holiday: {},
      year: 2009,
    },
  ],
  g0612: [
    {
      title: {
        en:
          'World Day Against Child Labour',

        ar:
          'اليوم العالمي لمكافحة عمل الأطفال',
        es:
          'Día Mundial contra el Trabajo Infantil',
        fa:
          'روز جهانی مبارزه با کار کودکان',
        hi:
          'विश्व बालश्रम दिवस',
      },
      holiday: {},
      year: 2002,
    },
    {
      title: {
        en:
          'International Albinism Awareness Day',
        fa:
          'روز جهانی آگاهی از آلبینیسم',
      },
      holiday: {},
      year: 2015,
    },
  ],
  g0614: [
    {
      title: {
        en:
          'World Blood Donor Day',

        ar:
          'اليوم العالمي للمتبرعين بالدم',
        bn:
          'বিশ্ব রক্তদাতা দিবস',
        de:
          'Weltblutspendetag',
        es:
          'Día Mundial del Donante de Sangre',
        fa:
          'روز جهانی اهدای خون',
        fr:
          'Journée mondiale du donneur de sang',
      },
      holiday: {},
      year: 2004,
    },
  ],
  g0615: [
    {
      title: {
        en:
          'World Elder Abuse Awareness Day',

        ar:
          'إساءة معاملة المسنين',
        de:
          'Pflegeskandal',
        es:
          'Maltrato a personas de la tercera edad',
        fa:
          'روز جهانی آگاهی از سوءاستفاده سالمندان',
        fr:
          'Maltraitance des personnes âgées',
        it:
          'Abuso senile',
        ja:
          '高齢者虐待',
        ko:
          '노인 학대',
        nl:
          'Ouderenmishandeling',
      },
      holiday: {},
      year: 2006,
    },
  ],
  g0616: [
    {
      title: {
        en:
          'International Day of Family Remittances',

        ar:
          'حوالات',
        bn:
          'প্রবাসী-প্রেরিত অর্থ',
        de:
          'Rücküberweisung (Migranten)',
        es:
          'Remesa',
        fa:
          'روز جهانی حواله‌های خانوادگی',
        fr:
          'Envois de fonds',
        hi:
          'परदेशी वित्तप्रेषण',
        id:
          'Remitansi',
      },
      holiday: {},
      year: 2015,
    },
  ],
  g0617: [
    {
      title: {
        en:
          'World Day to Combat Desertification and Drought',

        ar:
          'اليوم العالمي لمكافحة التصحر والجفاف',
        es:
          'Día Mundial de Lucha contra la Desertificación y la Sequía',
        fa:
          'روز جهانی مبارزه با کویرزایی و خشکسالی',
        it:
          'Giornata mondiale per la lotta alla desertificazione e alla siccità',
        ja:
          '砂漠化および干ばつと闘う世界デー',
        pl:
          'Światowy Dzień Walki z Pustynnieniem i Suszą',
        pt:
          'Dia Mundial do Combate à Seca e à Desertificação',
      },
      holiday: {},
      year: 1994,
    },
  ],
  g0618: [
    {
      title: {
        en:
          'Sustainable Gastronomy Day',

        ar:
          'فن الأكل',
        de:
          'Gastronomie',
        fa:
          'روز پایداری خوراک‌شناسی',
      },
      holiday: {},
      year: 2016,
    },
  ],
  g0619: [
    {
      title: {
        en:
          'International Day for the Elimination of Sexual Violence in Conflict',

        fa:
          'روز جهانی حذف خشونت جنسی در درگیری',
      },
      holiday: {},
      year: 2015,
    },
  ],
  g0620: [
    {
      title: {
        en:
          'World Refugee Day',

        ar:
          'اليوم العالمي للاجئين',
        bn:
          'বিশ্ব শরণার্থী দিবস',
        de:
          'Weltflüchtlingstag',
        es:
          'Día Mundial de los Refugiados',
        fa:
          'روز جهانی پناهجویان',
        fr:
          'Journée mondiale des réfugiés',
      },
      holiday: {},
      year: 2000,
    },
  ],
  g0621: [
    {
      title: {
        en:
          'International Day of Yoga',

        ar:
          'اليوم العالمي لليوغا',
        bn:
          'আন্তর্জাতিক যোগ দিবস',
        de:
          'Weltyogatag',
        es:
          'Día Internacional del Yoga',
        fa:
          'روز جهانی یوگا',
      },
      holiday: {},
      year: 2014,
    },
    {
      title: {
        en:
          'International Day of the Celebration of the Solstice',

        fa:
          'روز جهانی جشن انقلابین',
      },
      holiday: {},
      year: 2019,
    },
  ],
  g0623: [
    {
      title: {
        en:
          'United Nations Public Service Day',

        bn:
          'আন্তর্জাতিক জনসেবা দিবস',
        es:
          'Día de las Naciones Unidas para la Administración Pública',
        fa:
          'روز خدمات عمومی سازمان ملل',
        pl:
          'Dzień Służby Publicznej',
        ru:
          'День государственной службы Организации Объединённых Наций',
      },
      holiday: {},
      year: 2003,
    },
    {
      title: {
        en:
          'International Widows’ Day',

        ar:
          'اليوم العالمي للأرامل',
        es:
          'Día Internacional de las Viudas',
        fa:
          'روز جهانی بیوه‌ها',
        pl:
          'Międzynarodowy Dzień Wdów',
      },
      holiday: {},
      year: 2010,
    },
  ],
  g0625: [
    {
      title: {
        en:
          'Day of the Seafarer',

        fa:
          'روز دریانورد',
      },
      holiday: {},
      year: 2010,
    },
  ],
  g0626: [
    {
      title: {
        en:
          'International Day Against Drug Abuse and Illicit Trafficking',

        fa:
          'روز جهانی مبارزه با سوءمصرف مواد مخدر و قاچاق غیرقانونی',
      },
      holiday: {},
      year: 1987,
    },
    {
      title: {
        en:
          'International Day in Support of Victims of Torture',

        ar:
          'اليوم العالمي للأمم المتحدة لمساندة ضحايا التعذيب',
        es:
          'Día Internacional en Apoyo de las Víctimas de la Tortura',
        fa:
          'روز جهانی حمایت از قربانیان شکنجه',
        fr:
          'Journée internationale pour le soutien aux victimes de la torture',
        id:
          'Hari Dukungan untuk Korban Penyiksaan Internasional',
        ko:
          '세계 고문 희생자 지원의 날',
      },
      holiday: {},
      year: 1997,
    },
  ],
  g0627: [
    {
      title: {
        en:
          'Micro-, Small and Medium-sized Enterprises Day',

        ar:
          'شركات صغيرة ومتوسطة',
        de:
          'Kleine und mittlere Unternehmen',
        es:
          'Pequeña y mediana empresa',
        fa:
          'روز بنگاه‌های کوچک و متوسط',
        fr:
          'Petite ou moyenne entreprise',
      },
      holiday: {},
      year: 2017,
    },
  ],
  g0629: [
    {
      title: {
        en:
          'International Day of the Tropics',

        fa:
          'روز جهانی استوایی',
      },
      holiday: {},
      year: 2016,
    },
    {
      title: {
        en:
          'International Asteroid Day',

        ar:
          'يوم الكويكبات',
        az:
          'Asteroid günü',
        de:
          'Asteroid Day',
        es:
          'Día Internacional de los Asteroides',
        fa:
          'روز جهانی سیارک',
      },
      holiday: {},
      year: 2016,
    },
  ],
  g0630: [
    {
      title: {
        en:
          'International Day of Parliamentarism',

        fa:
          'روز جهانی پارلمانیسم',
      },
      holiday: {},
      year: 2018,
    },
  ],
  g0711: [
    {
      title: {
        en:
          'World Population Day',

        ar:
          'اليوم العالمي للسكان',
        bn:
          'বিশ্ব জনসংখ্যা দিবস',
        es:
          'Día Mundial de la Población',
        fa:
          'روز جهانی جمعیت',
        fr:
          'Journée mondiale de la population',
        hi:
          'विश्व जनसंख्या दिवस',
      },
      holiday: {},
      year: 1987,
    },
  ],
  g0718: [
    {
      title: {
        en:
          'Nelson Mandela International Day',

        ar:
          'اليوم الدولي لنيلسون مانديلا',
        bn:
          'ম্যান্ডেলা দিবস',
        de:
          'Internationaler Nelson-Mandela-Tag',
        es:
          'Día Internacional de Nelson Mandela',
        fa:
          'روز جهانی نلسون ماندلا',
        fr:
          'Journée internationale Nelson Mandela',
        hi:
          'नेल्सन मंडेला अन्तर्राष्ट्रीय दिवस',
      },
      holiday: {},
      year: 2009,
    },
  ],
  g0728: [
    {
      title: {
        en:
          'World Hepatitis Day',

        ar:
          'اليوم العالمي لالتهاب الكبد الوبائي',
        bn:
          'বিশ্ব হেপাটাইটিস দিবস',
        de:
          'Welt-Hepatitis-Tag',
        es:
          'Día Mundial contra la Hepatitis',
        fa:
          'روز جهانی هپاتیت',
        fr:
          "Journée mondiale contre l'hépatite",
        hi:
          'विश्व हेपेटाइटिस दिवस',
      },
      holiday: {},
      year: 2012,
    },
  ],
  g0730: [
    {
      title: {
        en:
          'International Day of Friendship',

        ar:
          'اليوم الدولي للصداقة',
        bn:
          'বিশ্ব বন্ধুত্ব দিবস',
        de:
          'Internationaler Tag der Freundschaft',
        fa:
          'روز جهانی دوستی',
      },
      holiday: {},
      year: 1958,
    },
    {
      title: {
        en:
          'World Day against Trafficking in Persons',

        ar:
          'الاتجار بالبشر',
        az:
          'Traffikinq',
        bn:
          'মানব পাচার',
        de:
          'Menschenhandel',
        fa:
          'روز جهانی مبارزه با قاچاق انسان',
      },
      holiday: {},
      year: 2013,
    },
  ],
  g0809: [
    {
      title: {
        en:
          "International Day of the World's Indigenous Peoples",

        ar:
          'اليوم الدولي للشعوب الأصلية',
        bn:
          'আন্তর্জাতিক আদিবাসী দিবস',
        es:
          'Día Internacional de los Pueblos Indígenas',
        fa:
          'روز جهانی مردمان بومی جهان',
        fr:
          'Journée internationale des populations autochtones',
      },
      holiday: {},
      year: 1994,
    },
  ],
  g0812: [
    {
      title: {
        en:
          'International Youth Day',

        ar:
          'اليوم الدولي للشباب',
        az:
          'Beynəlxalq Gənclər Günü',
        es:
          'Día Internacional de la Juventud',
        fa:
          'روز جهانی جوانان',
        fr:
          'Journée internationale de la jeunesse',
        hi:
          'अन्तरराष्ट्रीय युवा दिवस',
      },
      holiday: {},
      year: 2000,
    },
  ],
  g0819: [
    {
      title: {
        en:
          'World Humanitarian Day',

        ar:
          'اليوم العالمي للعمل الإنساني',
        de:
          'Welttag der humanitären Hilfe',
        es:
          'Día Mundial de la Asistencia Humanitaria',
        fa:
          'روز جهانی بشر دوستی',
        fr:
          "Journée mondiale de l'aide humanitaire",
        it:
          "Giornata mondiale dell'aiuto umanitario",
      },
      holiday: {},
      year: 2009,
    },
  ],
  g0821: [
    {
      title: {
        en:
          'International Day of Remembrance and Tribute to the Victims of Terrorism',

        fa:
          'روز جهانی قربانیان تروریسم',
      },
      holiday: {},
      year: 2017,
    },
  ],
  g0823: [
    {
      title: {
        en:
          'International Day for the Remembrance of the Slave Trade and Its Abolition',

        es:
          'Día Internacional del Recuerdo de la Trata de Esclavos y de su Abolición',
        fa:
          'روز جهانی یادآوری تجارت برده و نابودی آن',
        it:
          'Giornata internazionale per la commemorazione della tratta degli schiavi e della sua abolizione',
        ja:
          '奴隷貿易とその廃止を記念する国際デー',
        pl:
          'Międzynarodowy Dzień Pamięci o Handlu Niewolnikami i jego Zniesieniu',
        ru:
          'Международный день памяти жертв работорговли и её ликвидации',
      },
      holiday: {},
      year: 1998,
    },
  ],
  g0829: [
    {
      title: {
        en:
          'International Day against Nuclear Tests',

        ar:
          'اليوم العالمي لمكافحة التجارب النووية',
        es:
          'Día Internacional contra los Ensayos Nucleares',
        fa:
          'روز جهانی مبارزه با آزمایش هسته ای',
        ru:
          'Международный день действий против ядерных испытаний',
        ur:
          'جوہری تجربوں کے خلاف بین الاقوامی دن',
      },
      holiday: {},
      year: 2009,
    },
  ],
  g0830: [
    {
      title: {
        en:
          'International Day of the Victims of Enforced Disappearances',

        ar:
          'اليوم الدولي للمختفين',
        de:
          'Internationaler Tag der Verschwundenen',
        es:
          'Día Internacional de las Víctimas de Desapariciones Forzadas',
        fa:
          'روز جهانی ناپدیدشدگان',
        fr:
          'Journée internationale des victimes de disparition forcée',
        it:
          'Giornata internazionale dei desaparecidos',
      },
      holiday: {},
      year: 1992,
    },
  ],
  g0905: [
    {
      title: {
        en:
          'International Day of Charity',

        ar:
          'اليوم الدولي للعمل الخيري',
        bn:
          'আন্তর্জাতিক দাতব্য দিবস',
        es:
          'Día Internacional de la Beneficencia',
        fa:
          'روز جهانی خیریه',
        id:
          'Hari Amal Internasional',
        ur:
          'عالمی یوم کار خیر',
      },
      holiday: {},
      year: 2012,
    },
  ],
  g0908: [
    {
      title: {
        en:
          'International Literacy Day',

        ar:
          'اليوم الدولي لمحو الأمية',
        bn:
          'আন্তর্জাতিক সাক্ষরতা দিবস',
        de:
          'Weltalphabetisierungstag',
        fa:
          'روز جهانی سواد آموزی',
      },
      holiday: {},
      year: 1967,
    },
  ],
  g0910: [
    {
      title: {
        en:
          'World Suicide Prevention Day',

        ar:
          'اليوم العالمي لمنع الانتحار',
        bn:
          'বিশ্ব আত্মহত্যা প্রতিরোধ দিবস',
        de:
          'Welttag der Suizidprävention',
        es:
          'Día Mundial para la Prevención del Suicidio',
        fa:
          'روز جهانی پیشگیری از خودکشی',
        fr:
          'Journée mondiale de la prévention du suicide',
      },
      holiday: {},
      year: 2003,
    },
  ],
  g0912: [
    {
      title: {
        en:
          'United Nations Day for South-South Cooperation',

        fa:
          'روز سازمان ملل متحد برای همکاری های جنوبی - جنوبی',
      },
      holiday: {},
    },
  ],
  g0915: [
    {
      title: {
        en:
          'International Day of Democracy',

        bn:
          'আন্তর্জাতিক গণতন্ত্র দিবস',
        es:
          'Día Internacional de la Democracia',
        fa:
          'روز جهانی دموکراسی',
        ja:
          '国際民主主義デー',
      },
      holiday: {},
      year: 2007,
    },
  ],
  g0916: [
    {
      title: {
        en:
          'International Day for the Preservation of the Ozone Layer',

        ar:
          'اليوم العالمي للحفاظ على طبقة الأوزون',
        az:
          'Ozon təbəqəsi',
        bn:
          'ওজোন স্তর',
        es:
          'Día Internacional de la Preservación de la Capa de Ozono',
        fa:
          'روز جهانی حفظ لایه ازن',
        fr:
          "Journée internationale pour la préservation de la couche d'ozone",
        hi:
          'विश्व ओजोन दिवस',
      },
      holiday: {},
      year: 2000,
    },
  ],
  g0921: [
    {
      title: {
        en:
          'International Day of Peace',

        ar:
          'اليوم العالمي للسلام',
        az:
          'Beynəlxalq Sülh Günü',
        bn:
          'আন্তর্জাতিক শান্তি দিবস',
        de:
          'Weltfriedenstag',
        fa:
          'روز جهانی صلح',
      },
      holiday: {},
      year: 1981,
    },
  ],
  g0923: [
    {
      title: {
        en:
          'International Day of Sign Languages',

        ar:
          'لغة إشارة',
        es:
          'Día Internacional de las Lenguas de Señas',
        fa:
          'روز جهانی زبان های اشاره',
        sw:
          'Siku ya kimataifa ya lugha ya alama',
        zh:
          '國際手語日',
      },
      holiday: {},
      year: 2018,
    },
  ],
  g0926: [
    {
      title: {
        en:
          'International Day for the Total Elimination of Nuclear Weapons',

        fa:
          'روز جهانی از بین بردن کامل سلاح های هسته ای',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'World Maritime Day',
        fa:
          'روز جهانی دریانوردی',
      },
      holiday: {},
    },
  ],
  g0927: [
    {
      title: {
        en:
          'World Tourism Day',

        ar:
          'يوم السياحة العالمي',
        az:
          'Ümumdünya Turizm Günü',
        bn:
          'বিশ্ব পর্যটন দিবস',
        de:
          'Welttourismustag',
        es:
          'Día Mundial del Turismo',
        fa:
          'روز جهانی گردشگری',
        fr:
          'Journée mondiale du tourisme',
      },
      holiday: {},
      year: 1980,
    },
  ],
  g0928: [
    {
      title: {
        en:
          'World Rabies Day',

        ar:
          'اليوم العالمي لداء الكلب',
        az:
          'Quduzluq',
        bn:
          'বিশ্ব জলাতঙ্ক দিবস',
        es:
          'Día Mundial de la Rabia',
        fa:
          'روز جهانی هاری',
        fr:
          'Journée mondiale de la rage',
        id:
          'Hari Rabies Sedunia',
        ja:
          '世界狂犬病デー',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'International Day for Universal Access to Information',

        fa:
          'روز جهانی دسترسی عمومی به اطلاعات',
      },
      holiday: {},
      year: 2015,
    },
  ],
  g0930: [
    {
      title: {
        en:
          'International Translation Day',

        ar:
          'اليوم الدولي للترجمة',
        az:
          'Beynəlxalq Tərcüməçilər günü',
        de:
          'Internationaler Übersetzertag',
        es:
          'Día Internacional de la Traducción',
        fa:
          'روز جهانی ترجمه',
      },
      holiday: {},
      year: 1953,
    },
  ],
  g1001: [
    {
      title: {
        en:
          'International Day of Older Persons',

        ar:
          'اليوم العالمي للمسنين',
        bn:
          'আন্তর্জাতিক প্রবীণ দিবস',
        de:
          'Tag der älteren Generation',
        es:
          'Día Internacional de las Personas de Edad',
        fa:
          'روز جهانی سالمندان',
        fr:
          'Journée internationale pour les personnes âgées',
      },
      holiday: {},
      year: 1990,
    },
  ],
  g1002: [
    {
      title: {
        en:
          'International Day of Non-Violence',

        ar:
          'اليوم العالمي للاعنف',
        az:
          'Beynəlxalq qeyri-zorakılıq günü',
        bn:
          'আন্তর্জাতিক অহিংসা দিবস',
        de:
          'Internationaler Tag der Gewaltlosigkeit',
        fa:
          'روز جهانی عدم خشونت',
      },
      holiday: {},
      year: 2007,
    },
  ],
  g1005: [
    {
      title: {
        en:
          'World Teachers’ Day',

        ar:
          'يوم المعلم العالمي',
        az:
          'Beynəlxalq Müəllimlər Günü',
        bn:
          'বিশ্ব শিক্ষক দিবস',
        de:
          'Weltlehrertag',
        es:
          'Día Mundial de los Docentes',
        fa:
          'روز جهانی معلمان',
        fr:
          'Journée mondiale des enseignants',
      },
      holiday: {},
      year: 1994,
    },
  ],
  g1007: [
    {
      title: {
        en:
          'World Habitat Day',

        ar:
          'اليوم العالمي للإسكان',
        es:
          'Día Mundial del Hábitat',
        fa:
          'روز جهانی اسکان بشر',
        hi:
          'विश्व पर्यावास दिवस',
        ko:
          '세계 주거의 날',
        pt:
          'Dia Mundial do Habitat',
        ru:
          'Всемирный день Хабитат',
      },
      holiday: {},
      year: 1986,
    },
  ],
  g1009: [
    {
      title: {
        en:
          'World Post Day',

        ar:
          'الاتحاد البريدي العالمي',
        az:
          'Ümumdünya poçt ittifaqı',
        bn:
          'বিশ্ব ডাক দিবস',
        es:
          'Día Mundial del Correo',
        fa:
          'روز جهانی پست',
        hi:
          'विश्व डाक दिवस',
      },
      holiday: {},
      year: 1969,
    },
  ],
  g1010: [
    {
      title: {
        en:
          'World Mental Health Day',

        ar:
          'يوم الصحة النفسية العالمي',
        bn:
          'বিশ্ব মানসিক স্বাস্থ্য দিবস',
        es:
          'Día Mundial de la Salud Mental',
        fa:
          'روز جهانی سلامت روان',
      },
      holiday: {},
      year: 1992,
    },
  ],
  g1011: [
    {
      title: {
        en:
          'International Day of the Girl Child',

        ar:
          'بنت',
        az:
          'Qız',
        bn:
          'মেয়ে',
        de:
          'Internationaler Mädchentag',
        es:
          'Día Internacional de la Niña',
        fa:
          'روز جهانی فرزند دختر',
      },
      holiday: {},
      year: 2012,
    },
  ],
  g1012: [
    {
      title: {
        en:
          'World Migratory Bird Day',

        bn:
          'বিশ্ব পরিযায়ী পাখি দিবস',
        fa:
          'روز جهانی پرنده مهاجر',
        ru:
          'День птиц',
      },
      holiday: {},
      year: 2006,
    },
  ],
  g1013: [
    {
      title: {
        en:
          'International Day for Disaster Risk Reduction',

        es:
          'Día Internacional para la Reducción del Riesgo de Desastres',
        fa:
          'روز جهانی کاهش خطر بلایای طبیعی',
        id:
          'Hari Pengurangan Bencana Alam Internasional',
        ja:
          '国際防災デー',
        pl:
          'Międzynarodowy Dzień Ograniczania Skutków Katastrof',
        ru:
          'Международный день по уменьшению опасности бедствий',
      },
      holiday: {},
      year: 2009,
    },
  ],
  g1014: [
    {
      title: {
        en:
          'World Standards Day',

        ar:
          'يوم التقييس العربي',
        bn:
          'বিশ্ব মান দিবস',
        de:
          'Weltnormentag',
        fa:
          'روز جهانی استاندارد',
        hi:
          'विश्व मानक दिवस',
        ja:
          '世界標準の日',
        nl:
          'Wereld Normalisatiedag',
      },
      holiday: {},
      year: 1946,
    },
  ],
  g1016: [
    {
      title: {
        en:
          'World Food Day',

        ar:
          'يوم الأغذية العالمي',
        de:
          'Welternährungstag',
        es:
          'Día Mundial de la Alimentación',
        fa:
          'روز جهانی غذا',
        fr:
          "Journée mondiale de l'alimentation",
      },
      holiday: {},
      year: 1945,
    },
  ],
  g1017: [
    {
      title: {
        en:
          'International Day for the Eradication of Poverty',

        de:
          'Internationaler Tag für die Beseitigung der Armut',
        es:
          'Día Internacional para la Erradicación de la Pobreza',
        fa:
          'روز جهانی مبارزه با فقر',
        fr:
          "Journée internationale pour l'élimination de la pauvreté",
      },
      holiday: {},
      year: 1992,
    },
  ],
  g1020: [
    {
      title: {
        en:
          'World Statistics Day',

        ar:
          'اليوم العالمي للإحصاء',
        de:
          'Weltstatistiktag',
        es:
          'Día Mundial de la Estadística',
        fa:
          'روز جهانی آمار',
        fr:
          'Journée mondiale de la statistique',
        ja:
          '統計の日',
      },
      holiday: {},
      year: 2010,
    },
  ],
  g1024: [
    {
      title: {
        en:
          'United Nations Day',

        ar:
          'الأمم المتحدة',
        bn:
          'জাতিসংঘ দিবস',
        de:
          'Tag der Vereinten Nationen',
        es:
          'Día de las Naciones Unidas',
        fa:
          'روز سازمان ملل',
      },
      holiday: {},
      year: 1971,
    },
    {
      title: {
        en:
          'World Development Information Day',

        bn:
          'বিশ্ব উন্নয়ন তথ্য দিবস',
        es:
          'Día Mundial de Información sobre el Desarrollo',
        fa:
          'روز جهانی توسعه اطلاعات',
        ja:
          '世界開発情報の日',
        pl:
          'Światowy Dzień Informacji na temat Rozwoju',
        ru:
          'Всемирный день информации о развитии',
      },
      holiday: {},
      year: 1972,
    },
  ],
  g1027: [
    {
      title: {
        en:
          'World Day for Audiovisual Heritage',

        de:
          'Welttag des audiovisuellen Erbes',
        es:
          'Día Mundial del Patrimonio Audiovisual',
        fa:
          'روز جهانی میراث سمعی و بصری',
        pl:
          'Światowy Dzień Dziedzictwa Audiowizualnego',
      },
      holiday: {},
      year: 2005,
    },
  ],
  g1102: [
    {
      title: {
        en:
          'International Day to End Impunity for Crimes against Journalists',

        fa:
          'روز جهانی پایان دادن به مصونیت از مجازات جنایات علیه روزنامه‌نگاران',
        pt:
          'Dia Internacional pelo Fim da Impunidade dos Crimes contra Jornalistas',
      },
      holiday: {},
      year: 2013,
    },
  ],
  g1105: [
    {
      title: {
        en:
          'World Tsunami Awareness Day',

        ar:
          'تسونامي',
        az:
          'Sunami',
        fa:
          'روز جهانی اطلاع از سونامی',
      },
      holiday: {},
      year: 2016,
    },
  ],
  g1110: [
    {
      title: {
        en:
          'World Science Day for Peace and Development',

        de:
          'Welttag der Wissenschaft',
        es:
          'Día Mundial de la Ciencia para la Paz y el Desarrollo',
        fa:
          'روز جهانی علم در خدمت صلح و توسعه',
        pl:
          'Światowy Dzień Nauki dla Pokoju i Rozwoju',
        ru:
          'Всемирный день науки за мир и развитие',
      },
      holiday: {},
      year: 2011,
    },
  ],
  g1114: [
    {
      title: {
        en:
          'World Diabetes Day',

        ar:
          'اليوم العالمي للسكري',
        az:
          'Diabetlə Beynəlxalq Mübarizə günü',
        bn:
          'বিশ্ব ডায়াবেটিস দিবস',
        de:
          'Weltdiabetestag',
        es:
          'Día Mundial de la Diabetes',
        fa:
          'روز جهانی دیابت',
      },
      holiday: {},
      year: 2006,
    },
  ],
  g1116: [
    {
      title: {
        en:
          'International Day for Tolerance',

        ar:
          'اليوم الدولي للتسامح',
        es:
          'Día Internacional para la Tolerancia',
        fa:
          'روز جهانی مدارا',
        fr:
          'Journée internationale de la tolérance',
      },
      holiday: {},
      year: 1995,
    },
  ],
  g1117: [
    {
      title: {
        en:
          'World Day of Remembrance for Road Traffic Victims',

        es:
          'Día Mundial en Recuerdo de las Víctimas de Accidentes de Tráfico',
        fa:
          'روز جهانی یادبود برای قربانیان ترافیک جاده‌ای',
        ja:
          '世界道路交通犠牲者の日',
        ko:
          '세계 도로 교통사고 희생자 추모의 날',
        ru:
          'Всемирный день памяти жертв дорожно-транспортных происшествий',
      },
      holiday: {},
      year: 2005,
    },
  ],
  g1119: [
    {
      title: {
        en:
          'World Toilet Day',

        ar:
          'اليوم العالمي للمرحاض',
        az:
          'Ümumdünya Tualet Günü',
        de:
          'Welttoilettentag',
        es:
          'Día Mundial del Retrete',
        fa:
          'روز جهانی توالت',
      },
      holiday: {},
      year: 2013,
    },
  ],
  g1120: [
    {
      title: {
        en:
          "Universal Children's Day",

        ar:
          'يوم الطفل',
        az:
          'Uşaqların Beynəlxalq Müdafiəsi Günü',
        bn:
          'শিশু দিবস',
        fa:
          'روز جهانی کودک',
      },
      holiday: {},
      year: 1920,
    },
    {
      title: {
        en:
          'Africa Industrialization Day',

        fa:
          'روز صنعت‌سازی در آفریقا',
      },
      holiday: {},
      year: 1990,
    },
  ],
  g1121: [
    {
      title: {
        en:
          'World Television Day',

        ar:
          'اليوم العالمي للتلفزيون',
        de:
          'Welttag des Fernsehens',
        es:
          'Día Mundial de la Televisión',
        fa:
          'روز جهانی تلویزیون',
        id:
          'Hari Televisi Sedunia',
        ja:
          '世界テレビ・デー',
      },
      holiday: {},
      year: 1996,
    },
  ],
  g1125: [
    {
      title: {
        en:
          'International Day for the Elimination of Violence against Women',

        ar:
          'اليوم الدولي للقضاء على العنف ضد المرأة',
        az:
          'Qadın zorakılığına qarşı beynəlxalq mübarizə günü',
        bn:
          'নারীর প্রতি সহিংসতার অবসান ঘটানোর আর্ন্তজাতিক দিবস',
        de:
          'Internationaler Tag zur Beseitigung von Gewalt gegen Frauen',
        es:
          'Día Internacional de la Eliminación de la Violencia contra la Mujer',
        fa:
          'روز بین‌المللی مبارزه با خشونت علیه زنان',
      },
      holiday: {},
      year: 1981,
    },
  ],
  g1130: [
    {
      title: {
        en:
          'Day of Remembrance for all Victims of Chemical Warfare',

        es:
          'Día de Conmemoración de Todas las Víctimas de la Guerra Química',
        fa:
          'روز یادبود برای همه قربانیان جنگ شیمیایی',
        pl:
          'Dzień Pamięci o Ofiarach Wojen Chemicznych',
      },
      holiday: {},
      year: 2005,
    },
  ],
  g1201: [
    {
      title: {
        en:
          'World AIDS Day',

        ar:
          'يوم الإيدز العالمي',
        az:
          'Ümümdünya QİÇS günü',
        bn:
          'বিশ্ব এইডস দিবস',
        fa:
          'روز جهانی ایدز',
      },
      holiday: {},
      year: 1988,
    },
  ],
  g1202: [
    {
      title: {
        en:
          'International Day for the Abolition of Slavery',

        ar:
          'اليوم الدولي لإلغاء الرق',
        es:
          'Día Internacional para la Abolición de la Esclavitud',
        fa:
          'روز جهانی لغو برده داری',
        it:
          "Giornata internazionale per l'abolizione della schiavitù",
        ja:
          '奴隷制度廃止国際デー',
        ko:
          '국제 노예제 철폐의 날',
        ru:
          'Международный день борьбы за отмену рабства',
      },
      holiday: {},
      year: 1986,
    },
  ],
  g1203: [
    {
      title: {
        en:
          'International Day of Persons with Disabilities',

        ar:
          'اليوم العالمي لذوي الاحتياجات الخاصة',
        az:
          'Beynəlxalq Əlillər Günü',
        bn:
          'বিশ্ব প্রতিবন্ধী দিবস',
        de:
          'Internationaler Tag der Menschen mit Behinderung',
        es:
          'Día Internacional de las Personas con Discapacidad',
        fa:
          'روز جهانی معلولین',
        fr:
          'Journée mondiale des personnes handicapées',
        zh:
          '國際復康日',
      },
      holiday: {},
      year: 1992,
    },
  ],
  g1205: [
    {
      title: {
        en:
          'International Volunteer Day for Economic and Social Development',

        ar:
          'يوم التطوع العالمي',
        az:
          'Beynəlxalq Könüllülər Günü',
        de:
          'Internationaler Tag des Ehrenamtes',
        es:
          'Día Internacional de los Voluntarios',
        fa:
          'روز جهانی داوطلبان برای توسعه اقتصادی و اجتماعی',
      },
      holiday: {},
      year: 1985,
    },
    {
      title: {
        en:
          'World Soil Day',
        fa:
          'روز جهانی خاک',
      },
      holiday: {},
      year: 2018,
    },
  ],
  g1207: [
    {
      title: {
        en:
          'International Civil Aviation Day',

        ar:
          'اليوم العالمي للطيران المدني',
        az:
          'Beynəlxalq Mülki Aviasiya Günü',
        es:
          'Día de la Aviación Civil Internacional',
        fa:
          'روز جهانی هواپیمایی',
        fr:
          "Journée de l'aviation civile internationale",
      },
      holiday: {},
      year: 1996,
    },
  ],
  g1209: [
    {
      title: {
        en:
          'International Anti-Corruption Day',

        ar:
          'اليوم الدولي لمكافحة الفساد',
        de:
          'Welt-Anti-Korruptions-Tag',
        es:
          'Día Internacional contra la Corrupción',
        fa:
          'روز جهانی مبارزه با فساد',
      },
      holiday: {},
      year: 2003,
    },
    {
      title: {
        en:
          'International Day of Commemoration and Dignity of the Victims of the Crime of Genocide and of the Prevention of this Crime',

        de:
          'Völkermord-Gedenktag',
        fa:
          'روز جهانی بزرگداشت قربانیان نسل کشی',
      },
      holiday: {},
      year: 2015,
    },
  ],
  g1210: [
    {
      title: {
        en:
          'Human Rights Day',

        ar:
          'يوم حقوق الإنسان',
        az:
          'İnsan hüquqları günü',
        bn:
          'মানবাধিকার দিবস',
        de:
          'Tag der Menschenrechte',
        fa:
          'روز حقوق بشر',
      },
      holiday: {},
      year: 1948,
    },
  ],
  g1211: [
    {
      title: {
        en:
          'International Mountain Day',

        az:
          'Dağlar Günü',
        es:
          'Día Internacional de las Montañas',
        fa:
          'روز کوهستان',
        ja:
          '国際山岳デー',
        ko:
          '국제 산의 날',
        pl:
          'Międzynarodowy Dzień Terenów Górskich',
      },
      holiday: {},
      year: 2014,
    },
  ],
  g1212: [
    {
      title: {
        en:
          'International Day of Neutrality',

        fa:
          'روز جهانی بی طرفی',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Universal Health Coverage Day',

        es:
          'Día Internacional de la Cobertura Sanitaria Universal',
        fa:
          'روز جهانی پوشش همگانی سلامت',
      },
      holiday: {},
      year: 2012,
    },
  ],
  g1218: [
    {
      title: {
        en:
          'International Migrants Day',

        ar:
          'اليوم الدولي للمهاجرين',
        bn:
          'আন্তর্জাতিক অভিবাসী দিবস',
        de:
          'Internationaler Tag der Migranten',
        es:
          'Día Internacional del Migrante',
        fa:
          'روز جهانی مهاجران',
        fr:
          'Journée internationale des migrants',
        ja:
          '国際移民デー',
      },
      holiday: {},
      year: 2000,
    },
    {
      title: {
        en:
          'Arabic Language Day',

        ar:
          'اليوم العالمي للغة العربية',
        bn:
          'বিশ্ব আরবি ভাষা দিবস',
        es:
          'Día Mundial de la Lengua Árabe',
        fa:
          'روز زبان عربی',
        fr:
          'Journée mondiale de la langue arabe',
        it:
          'Giornata della lingua araba nelle Nazioni Unite',
        ko:
          '유엔 아랍어의 날',
      },
      holiday: {},
      year: 2010,
    },
  ],
  g1220: [
    {
      title: {
        en:
          'International Human Solidarity Day',

        fa:
          'روز بین المللی همبستگی بشر',
      },
      holiday: {},
    },
  ],
  i0101: [
    {
      title: {
        en:
          'Islamic calendar',

        ar:
          'تقويم هجري',
        az:
          'Hicri təqvim',
        fa:
          'آغاز سال هجری قمری',
      },
      holiday: {},
    },
  ],
  i0102: [
    {
      title: {
        en:
          'Battle of Karbala',

        ar:
          'معركة كربلاء',
        az:
          'Kərbəla döyüşü',
        bn:
          'কারবালার যুদ্ধ',
        de:
          'Schlacht von Kerbela',
        fa:
          'ورود حسین بن علی (ع) به صحرای کربلا',
      },
      holiday: {},
      year: 61,
    },
  ],
  i0107: [
    {
      title: {
        en:
          'Battle of Karbala',

        ar:
          'معركة كربلاء',
        az:
          'Kərbəla döyüşü',
        bn:
          'কারবালার যুদ্ধ',
        de:
          'Schlacht von Kerbela',
        fa:
          'قطع آب بر اردوی حسین بن علی (ع)',
      },
      holiday: {},
      year: 61,
    },
  ],
  i0109: [
    {
      title: {
        en:
          "Tasu'a",

        ar:
          'تاسوعاء',
        az:
          'Tasua',
        fa:
          'تاسوعا',
        fr:
          "Tasu'a",
        ja:
          'タースーアー',
        ur:
          'تاسوعہ',
      },
      holiday: {
        IR: true,
      },
      year: 61,
    },
  ],
  i0110: [
    {
      title: {
        en:
          'Ashura',

        ar:
          'عاشوراء',
        az:
          'Aşura',
        fa:
          'عاشورا',
      },
      holiday: {
        IR: true,
      },
      year: 61,
    },
  ],
  i0112: [
    {
      title: {
        en:
          'Ali ibn Husayn Zayn al-Abidin',

        ar:
          'علي السجاد',
        az:
          'Zeynülabidin',
        bn:
          'আলি ইবনে হুসাইন জয়নুল আবেদিন',
        de:
          'ʿAlī ibn Husain Zain al-ʿĀbidīn',
        fa:
          'شهادت حضرت امام زين العابدين (ع)',
      },
      holiday: {},
      year: 95,
    },
  ],
  i0118: [
    {
      title: {
        en:
          'Masjid al-Qiblatayn',

        ar:
          'مسجد القبلتين',
        az:
          'İkiqibləli məscid',
        bn:
          'মসজিদ আল কিবলাতাইন',
        de:
          'Moschee der zwei Gebetsrichtungen',
        fa:
          'تغيير قبله مسلمين از بيت المقدس به مکه معظمه',
        fr:
          'Mosquée Al Qiblatain',
        hi:
          'मस्जिद अल-क़िबलातयैन',
        id:
          'Masjid Qiblatain',
        it:
          'Moschea al-Qiblatain',
      },
      holiday: {},
      year: 2,
    },
  ],
  i0125: [
    {
      title: {
        en:
          'Ali ibn Husayn Zayn al-Abidin',

        ar:
          'علي السجاد',
        az:
          'Zeynülabidin',
        bn:
          'আলি ইবনে হুসাইন জয়নুল আবেদিন',
        de:
          'ʿAlī ibn Husain Zain al-ʿĀbidīn',
        fa:
          'شهادت حضرت امام زين العابدين (ع) بنا بر روایتی',
      },
      holiday: {},
      year: 95,
    },
  ],
  i0201: [
    {
      title: {
        en:
          'Battle of Siffin',

        ar:
          'معركة صفين',
        az:
          'Siffeyn döyüşü',
        bn:
          'সিফফিনের যুদ্ধ',
        de:
          'Schlacht von Siffin',
        es:
          'Batalla de Siffín',
        fa:
          'جنگ صفین',
      },
      holiday: {},
      year: 37,
    },
    {
      title: {
        en:
          'Battle of Karbala',

        ar:
          'معركة كربلاء',
        az:
          'Kərbəla döyüşü',
        bn:
          'কারবালার যুদ্ধ',
        de:
          'Schlacht von Kerbela',
        fa:
          'ورود اسیران واقعه کربلا به شام',
      },
      holiday: {},
      year: 61,
    },
  ],
  i0203: [
    {
      title: {
        en:
          'Muhammad al-Baqir',

        ar:
          'محمد الباقر',
        az:
          'Məhəmməd əl-Baqir',
        de:
          'Muhammad al-Bāqir',
        fa:
          'تولد امام محمد باقر',
      },
      holiday: {},
      year: 57,
    },
  ],
  i0207: [
    {
      title: {
        en:
          'Hasan ibn Ali',

        ar:
          'الحسن بن علي',
        az:
          'Həsən ibn Əli',
        bn:
          'হাসান ইবনে আলী',
        fa:
          'وفات امام حسن مجتبی به روایتی',
      },
      holiday: {},
      year: 50,
    },
  ],
  i0208: [
    {
      title: {
        en:
          'Salman the Persian',

        ar:
          'سلمان الفارسي',
        az:
          'Salman Farsi',
        bn:
          'সালমান আল-ফারসি',
        de:
          'Salmān al-Fārisī',
        fa:
          'وفات سلمان فارسی',
      },
      holiday: {},
      year: 36,
    },
  ],
  i0209: [
    {
      title: {
        en:
          'Battle of Nahrawan',

        ar:
          'معركة النهروان',
        es:
          'Batalla de Nahrawan',
        fa:
          'جنگ نهروان',
        fr:
          'Bataille de Nahrawân',
        id:
          'Pertempuran Nahrawan',
        it:
          'Battaglia di Nahrawan',
      },
      holiday: {},
      year: 38,
    },
  ],
  i0220: [
    {
      title: {
        en:
          'Arbaʽeen',

        ar:
          'الأربعين',
        az:
          'Ərbəin günü',
        de:
          "Al-Arba'in",
        es:
          'Arbain',
        fa:
          'اربعین حسینی',
        fr:
          'Arbaïn',
      },
      holiday: {},
      year: 61,
    },
  ],
  i0228: [
    {
      title: {
        en:
          'Muhammad',

        ar:
          'محمد',
        fa:
          'وفات حضرت محمد',
      },
      holiday: {},
      year: 11,
    },
    {
      title: {
        en:
          'Hasan ibn Ali',

        ar:
          'الحسن بن علي',
        az:
          'Həsən ibn Əli',
        bn:
          'হাসান ইবনে আলী',
        fa:
          'وفات امام حسن مجتبی به روایتی',
      },
      holiday: {},
      year: 50,
    },
  ],
  i0230: [
    {
      title: {
        en:
          'Ali al-Ridha',

        ar:
          'علي الرضا',
        az:
          'Rza',
        bn:
          'আলি আল রিদা',
        de:
          'ʿAlī ibn Mūsā ar-Ridā',
        fa:
          'وفات امام علی ابن موسی الرضا',
      },
      holiday: {},
      year: 203,
    },
  ],
  i0301: [
    {
      title: {
        en:
          'Hegira',

        ar:
          'الهجرة النبوية',
        az:
          'Hicrət',
        bn:
          'হিজরত',
        fa:
          'هجرت حضرت رسول اكرم صلي الله عليه و آله از مكه به مدينه',
      },
      holiday: {},
      year: 1,
    },
  ],
  i0308: [
    {
      title: {
        en:
          'Hasan al-Askari',

        ar:
          'الحسن العسكري',
        az:
          'Həsən əl-Əskəri',
        de:
          'Hasan al-ʿAskarī',
        es:
          'Hasan al-Askari',
        fa:
          'شهادت حضرت امام حسن عسكری عليه السلام و آغاز امامت حضرت وليعصر (عج)',
      },
      holiday: {
        IR: true,
      },
      year: 260,
    },
  ],
  i0312: [
    {
      title: {
        en:
          'Muhammad',

        ar:
          'محمد',
        fa:
          'ولادت حضرت رسول اكرم صلی الله عليه و آله',
      },
      holiday: {},
    },
  ],
  i0317: [
    {
      title: {
        en:
          'Muhammad',

        ar:
          'محمد',
        fa:
          'ولادت حضرت رسول اكرم صلی الله عليه و آله',
      },
      holiday: {
        IR: true,
      },
    },
    {
      title: {
        en:
          "Ja'far al-Sadiq",

        ar:
          'جعفر الصادق',
        az:
          'Cəfər Sadiq',
        bn:
          'জাফর আল-সাদিক',
        fa:
          'ولادت حضرت امام جعفر صادق عليهالسلام',
      },
      holiday: {
        IR: true,
      },
      year: 83,
    },
  ],
  i0408: [
    {
      title: {
        en:
          'Hasan al-Askari',

        ar:
          'الحسن العسكري',
        az:
          'Həsən əl-Əskəri',
        de:
          'Hasan al-ʿAskarī',
        es:
          'Hasan al-Askari',
        fa:
          'ولادت حضرت امام حسن عسگري عليه الاسلام',
      },
      holiday: {},
      year: 232,
    },
  ],
  i0410: [
    {
      title: {
        en:
          'Fatimah bint Musa',

        ar:
          'فاطمة بنت موسى الكاظم',
        az:
          'Fatimə binti Musa əl-Kazım',
        de:
          'Fātima bint Mūsā',
        es:
          'Fátima bint Musa',
        fa:
          'وفات حضرت معصومه سلام الله عليها',
        fr:
          'Fatima al-Maasouma',
        id:
          'Fatimah binti Musa',
        it:
          'Fatima bint Musa',
        ja:
          'ファーティマ・ビン・ムーサー',
      },
      holiday: {},
      year: 201,
    },
  ],
  i0505: [
    {
      title: {
        en:
          'Zaynab bint Ali',

        ar:
          'تمريض',
        bn:
          'নার্সিং',
        de:
          'Pflege',
        fa:
          'ولادت حضرت زینب سلام‌اللّه علیها و روز پرستار',
      },
      holiday: {},
      year: 2,
    },
  ],
  i0506: [
    {
      title: {
        en:
          "Battle of Mu'tah",

        ar:
          'غزوة مؤتة',
        bn:
          'মুতার যুদ্ধ',
        es:
          "Batalla de Mu'tah",
        fa:
          'جنگ مؤته',
        fr:
          "Bataille de Mu'tah",
        id:
          "Pertempuran Mu'tah",
        it:
          "Battaglia di Mu'ta",
      },
      holiday: {},
      year: 8,
    },
    {
      title: {
        en:
          "Ja'far ibn Abi Talib",

        ar:
          'جعفر بن أبي طالب',
        az:
          'Cəfər ibn Əbu Talib',
        bn:
          'জাফর ইবনে আবি তালিব',
        de:
          'Dschaʿfar ibn Abī Tālib',
        fa:
          'شهادت جعفر‌ ابن ابی‌طالب',
        fr:
          'Jaafar ibn Abi Talib',
        id:
          "Ja'far bin Abi Thalib",
      },
      holiday: {},
      year: 8,
    },
  ],
  i0510: [
    {
      title: {
        en:
          'Battle of the Camel',

        ar:
          'موقعة الجمل',
        az:
          'Cəməl döyüşü',
        bn:
          'উটের যুদ্ধ',
        de:
          'Kamelschlacht',
        es:
          'Batalla del Camello',
        fa:
          'جنگ جمل',
      },
      holiday: {},
      year: 36,
    },
  ],
  i0513: [
    {
      title: {
        en:
          'Fatimah bint Muhammad',

        ar:
          'فاطمة الزهراء',
        az:
          'Fatimə',
        fa:
          'شهادت حضرت فاطمهٔ زهرا سلام‌اللّه علیها به روایتی',
      },
      holiday: {},
      year: 11,
    },
  ],
  i0527: [
    {
      title: {
        en:
          'Shaybah ibn Hashim',

        ar:
          'عبد المطلب بن هاشم',
        az:
          'Əbdülmütəllib ibn Haşim',
        bn:
          'আবদুল মুত্তালিব',
        de:
          'ʿAbd al-Muttalib ibn Hāschim',
        fa:
          'وفات عبدالمطلب',
      },
      holiday: {},
    },
  ],
  i0530: [
    {
      title: {
        en:
          'Abu Jafar Muhammad ibn Uthman',

        ar:
          'محمد بن عثمان العمري',
        fa:
          'وفات محمد بن عثمان دومین نائب خاص حضرت مهدی علیه‌السلام',
        fr:
          'Abu Jafar Mohammad Bin Uthman',
        ur:
          'محمد بن عثمان عمری',
      },
      holiday: {},
    },
  ],
  i0603: [
    {
      title: {
        en:
          'Fatimah bint Muhammad',

        ar:
          'فاطمة الزهراء',
        az:
          'Fatimə',
        fa:
          'شهادت حضرت فاطمه زهرا(س)',
      },
      holiday: {
        IR: true,
      },
      year: 11,
    },
  ],
  i0605: [
    {
      title: {
        en:
          'Rumi',

        ar:
          'جلال الدين الرومي',
        az:
          'Mövlana Cəlaləddin Rumi',
        fa:
          'درگذشت مولانا',
      },
      holiday: {},
      year: 672,
    },
  ],
  i0613: [
    {
      title: {
        en:
          'Umm al-Banin',

        ar:
          'أم البنين',
        az:
          'Ümmül-Banu',
        fa:
          'درگذشت ام‌البنین',
        id:
          'Fatimah binti Hizam',
        ur:
          'ام البنین',
      },
      holiday: {},
      year: 70,
    },
  ],
  i0620: [
    {
      title: {
        en:
          'Fatimah bint Muhammad',

        ar:
          'فاطمة الزهراء',
        az:
          'Fatimə',
        fa:
          'ولادت حضرت فاطمه زهرا(س) و روز مادر',
      },
      holiday: {},
      year: -18,
    },
  ],
  i0701: [
    {
      title: {
        en:
          'Muhammad al-Baqir',

        ar:
          'محمد الباقر',
        az:
          'Məhəmməd əl-Baqir',
        de:
          'Muhammad al-Bāqir',
        fa:
          'ولادت امام محمد باقر، پنجمین امام شیعه دوازده‌امامی',
      },
      holiday: {},
      year: 57,
    },
  ],
  i0703: [
    {
      title: {
        en:
          'Ali al-Hadi',

        ar:
          'علي الهادي',
        az:
          'Əli ən-Nəqi',
        de:
          'ʿAlī al-Hādī an-Naqī',
        es:
          'Ali al-Hadi',
        fa:
          'درگذشت علی النقی',
      },
      holiday: {},
      year: 254,
    },
  ],
  i0710: [
    {
      title: {
        en:
          'Muhammad al-Jawad',

        ar:
          'محمد الجواد',
        az:
          'Məhəmməd Təqi',
        bn:
          'মুহাম্মদ আল-তকি',
        de:
          'Muhammad al-Dschawād',
        fa:
          'ولادت محمد تقی',
      },
      holiday: {},
      year: 195,
    },
  ],
  i0713: [
    {
      title: {
        en:
          'Ali ibn Abi Talib',

        ar:
          'علي بن أبي طالب',
        az:
          'Əli',
        fa:
          'ولادت علی بن ابی‌طالب',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Ayyam al-Bid',

        fa:
          'آغاز ایام البیض',
        ur:
          'ایام بیض',
      },
      holiday: {},
    },
  ],
  i0715: [
    {
      title: {
        en:
          'Qibla',

        ar:
          'قبلة',
        az:
          'Qiblə',
        bn:
          'ক্বিবলা',
        fa:
          'تغییر قبله مسلمین',
      },
      holiday: {},
      year: 2,
    },
    {
      title: {
        en:
          'Zaynab bint Ali',

        ar:
          'زينب بنت علي بن أبي طالب',
        az:
          'Zeynəb',
        bn:
          'যায়নাব বিনতে আলী',
        de:
          'Zainab bint Ali',
        es:
          'Záynab bint Ali',
        fa:
          'درگذشت زینب الکبری بنت علی',
      },
      holiday: {},
      year: 62,
    },
  ],
  i0722: [
    {
      title: {
        en:
          'Muawiyah I',

        ar:
          'معاوية بن أبي سفيان',
        az:
          'I Muaviyə',
        bn:
          'প্রথম মুয়াবিয়া',
        fa:
          'درگذشت معاویة بن ابی‌سفیان',
      },
      holiday: {},
      year: 60,
    },
  ],
  i0725: [
    {
      title: {
        en:
          'Musa al-Kadhim',

        ar:
          'موسى الكاظم',
        az:
          'Musa əl-Kazım',
        bn:
          'মুসা আল কাজিম',
        de:
          'Mūsā al-Kāzim',
        fa:
          'درگذشت موسی کاظم',
      },
      holiday: {},
      year: 183,
    },
  ],
  i0727: [
    {
      title: {
        en:
          "Muhammad's first revelation",

        ar:
          'نزول الوحي',
        es:
          'Mabaas',
        fa:
          'عید مبعث',
        id:
          'Nuzululquran',
      },
      holiday: {},
    },
  ],
  i0801: [
    {
      title: {
        en:
          'Abd al-Husayn Najafi Lari',

        fa:
          'صدور حکم جهاد توسط عبدالحسین لاری علیه انگلیس',
      },
      holiday: {},
      year: 1336,
    },
  ],
  i0803: [
    {
      title: {
        en:
          'Islamic Revolutionary Guard Corps',

        ar:
          'الحرس الثوري الإيراني',
        az:
          'İslam İnqilabı Keşikçiləri Korpusu',
        fa:
          'روز پاسدار',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Husayn ibn Ali',

        ar:
          'الحسين بن علي',
        az:
          'Hüseyn ibn Əli',
        bn:
          'হোসাইন ইবনে আলী',
        fa:
          'ولادت امام حسین، سومین امام شیعه دوازده امامی',
      },
      holiday: {},
      year: 4,
    },
  ],
  i0804: [
    {
      title: {
        en:
          'Abbas ibn Ali',

        ar:
          'العباس بن علي',
        az:
          'Abbas ibn Əli',
        de:
          'Al-ʿAbbās ibn ʿAlī',
        es:
          'Abbás ibn Ali',
        fa:
          'ولادت عباس بن علی',
        fr:
          'Abbas ibn Ali',
      },
      holiday: {},
      year: 26,
    },
  ],
  i0805: [
    {
      title: {
        en:
          'Disabled Iranian veterans',
        fa:
          'روز جانباز',
      },
      holiday: {},
    },
    {
      title: {
        en: 'Ali ibn Husayn Zayn al-Abidin',

        ar:
          'علي السجاد',
        az:
          'Zeynülabidin',
        bn:
          'আলি ইবনে হুসাইন জয়নুল আবেদিন',
        de:
          'ʿAlī ibn Husain Zain al-ʿĀbidīn',
        fa:
          'ولادت علی ابن الحسین',
      },
      holiday: {},
      year: 38,
    },
  ],
  i0811: [
    {
      title: {
        en:
          'Youth Day',

        fa:
          'روز جوان',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Ali al-Akbar ibn Husayn',

        ar:
          'علي الأكبر',
        az:
          'Əli əl-Əkbər',
        de:
          'Ali Akbar ibn Hussain',
        fa:
          'ولادت علی(علی اکبر) ابن الحسین',
        fr:
          'Ali al-Akbar ibn Husayn',
        id:
          'Ali al-Akbar',
        tr:
          'Ali el-Ekber',
        ur:
          'علی اکبر',
      },
      holiday: {},
      year: 33,
    },
  ],
  i0815: [
    {
      title: {
        en:
          'Hujjat-Allah al-Mahdi',

        ar:
          'محمد بن الحسن المهدي',
        az:
          'Məhəmməd Mehdi',
        bn:
          'মুহাম্মাদ আল-মাহদী',
        de:
          'Muhammad al-Mahdī',
        fa:
          'ولادت محمد بن حسن',
      },
      holiday: {},
      year: 255,
    },
  ],
  i0825: [
    {
      title: {
        en:
          'Abbasid Revolution',

        es:
          'Revolución abasí',
        fa:
          'قیام سیاه جامگان',
        id:
          'Revolusi Abbasiyah',
        it:
          'Rivoluzione abbaside',
        ja:
          'アッバース革命',
      },
      holiday: {},
      year: 137,
    },
  ],
  i0910: [
    {
      title: {
        en:
          'Khadija bint Khuwaylid',

        ar:
          'خديجة بنت خويلد',
        az:
          'Xədicə',
        bn:
          'খাদিজা বিনতে খুওয়াইলিদ',
        fa:
          'درگذشت خدیجه، همسر پیامبر اسلام',
      },
      holiday: {},
    },
  ],
  i0915: [
    {
      title: {
        en:
          'Hasan ibn Ali',
        ar:
          'الحسن بن علي',
        az:
          'Həsən ibn Əli',
        bn:
          'হাসান ইবনে আলী',
        fa:
          'ولادت امام حسن مجتبی علیه‌السلام',
      },
      holiday: {},
      year: 3,
    },
  ],
  i0917: [
    {
      title: {
        en:
          'Muhammad',

        ar:
          'محمد',
        fa:
          'معراج پیامبر اسلام',
      },
      holiday: {},
    },
  ],
  i0919: [
    {
      title: {
        en:
          'Laylat al-Qadr',

        ar:
          'ليلة القدر',
        az:
          'Qədr gecəsi',
        bn:
          'শবে কদর',
        fa:
          'از شب‌های قدر',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Ali',

        ar:
          'علي بن أبي طالب',
        az:
          'Əli',
        fa:
          'سالروز ضربت خوردن حضرت علی علیه‌السلام',
      },
      holiday: {},
      year: 40,
    },
  ],
  i0921: [
    {
      title: {
        en:
          'Laylat al-Qadr',

        ar:
          'ليلة القدر',
        az:
          'Qədr gecəsi',
        bn:
          'শবে কদর',
        fa:
          'از شب‌های قدر',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Ali',

        ar:
          'علي بن أبي طالب',
        az:
          'Əli',
        fa:
          'شهادت امام علی علیه‌السلام',
      },
      holiday: {
        IR: true,
      },
      year: 40,
    },
  ],
  i0923: [
    {
      title: {
        en:
          'Laylat al-Qadr',

        ar:
          'ليلة القدر',
        az:
          'Qədr gecəsi',
        bn:
          'শবে কদর',
        fa:
          'از شب‌های قدر',
      },
      holiday: {},
    },
  ],
  i0925: [
    {
      title: {
        en:
          'Laylat al-Qadr',

        ar:
          'ليلة القدر',
        az:
          'Qədr gecəsi',
        bn:
          'শবে কদর',
        fa:
          'از شب‌های قدر',
      },
      holiday: {},
    },
  ],
  i0927: [
    {
      title: {
        en:
          'Laylat al-Qadr',

        ar:
          'ليلة القدر',
        az:
          'Qədr gecəsi',
        bn:
          'শবে কদর',
        fa:
          'از شب‌های قدر',
      },
      holiday: {},
    },
  ],
  i1001: [
    {
      title: {
        en:
          'Eid al-Fitr',

        ar:
          'عيد الفطر',
        az:
          'Ramazan bayramı',
        fa:
          'عید فطر',
      },
      holiday: {
        IR: true,
      },
    },
  ],
  i1002: [
    {
      title: {
        en:
          'Aisha bint Abi Bakr',

        ar:
          'عائشة بنت أبي بكر',
        az:
          'Aişə binti Əbu Bəkr',
        bn:
          'আয়িশা',
        fa:
          'ازدواج پیامبر اسلام(ص) با عایشه',
      },
      holiday: {},
    },
  ],
  i1006: [
    {
      title: {
        en:
          'Al-Husayn b. Ruh al-Nawbakhti',

        fa:
          'توقیع امام زمان(عج) برای حسین بن روح',
      },
      holiday: {},
      year: 305,
    },
  ],
  i1008: [
    {
      title: {
        en:
          'Demolition of al-Baqi',

        ar:
          'هدم قباب البقيع',
        fa:
          'تخریب قبور ائمه بقیع(ع) به دست وهابی‌ها(یوم‌الهدم)',
        fr:
          'Destruction de cimetière al-Baqî’',
        id:
          'Penghancuran al-Baqi',
        ur:
          'انہدام قبرستان بقیع',
      },
      holiday: {},
      year: 1344,
    },
  ],
  i1015: [
    {
      title: {
        en:
          'Abd al-Azim al-Hasani',

        ar:
          'الشاه عبد العظيم الحسني',
        fa:
          'درگذشت حضرت عبدالعظیم حسنی(ع)',
        ur:
          'عبد العظیم حسنی',
      },
      holiday: {},
      year: 252,
    },
  ],
  i1020: [
    {
      title: {
        en:
          'Musa al-Kadhim',

        ar:
          'موسى الكاظم',
        az:
          'Musa əl-Kazım',
        bn:
          'মুসা আল কাজিম',
        de:
          'Mūsā al-Kāzim',
        fa:
          'دستگیری امام کاظم(ع) توسط هارون عباسی',
      },
      holiday: {},
      year: 179,
    },
  ],
  i1025: [
    {
      title: {
        en:
          "Ja'far al-Sadiq",

        ar:
          'جعفر الصادق',
        az:
          'Cəfər Sadiq',
        bn:
          'জাফর আল-সাদিক',
        fa:
          'شهادت امام صادق (ع)',
      },
      holiday: {
        IR: true,
      },
      year: 148,
    },
  ],
  i1101: [
    {
      title: {
        en:
          'Fatimah bint Musa',

        ar:
          'فاطمة بنت موسى الكاظم',
        az:
          'Fatimə binti Musa əl-Kazım',
        de:
          'Fātima bint Mūsā',
        es:
          'Fátima bint Musa',
        fa:
          'ولادت فاطمه معصومه و روز دختران',
        fr:
          'Fatima al-Maasouma',
        id:
          'Fatimah binti Musa',
        it:
          'Fatima bint Musa',
        ja:
          'ファーティマ・ビン・ムーサー',
      },
      holiday: {},
      year: 173,
    },
  ],
  i1105: [
    {
      title: {
        en:
          'Imamzadeh',

        fa:
          'روز تجلیل از امام‌زادگان و بقاع متبرکه',
      },
      holiday: {},
    },
  ],
  i1106: [
    {
      title: {
        en:
          'Shah Cheragh',

        ar:
          'شاه جراغ',
        de:
          'Schah Tscheragh',
        fa:
          'بزرگداشت احمد بن موسی شاهچراغ',
        fr:
          'Chah-Tcheragh',
        it:
          'Shah Ceragh',
        ja:
          'シャー・チェラーグ廟',
        nl:
          'Sjah Tsjeragh',
      },
      holiday: {},
    },
  ],
  i1111: [
    {
      title: {
        en:
          'Ali al-Ridha',

        ar:
          'علي الرضا',
        az:
          'Rza',
        bn:
          'আলি আল রিদা',
        de:
          'ʿAlī ibn Mūsā ar-Ridā',
        fa:
          'ولادت علی ابن موسی الرضا',
      },
      holiday: {
        IR: true,
      },
      year: 148,
    },
  ],
  i1130: [
    {
      title: {
        en:
          'Muhammad al-Jawad',

        ar:
          'محمد الجواد',
        az:
          'Məhəmməd Təqi',
        bn:
          'মুহাম্মদ আল-তকি',
        de:
          'Muhammad al-Dschawād',
        fa:
          'شهادت محمد ابن علی ابن موسی (محمد تقی)',
      },
      holiday: {},
      year: 220,
    },
  ],
  i1201: [
    {
      title: {
        en:
          'Marital life of Fatimah and Ali',

        fa:
          'ازدواج علی ابن ابی‌طالب و فاطمه بنت محمد',
      },
      holiday: {},
      year: 2,
    },
  ],
  i1207: [
    {
      title: {
        en:
          'Muhammad al-Baqir',

        fa:
          'شهادت امام محمد باقر',
      },
      holiday: {},
      year: 114,
    },
  ],
  i1209: [
    {
      title: {
        en:
          'Day of Arafah',

        ar:
          'يوم عرفة',
        bn:
          'আরাফাতের দিন',
        fa:
          'روز عرفه',
        fr:
          "Jour d'Arafat",
      },
      holiday: {},
    },
  ],
  i1210: [
    {
      title: {
        en:
          'Eid al-Adha',

        ar:
          'عيد الأضحى',
        az:
          'Qurban bayramı',
        fa:
          'عید قربان',
      },
      holiday: {
        IR: true,
      },
    },
  ],
  i1215: [
    {
      title: {
        en:
          'Ali al-Hadi',

        fa:
          'زادروز علی بن محمد نقی، امام دهم شیعیان',
      },
      holiday: {},
      year: 212,
    },
  ],
  i1218: [
    {
      title: {
        en:
          'Event of Ghadir Khumm',

        ar:
          'حديث الغدير',
        fa:
          'عید غدیر خم',
        fr:
          'Événement du Ghadir Khumm',
        hi:
          'ग़दीर ए ख़ुम की घटना',
        ru:
          'Гадир Хум',
      },
      holiday: {
        IR: true,
      },
      year: 10,
    },
  ],
  i1220: [
    {
      title: {
        en:
          'Musa al-Kadhim',

        fa:
          'زادروز موسی کاظم، امام هفتم شیعیان',
      },
      holiday: {},
      year: 128,
    },
  ],
  p0101: [
    {
      title: {
        en:
          'Nowruz',

        ar:
          'نوروز',
        az:
          'Novruz bayramı',
        bn:
          'নওরোজ',
        fa:
          'آغاز عید نوروز',
      },
      holiday: {
        IR: true,
      },
    },
  ],
  p0102: [
    {
      title: {
        en:
          'Nowruz',

        ar:
          'نوروز',
        az:
          'Novruz bayramı',
        bn:
          'নওরোজ',
        fa:
          'عید نوروز',
      },
      holiday: {
        IR: true,
      },
    },
    {
      title: {
        en:
          'Feyziyeh School',

        fa:
          'هجوم به مدرسهٔ فیضیهٔ قم',
      },
      holiday: {},
      year: 1342,
    },
    {
      title: {
        en:
          'Operation Fath ol-Mobin',

        es:
          'Operación Victoria Innegable',
        fa:
          'آغاز عملیات فتح‌المبین',
        fr:
          'Opération Victoire Indéniable',
        ja:
          'ファトホル＝モビーン作戦',
      },
      holiday: {},
      year: 1361,
    },
  ],
  p0103: [
    {
      title: {
        en:
          'Nowruz',

        ar:
          'نوروز',
        az:
          'Novruz bayramı',
        bn:
          'নওরোজ',
        fa:
          'عید نوروز',
      },
      holiday: {
        IR: true,
      },
    },
  ],
  p0104: [
    {
      title: {
        en:
          'Nowruz',

        ar:
          'نوروز',
        az:
          'Novruz bayramı',
        bn:
          'নওরোজ',
        fa:
          'عید نوروز',
      },
      holiday: {
        IR: true,
      },
    },
  ],
  p0106: [
    {
      title: {
        en:
          'Nowruz',

        fa:
          'روز امید، روز شادباش‌نویسی',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Zoroaster',

        ar:
          'زرادشت',
        az:
          'Zərdüşt',
        fa:
          'روز تولد زرتشت',
      },
      holiday: {},
    },
  ],
  p0107: [
    {
      title: {
        en:
          'Performing arts',

        ar:
          'فنون مرئية',
        fa:
          'روز هنرهای نمایشی',
      },
      holiday: {},
    },
  ],
  p0110: [
    {
      title: {
        en:
          'Aban',

        fa:
          'جشن آبانگاه',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'March 1979 Iranian Islamic Republic referendum',

        ar:
          'استفتاء إقامة جمهورية إسلامية في إيران، مارس 1979',
        de:
          'Referendum zur Staatsform des Iran im März 1979',
        es:
          'Referéndum de la República Islámica de Irán',
        fa:
          'همه‌پرسی تغییر نظام شاهنشاهی به جمهوری اسلامی ایران',
        ru:
          'Референдум в Иране (март 1979)',
      },
      holiday: {},
      year: 1358,
    },
  ],
  p0112: [
    {
      title: {
        en:
          'Iranian Islamic Republic Day',

        ar:
          'يوم الجمهورية الإسلامية (إيران)',
        fa:
          'روز جمهوری اسلامی ایران',
        fr:
          'Journée de la République islamique d’Iran',
      },
      holiday: {
        IR: true,
      },
    },
  ],
  p0113: [
    {
      title: {
        en:
          'Sizdah Be-dar',

        ar:
          'سيزده بدر',
        de:
          'Sizdah bedar',
        fa:
          'روز طبیعت',
        fr:
          'Sizdah bedar',
        it:
          'Sizdah bedar',
        ru:
          'День природы в Иране',
      },
      holiday: {
        IR: true,
      },
    },
    {
      title: {
        en:
          'Sizdah Be-dar',

        ar:
          'سيزده بدر',
        de:
          'Sizdah bedar',
        fa:
          'جشن سیزده‌بدر',
        fr:
          'Sizdah bedar',
        it:
          'Sizdah bedar',
        ru:
          'День природы в Иране',
      },
      holiday: {},
    },
  ],
  p0115: [
    {
      title: {
        en:
          'Iranian Biological Resource Center',

        fa:
          'روز ذخایر ژنتیکی و زیستی',
        ru:
          'Национальный центр генетических и биологических ресурсов Ирана',
      },
      holiday: {},
    },
  ],
  p0117: [
    {
      title: {
        en: 'Soroushgan',

        fa:
          'سروش‌روز، جشن سروشگان',
      },
      holiday: {},
    },
  ],
  p0119: [
    {
      title: {
        en:
          'Farvardinegan',
        fa:
          'فرورین‌روز، جشن فروردینگان',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Amina al-Sadr',

        ar:
          'آمنة الصدر',
        fa:
          'شهادت آیت‌الله سید محمد باقر صدر و خواهرشان بنت‌الهدی',
        ru:
          'Амина ас-Садр',
        tr:
          'Amine es-Sadr',
        ur:
          'آمنہ بنت الہدی صدر',
      },
      holiday: {},
      year: 1359,
    },
  ],
  p0120: [
    {
      title: {
        en: 'Iranian Revolution Arts Day',

        fa:
          'روز هنر انقلاب اسلامی',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Nuclear technology',

        ar:
          'طاقة نووية',
        az:
          'Nüvə energetikası',
        fa:
          'روز ملی فناوری هسته‌ای',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Iran–United States relations',

        ar:
          'العلاقات الإيرانية الأمريكية',
        bn:
          'ইরান–মার্কিন যুক্তরাষ্ট্র সম্পর্ক',
        de:
          'Beziehungen zwischen dem Iran und den Vereinigten Staaten',
        es:
          'Relaciones Estados Unidos-Irán',
        fa:
          'قطع مناسبات سیاسی ایران و آمریکا',
        fr:
          "Relations entre les États-Unis et l'Iran",
        hi:
          'ईरान-संयुक्त राज्य सम्बन्ध',
      },
      holiday: {},
      year: 1359,
    },
    {
      title: {
        en:
          'Morteza Avini',

        fa:
          'شهادت سید مرتضی آوینی',
      },
      holiday: {},
      year: 1372,
    },
  ],
  p0121: [
    {
      title: {
        en:
          'Housing Foundation of Islamic Revolution',

        fa:
          'سالروز افتتاح حساب شمارهٔ ۱۰۰ و تأسیس بنیاد مسکن انقلاب اسلامی',
      },
      holiday: {},
      year: 1358,
    },
    {
      title: {
        en:
          'Ali Sayad Shirazi',

        ar:
          'علي صياد شيرازي',
        de:
          'Ali Sayyad Schirazi',
        es:
          'Alí Sayyad Shirazí',
        fa:
          'شهادت امیر سپهبد علی صیاد شیرازی',
        fr:
          'Ali Sayad Shirazi',
        it:
          'Ali Sayad Shirazi',
        ja:
          'アリー・サイヤード・シーラーズィー',
        pl:
          'Ali Sajjad Szirazi',
      },
      holiday: {},
      year: 1378,
    },
  ],
  p0125: [
    {
      title: {
        en:
          'Attar of Nishapur',

        ar:
          'فريد الدين العطار',
        az:
          'Fəridəddin Əttar',
        bn:
          'ফরিদ উদ্দিন আত্তার',
        de:
          'Fariduddin Attar',
        fa:
          'روز بزرگداشت عطار نیشابوری',
      },
      holiday: {},
    },
  ],
  p0129: [
    {
      title: {
        en:
          'Islamic Republic of Iran Army Ground Forces',

        ar:
          'القوة البرية لجيش الجمهورية الإسلامية الإيرانية',
        az:
          'İran Quru Qoşunları',
        fa:
          'روز ارتش جمهوری اسلامی و نیروی زمینی',
        fr:
          "Armée de terre de la République islamique d'Iran",
        id:
          'Angkatan Darat Iran',
        ja:
          'イラン陸軍',
        ko:
          '이란 육군',
        ru:
          'Сухопутные войска Ирана',
      },
      holiday: {},
    },
  ],
  p0201: [
    {
      title: {
        en:
          'Saadi Shirazi',

        ar:
          'سعدي الشيرازي',
        az:
          'Sədi Şirazi',
        bn:
          'শেখ সাদি',
        fa:
          'روز بزرگداشت سعدی',
      },
      holiday: {},
      year: 1389,
    },
  ],
  p0202: [
    {
      title: {
        en:
          'Earth Day',

        fa:
          'جشن گیاه‌آوری',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Ordibeheshtgan',

        fa:
          'اردیبهشت‌روز، جشن اردیبهشتگان',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Islamic Revolutionary Guard Corps',

        ar:
          'الحرس الثوري الإيراني',
        az:
          'İslam İnqilabı Keşikçiləri Korpusu',
        fa:
          'تأسیس سپاه پاسداران انقلاب اسلامی',
      },
      holiday: {},
      year: 1358,
    },
    {
      title: {
        en:
          'Iranian Cultural Revolution',

        ar:
          'الثورة الثقافية الإيرانية',
        de:
          'Kulturrevolution (Iran)',
        fa:
          'اعلام انقلاب فرهنگی',
        nl:
          'Iraanse Culturele Revolutie',
        pt:
          'Revolução Cultural Iraniana',
      },
      holiday: {},
      year: 1359,
    },
  ],
  p0203: [
    {
      title: {
        en:
          "Baha' al-din al-'Amili",

        ar:
          'الشيخ البهائي',
        az:
          'Şeyx Bəhai',
        de:
          'Bahauddin Amili',
        es:
          'Bahā al-dīn al-Āmilī',
        fa:
          'روز بزرگداشت شیخ بهایی',
        fr:
          'Cheikh Bahaï',
        it:
          'Bahāʾ al-dīn al-ʿĀmilī',
        ku:
          'Behaedîn Amilî',
      },
      holiday: {},
    },
  ],
  p0205: [
    {
      title: {
        en:
          'Operation Eagle Claw',

        fa:
          'شکست حملهٔ نظامی آمریکا به ایران در طبس',
      },
      holiday: {},
      year: 1359,
    },
  ],
  p0207: [
    {
      title: {
        en:
          'Road Maintenance And Transportation Organization Of Iran',

        fa:
          'روز ایمنی حمل‌ونقل',
      },
      holiday: {},
    },
  ],
  p0209: [
    {
      title: {
        en:
          'Local councils of Iran',

        fa:
          'روز شوراها',
        zh:
          '伊朗城鄉議會',
      },
      holiday: {},
    },
  ],
  p0210: [
    {
      title: {
        en: 'Norouzh Chehelom',

        fa:
          'جشن چهلم نوروز',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Persian Gulf National Day',

        fa:
          'روز ملی خلیج فارس',
        hi:
          'फ़ारस की खाड़ी का राष्ट्रीय दिवस',
        ru:
          'Национальный день Персидского залива',
        ur:
          'خلیج فارس کا قومی دن',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Operation Beit ol-Moqaddas',

        ar:
          'عملية بيت المقدس',
        es:
          'Operación Beit ol Moqaddas',
        fa:
          'آغاز عملیات بیت المقدس',
        fr:
          'Opération Beit ol-Moqaddas',
        id:
          'Operasi Beit ol-Moqaddas',
        ja:
          'ベイトル＝モガッダス作戦',
      },
      holiday: {},
      year: 1361,
    },
  ],
  p0212: [
    {
      title: {
        en:
          'Morteza Motahhari',

        ar:
          'يوم المعلم',
        bn:
          'শিক্ষক দিবসের তালিকা',
        fa:
          'شهادت استاد مرتضی مطهری و روز معلم',
      },
      holiday: {},
      year: 1358,
    },
  ],
  p0215: [
    {
      title: {
        en:
          'Ibn Babawayh',

        ar:
          'الشيخ الصدوق',
        az:
          'Şeyx Səduq',
        de:
          'Ibn Bābawaih',
        fa:
          'روز بزرگداشت شیخ صدوق',
        fr:
          'Ibn Babuyeh',
        it:
          'Ibn Babawayh al-Qummi',
        pl:
          'Ibn Babawajh',
        ru:
          'Ибн Бабавайх ас-Садук',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Gahambars',

        fa:
          'گاهنبار میدیوزَرِم، جشن میانهٔ بهار، جشن بهاربُد / روز پیام‌آوری زرتشت',
        fr:
          'Gāhanbār',
      },
      holiday: {},
    },
  ],
  p0219: [
    {
      title: {
        en:
          'National Library of Iran',

        de:
          'Iranisches Nationalarchiv',
        fa:
          'روز اسناد ملی و میراث مکتوب',
      },
      holiday: {},
    },
    {
      title: {
        en:
          "Muhammad ibn Ya'qub al-Kulayni",

        ar:
          'محمد بن يعقوب الكليني',
        az:
          'Şeyx Kuleyni',
        de:
          'Al-Kulainī',
        fa:
          'روز بزرگداشت شیخ کلینی',
        fr:
          'Kolayni',
        it:
          "Muhammad ibn Ya'qub al-Kulayni",
        pl:
          'Muhammad ibn Jakub al-Kulajni',
      },
      holiday: {},
    },
  ],
  p0224: [
    {
      title: {
        en:
          'Tobacco Protest',

        ar:
          'ثورة التنباك',
        az:
          'Tənbəki üsyanı',
        de:
          'Tabakbewegung',
        fa:
          'لغو امتیاز تنباکو به فتوای آیت‌الله میرزا حسن شیرازی',
        fr:
          'Révolte du tabac',
        ja:
          'タバコ・ボイコット運動',
        ru:
          'Табачные протесты в Иране',
      },
      holiday: {},
      year: 1270,
    },
  ],
  p0225: [
    {
      title: {
        en:
          'Ferdowsi',

        ar:
          'أبو قاسم الفردوسي',
        az:
          'Firdovsi',
        fa:
          'روز پاسداشت زبان فارسی و بزرگداشت حکیم ابوالقاسم فردوسی',
      },
      holiday: {},
    },
  ],
  p0228: [
    {
      title: {
        en:
          'Omar Khayyam',

        ar:
          'عمر الخيام',
        az:
          'Ömər Xəyyam',
        fa:
          'روز بزرگداشت حکیم عمر خیام',
      },
      holiday: {},
    },
  ],
  p0230: [
    {
      title: {
        en:
          "Iran's National Population day",

        fa:
          'روز ملی جمعیت',
      },
      holiday: {},
    },
  ],
  p0231: [
    {
      title: {
        en:
          'Organ donation',

        fa:
          'روز اهدای عضو، اهدای زندگی',
      },
      holiday: {},
    },
  ],
  p0301: [
    {
      title: {
        en:
          'Mulla Sadra',

        ar:
          'صدر الدين الشيرازي',
        az:
          'Molla Sədra',
        bn:
          'মোল্লা সদরা',
        es:
          'Mulla Sadra',
        fa:
          'روز بزرگداشت ملاصدرا (صدرالمتألهین)',
        fr:
          'Molla Sadra Chirazi',
      },
      holiday: {},
    },
    {
      title: {
        en: 'Consumption optimization',

        fa:
          'روز بهره‌وری و بهینه‌سازی مصرف',
      },
      holiday: {},
    },
    {
      title: {
        en: 'Arqasoan',

        fa:
          'ارغاسوان، جشن گرما',
      },
      holiday: {},
    },
  ],
  p0303: [
    {
      title: {
        en:
          'Liberation of Khorramshahr',

        ar:
          'تحرير المحمرة',
        de:
          'Befreiung Chorramschahrs',

        es:
          'Segunda Batalla de Jorramchar',
        fa:
          'فتح خرمشهر در عملیات بیت‌المقدس و روز مقاومت، ایثار و پیروزی',
        ja:
          'ホッラムシャフル解放戦',
        ru:
          'Освобождение Хорремшехра',
      },
      holiday: {},
      year: 1361,
    },
  ],
  p0304: [
    {
      title: {
        en:
          'Dezful',

        fa:
          'روز دزفول و روز مقاومت و پایداری',
        ru:
          'День сопротивления Дизфуля',
      },
      holiday: {},
    },
  ],
  p0305: [
    {
      title: {
        en:
          "Nasim mehr's day",

        fa:
          'روز نسیم مهر (روز حمایت از خانواده ی زندانیان)',
      },
      holiday: {},
    },
  ],
  p0306: [
    {
      title: {
        en:
          'Khordadgān',

        fa:
          'خردادروز، جشن خردادگان',
      },
      holiday: {},
    },
  ],
  p0307: [
    {
      title: {
        en:
          'The Parliament of Iran',

        ar:
          'مجلس الشورى الإسلامي (إيران)',
        az:
          'İslam Məşvərət Şurası',
        bn:
          'ইসলামী পরামর্শদায়ক সমাবেশ',
        de:
          'Madschles',
        fa:
          'افتتاح اولین دورهٔ مجلس شورای اسلامی',
      },
      holiday: {},
      year: 1359,
    },
  ],
  p0314: [
    {
      title: {
        en:
          'Ruhollah Khomeini',

        ar:
          'روح الله الخميني',
        az:
          'Ruhullah Xomeyni',
        fa:
          'رحلت امام خمینی رهبر انقلاب اسلامی',
      },
      holiday: {
        IR: true,
      },
      year: 1368,
    },
    {
      title: {
        en:
          'Ayatollah Khamenei',

        ar:
          'علي خامنئي',
        az:
          'Əli Xamenei',
        fa:
          'انتخاب آیت‌الله خامنه‌ای به رهبری',
      },
      holiday: {},
      year: 1368,
    },
  ],
  p0315: [
    {
      title: {
        en:
          'Ruhollah Khomeini',

        ar:
          'روح الله الخميني',
        az:
          'Ruhullah Xomeyni',
        fa:
          'زندانی شدن امام خمینی',
      },
      holiday: {},
      year: 1342,
    },
    {
      title: {
        en:
          '1963 demonstrations in Iran',

        ar:
          'تظاهرات 5 يوليو 1963 في إيران',
        de:
          'Unruhen im Iran im Juni 1963',
        es:
          'Insurrección del 15 de Jordad',
        fa:
          'قیام خونین ۱۵ خرداد',
        fr:
          'Émeutes de juin 1963 en Iran',
        pl:
          'Powstanie w Iranie (1963)',
      },
      holiday: {
        IR: true,
      },
      year: 1342,
    },
  ],
  p0320: [
    {
      title: {
        en:
          'Seyyed Mohammad Reza Saeedi',
        fa:
          'شهادت آیت‌الله سعیدی',
      },
      holiday: {},
      year: 1349,
    },
  ],
  p0325: [
    {
      title: {
        en:
          'Iranian National Flowers Day',

        fa:
          'روز گل و گیاه',
      },
      holiday: {},
    },
  ],
  p0326: [
    {
      title: {
        en:
          "Fada'iyan-e Islam",

        ar:
          'فدائيو الإسلام',
        az:
          'İslam fədailəri',
        de:
          'Fedāʾiyān-e Eslām',
        fa:
          'شهادت بخارایی، امانی، صفار هرندی و نیک‌نژاد از اعضای فدائیان اسلام',
        fr:
          "Fedayin de l'Islam",
        id:
          'Fedaiyan Islam',
        it:
          "Devoti dell'Islam",
        pl:
          'Fedaini Islamu',
        ru:
          'Федаины ислама',
      },
      holiday: {},
      year: 1344,
    },
  ],
  p0327: [
    {
      title: {
        en:
          'Ministry of Agriculture Jihad',

        fa:
          'روز جهاد کشاورزی (تشکیل جهاد سازندگی)',
      },
      holiday: {},
      year: 1358,
    },
  ],
  p0329: [
    {
      title: {
        en:
          'Ali Shariati',

        ar:
          'علي شريعتي',
        az:
          'Əli Şəriəti',
        de:
          'Ali Schariati',
        es:
          'Alí Shariatí',
        fa:
          'درگذشت دکتر علی شریعتی',
      },
      holiday: {},
      year: 1356,
    },
  ],
  p0330: [
    {
      title: {
        en:
          'Imam Reza shrine bombing',

        ar:
          'تفجير ضريح الإمام علي الرضا 1994',
        fa:
          'شهادت زائران حرم رضوی (ع) (عاشورای ۱۳۷۳ ه‍.ش)',
      },
      holiday: {},
      year: 1373,
    },
  ],
  p0331: [
    {
      title: {
        en:
          'Basij',

        fa:
          'روز بسیج استادان',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Mostafa Chamran',

        ar:
          'مصطفى تشمران',
        az:
          'Mustafa Çamran',
        de:
          'Mostafa Tschamran',
        es:
          'Mostafá Chamrán',
        fa:
          'شهادت دکتر مصطفی چمران',
        fr:
          'Mostafa Chamran',
        id:
          'Mustafa Chamran',
        ja:
          'モスタファー・チャムラーン',
      },
      holiday: {},
      year: 1360,
    },
    {
      title: {
        en:
          'Abolhassan Banisadr',

        ar:
          'أبو الحسن بني صدر',
        az:
          'Əbülhəsən Banisədr',
        fa:
          'صدور رأی مجلس به عدم کفایت بنی صدر',
      },
      holiday: {},
      year: 1360,
    },
  ],
  p0401: [
    {
      title: {
        en:
          'Summer',

        ar:
          'صيف',
        fa:
          'جشن آب‌پاشونک، جشن آغاز تابستان / سال نو در گاهشماری گاهنباری / دیدار طلوع خورشید در تقویم آفتابی چارتاقی نیاسر',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Corporation',

        ar:
          'طائفة حرفية',
        fa:
          'روز اصناف',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Islamic Development Organization',

        fa:
          'روز تبلیغ و اطلاع‌رسانی دینی (تأسیس سازمان تبلیغات اسلامی)',
        ru:
          'Организация исламской пропаганды',
      },
      holiday: {},
      year: 1360,
    },
  ],
  p0406: [
    {
      title: {
        en:
          'Iranian Niloufar feast',

        fa:
          'جشن نیلوفر',
      },
      holiday: {},
    },
  ],
  p0407: [
    {
      title: {
        en:
          'Judicial system of Iran',

        fa:
          'روز قوهٔ قضاییه',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Mohammad Beheshti',

        ar:
          'محمد بهشتي',
        az:
          'Məhəmməd Behişti',
        de:
          'Mohammad Beheschti',
        es:
          'Mohammad Beheshtí',
        fa:
          'شهادت آیت‌الله دکتر بهشتی و ۷۲ تن از یاران',
        fr:
          'Mohammad Beheshti',
      },
      holiday: {},
      year: 1360,
    },
  ],
  p0408: [
    {
      title: {
        en:
          'Chemical weapon',

        ar:
          'سلاح كيميائي',
        az:
          'Kimyəvi silah',
        fa:
          'روز مبارزه با سلاح‌های شیمیایی و میکروبی',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Chemical bombing of Sardasht',

        de:
          'Giftgasangriff auf Sardascht',
        fa:
          'بمباران شیمیایی سردشت',
      },
      holiday: {},
      year: 1366,
    },
  ],
  p0410: [
    {
      title: {
        en:
          'Battle of Mehran',

        fa:
          'روز آزادسازی شهر مهران',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Ministry of Industry, Mine and Trade',

        ar:
          'وزارة الصناعة والتعدين والتجارة (إيران)',
        fa:
          'روز صنعت و معدن',
        it:
          "Ministero dell'industria, delle miniere e del commercio",
        ru:
          'Министерство промышленности и торговли Ирана',
      },
      holiday: {},
    },
  ],
  p0411: [
    {
      title: {
        en:
          'Mohammad Sadoughi',

        fa:
          'شهادت آیت‌الله صدوقی',
      },
      holiday: {},
      year: 1361,
    },
  ],
  p0412: [
    {
      title: {
        en:
          'Human rights in the United States',

        fa:
          'روز افشای حقوق بشر آمریکایی',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Abdul Hosein Amini',

        ar:
          'عبد الحسين الأميني',
        az:
          'Əbdülhüseyn Əmini',
        fa:
          'روز بزرگداشت علامه امینی',
        fr:
          'Abdul Hosein Amini',
        tr:
          'Abdülhüseyin Emini',
      },
      holiday: {},
      year: 1349,
    },
    {
      title: {
        en:
          'Iran Air Flight 655',

        ar:
          'إيران للطيران الرحلة 655',
        az:
          '"İranAir"ə aid mülki təyyarənin vurulması',
        de:
          'Iran-Air-Flug 655',
        es:
          'Vuelo 655 de Iran Air',
        fa:
          'حملهٔ ناوگان آمریکا به هواپیمای مسافربری ایران',
      },
      holiday: {},
      year: 1367,
    },
  ],
  p0413: [
    {
      title: {
        en:
          'Tirgan',

        de:
          'Tirgan',
        fa:
          'تیرروز، جشن تیرگان',
        ru:
          'Тирган',
      },
      holiday: {},
    },
  ],
  p0414: [
    {
      title: {
        en: "Iran's Municipalities and village administrators",
        fa:
          'روز شهرداری و دهیاری',
      },
      holiday: {},
    },
    {
      title: {
        en: "Iranian Ghalam's day",

        fa:
          'روز قلم',
      },
      holiday: {},
    },
  ],
  p0415: [
    {
      title: {
        en: 'Raw veganism',

        fa:
          'جشن خام‌خواری',
      },
      holiday: {},
    },
  ],
  p0416: [
    {
      title: {
        en: 'Tax',

        ar:
          'ضريبة',
        az:
          'Vergi',
        fa:
          'روز مالیات',
      },
      holiday: {},
    },
  ],
  p0418: [
    {
      title: {
        en: "Children's literature",

        ar:
          'أدب أطفال',
        az:
          'Uşaq ədəbiyyatı',
        bn:
          'শিশুসাহিত্য',
        fa:
          'روز ادبیات کودکان و نوجوانان',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Nojeh coup plot',

        ar:
          'انقلاب نوجة',
        de:
          'Nojeh-Coup',
        fa:
          'کشف کودتای نوژه',
        pt:
          'Golpe Nojeh',
        ru:
          'Переворот Ноже',
      },
      holiday: {},
      year: 1359,
    },
  ],
  p0421: [
    {
      title: {
        en: 'Hijab',

        fa:
          'روز عفاف و حجاب',
        ru:
          'День хиджаба и целомудрия',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Goharshad Mosque rebellion',

        ar:
          'حادثة مسجد كوهرشاد',
        fa:
          'حمله به مسجد گوهرشاد و کشتار مردم',
        pl:
          'Powstanie w Iranie (1935)',
      },
      holiday: {},
      year: 1314,
    },
  ],
  p0423: [
    {
      title: {
        en:
          'Assembly of Experts',

        ar:
          'مجلس خبراء القيادة',
        de:
          'Expertenrat',
        es:
          'Asamblea de los Expertos',
        fa:
          'گشایش نخستین مجلس خبرگان رهبری',
        fr:
          'Assemblée des experts',
      },
      holiday: {},
      year: 1362,
    },
    {
      title: {
        en:
          'Joint Comprehensive Plan of Action',

        ar:
          'خطة العمل الشاملة المشتركة',
        es:
          'Plan de Acción Integral Conjunto',
        fa:
          'تصویب برجام و روز گفت‌وگو و تعامل سازنده با جهان',
        fr:
          'Accord de Vienne sur le nucléaire iranien',
        id:
          'Rencana Aksi Komprehensif Bersama',
      },
      holiday: {},
      year: 1394,
    },
  ],
  p0425: [
    {
      title: {
        en:
          'Social Security Organisation',

        ar:
          'منظمة الضمان الاجتماعي الإيرانية',
        fa:
          'روز بهزیستی و تامین اجتماعی',
      },
      holiday: {},
    },
  ],
  p0426: [
    {
      title: {
        en:
          'Guardian Council',

        ar:
          'مجلس صيانة الدستور',
        de:
          'Wächterrat',
        es:
          'Consejo de Guardianes',
        fa:
          'سالروز تأسیس نهاد شورای نگهبان',
        fr:
          'Conseil des gardiens de la Constitution',
        id:
          'Dewan Wali Iran',
        it:
          'Consiglio dei Guardiani della Costituzione',
      },
      holiday: {},
    },
  ],
  p0427: [
    {
      title: {
        en:
          'United Nations Security Council Resolution 598',

        ar:
          'قرار مجلس الأمن التابع للأمم المتحدة رقم 598',
        fa:
          'اعلام پذیرش قطعنامهٔ ۵۹۸ شورای امنیت از سوی ایران',
        id:
          'Resolusi 598 Dewan Keamanan Perserikatan Bangsa-Bangsa',
        nl:
          'Resolutie 598 Veiligheidsraad Verenigde Naties',
      },
      holiday: {},
      year: 1367,
    },
  ],
  p0430: [
    {
      title: {
        en:
          'Abol-Ghasem Kashani',

        ar:
          'أبوالقاسم الكاشاني',
        az:
          'Seyid Əbülqasim Kaşani',
        de:
          'Abol-Qasem Kaschani',
        es:
          'Seyyed Abolqasem Kashaní',
        fa:
          'روز بزرگداشت آیت‌الله سیدابوالقاسم کاشانی',
        fr:
          'Abou al-Qassem Kachani',
        it:
          'Abol-Ghasem Mostafavi Kashani',
        pl:
          'Abolghasem Kaszani',
      },
      holiday: {},
    },
  ],
  p0505: [
    {
      title: {
        en:
          'Operation Mersad',

        ar:
          'عملية مرصاد',
        es:
          'Operación Mersad',
        fa:
          'سالروز عملیات مرصاد',
        fr:
          'Opération Mersad',
        ru:
          'Операция «Мерсад»',
      },
      holiday: {},
      year: 1367,
    },
  ],
  p0507: [
    {
      title: {
        en: 'Amordadgan',

        fa:
          'امردادگان',
      },
      holiday: {},
    },
  ],
  p0508: [
    {
      title: {
        en:
          'Shahab al-Din Yahya ibn Habash Suhrawardi',

        ar:
          'السهروردي المقتول',
        az:
          'Şihabəddin Yəhya Sührəvərdi',
        bn:
          'ইয়াহিয়া ইবনে হাবাশ সোহরাওয়ার্দী',
        de:
          'Schihab ad-Din Yahya Suhrawardi',
        fa:
          'روز بزرگداشت شیخ شهاب‌الدین سهروردی (شیخ اشراق)',
        fr:
          'Shihab al-Din Sohrawardi',
      },
      holiday: {},
    },
  ],
  p0509: [
    {
      title: {
        en: 'Blood donation',

        fa:
          'روز اهدای خون',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Sheikh Fazlollah Noori',

        ar:
          'فضل الله النوري',
        az:
          'Şeyx Fəzlullah Nuri',
        de:
          'Fazlollah Nuri',
        es:
          'Sheij Fazlollah Nurí',
        fa:
          'شهادت آیت‌الله شیخ فضل‌الله نوری',
        fr:
          'Sheikh Fazlollâh Nuri',
      },
      holiday: {},
      year: 1288,
    },
  ],
  p0514: [
    {
      title: {
        en: 'Persian Constitutional Revolution',

        fa:
          'صدور فرمان مشروطیت',
      },
      holiday: {},
      year: 1285,
    },
  ],
  p0516: [
    {
      title: {
        en:
          'Academic Center for Education, Culture and Research',

        fa:
          'تشکیل جهاد دانشگاهی',
        ru:
          'Академический джихад (Иран)',
      },
      holiday: {},
      year: 1359,
    },
  ],
  p0517: [
    {
      title: {
        en:
          'Correspondent',

        ar:
          'مراسل',
        az:
          'Müxbir',
        de:
          'Korrespondent',
        es:
          'Corresponsal',
        fa:
          'روز خبرنگار',
      },
      holiday: {},
    },
  ],
  p0521: [
    {
      title: {
        en: 'Small Industries',

        fa:
          'روز حمایت از صنایع کوچک',
      },
      holiday: {},
    },
  ],
  p0522: [
    {
      title: {
        en: 'Day of social organizations and partnerships',

        fa:
          'روز تشکل‌ها و مشارکت‌های اجتماعی',
      },
      holiday: {},
    },
  ],
  p0523: [
    {
      title: {
        en: 'Islamic Resistance Movement',

        ar:
          'حركة حماس',
        az:
          'Həmas',
        bn:
          'হামাস',
        fa:
          'روز مقاومت اسلامی',
      },
      holiday: {},
    },
  ],
  p0526: [
    {
      title: {
        en: 'Iran–Iraq War',

        fa:
          'آغاز بازگشت آزادگان به ایران',
      },
      holiday: {},
      year: 1369,
    },
  ],
  p0528: [
    {
      title: {
        en: "1953 Iranian coup d'état",

        ar:
          'انقلاب 1953 في إيران',
        az:
          'İran çevrilişi (1953)',
        de:
          'Operation Ajax',
        fa:
          'کودتای ۲۸ مرداد',
      },
      holiday: {},
      year: 1332,
    },
    {
      title: {
        en:
          'Cinema Rex fire',

        de:
          'Brandanschlag Cinema Rex',
        es:
          'Incendio del Cinema Rex',
        fa:
          'آتش‌سوزی سینما رکس آبادان',
        fr:
          "Incendie du cinéma Rex d'Abadan",
        ko:
          '시네마 렉스 화재',
        pt:
          'Incêndio no Cinema Rex',
        ru:
          'Пожар в кинотеатре «Рекс»',
      },
      holiday: {},
      year: 1357,
    },
    {
      title: {
        en:
          'Assembly of Experts for Constitution',

        ar:
          'مجلس الخبراء الأول',
        de:
          'Expertenversammlung',
        es:
          'Asamblea de Expertos para la Constitución',
        fa:
          'گشایش مجلس خبرگان برای بررسی نهایی قانون اساسی جمهوری اسلامی ایران',
      },
      holiday: {},
      year: 1358,
    },
  ],
  p0530: [
    {
      title: {
        en:
          'Mohammad-Baqer Majlesi',

        ar:
          'محمد باقر المجلسي',
        az:
          'Məhəmməd Baqir Məclisi',
        de:
          'Muhammad Bāqir al-Madschlisī',
        es:
          'Muhammad Baqir Maylisi',
        fa:
          'روز بزرگداشت علامه مجلسی',
        fr:
          'Allameh Madjlessi',
        it:
          'Muhammad Baqir Majlisi',
        pl:
          'Muhammad Bakir al-Madżlisi',
      },
      holiday: {},
    },
  ],
  p0531: [
    {
      title: {
        en:
          'Defense Industries Organization',

        ar:
          'منظمة الصناعات الدفاعية الإيرانية',
        fa:
          'روز صنعت دفاعی',
        fr:
          'Organisation des industries de défense (Iran)',
        ko:
          '이란국방산업기구',
        tr:
          'Savunma Sanayii Örgütü',
      },
      holiday: {},
    },
  ],
  p0601: [
    {
      title: {
        en:
          "National Doctors' Day",

        ar:
          'يوم الطبيب',
        bn:
          'জাতীয় চিকিৎসক দিবস',
        fa:
          'روز پزشک',
        id:
          'Hari Dokter Nasional',
        ja:
          '国民医者の日',
      },
      holiday: {},
    },
    {
      title: {
        en: 'Avicenna',

        ar:
          'ابن سينا',
        az:
          'İbn Sina',
        fa:
          'روز بزرگداشت ابوعلی سینا',
      },
      holiday: {},
    },
    {
      title: {
        en: 'Celebrate the coolness of the air',

        fa:
          'فغدیه، جشن خنکی هوا',
      },
      holiday: {},
    },
  ],
  p0602: [
    {
      title: {
        en: 'Presidential Administration of Iran',

        fa:
          'آغاز هفتهٔ دولت',
      },
      holiday: {},
    },
    {
      title: {
        en: 'Sayed Ali Andarzgoo',

        fa:
          'شهادت سید علی اندرزگو',
      },
      holiday: {},
      year: 1357,
    },
  ],
  p0603: [
    {
      title: {
        en: 'Keshmin',

        fa:
          'جشن کشمین',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Anglo-Soviet invasion of Iran',

        ar:
          'الغزو الأنجلو-سوفيتي لإيران',
        bn:
          'ইরানে ইঙ্গ–সোভিয়েত আক্রমণ',
        de:
          'Anglo-sowjetische Invasion des Iran',
        es:
          'Invasión anglosoviética de Irán',
        fa:
          'اشغال ایران به دست متفقین',
      },
      holiday: {},
      year: 1320,
    },
  ],
  p0604: [
    {
      title: {
        en: 'Shahrivargan',

        fa:
          'شهریورروز، جشن شهریورگان / زادروز داراب (کوروش) / عروج مانی',
      },
      holiday: {},
    },
    {
      title: {
        en: 'Employee Day',

        fa:
          'روز کارمند',
      },
      holiday: {},
    },
  ],
  p0605: [
    {
      title: {
        en: 'Gholamreza Takhti',

        az:
          'Qulamrza Təxti',
        fa:
          'تولد جهان پهلوان غلامرضاتختی و روز کشتی',
      },
      holiday: {},
    },
    {
      title: {
        en: 'Muhammad ibn Zakariya al-Razi',

        ar:
          'أبو بكر الرازي',
        az:
          'Məhəmməd ibn Zəkəriyə əl-Razi',
        bn:
          'আল রাযী',
        fa:
          'روز بزرگداشت محمد بن زکریای رازی',
      },
      holiday: {},
    },
    {
      title: {
        en: 'Pharmacy',

        fa:
          'روز داروسازی',
        ru:
          'День фармацевта (Иран)',
      },
      holiday: {},
    },
  ],
  p0608: [
    {
      title: {
        en: 'Khazanjashn',

        fa:
          'خزان‌جشن',
      },
      holiday: {},
    },
    {
      title: {
        en:
          "1981 Iranian Prime Minister's office bombing",

        ar:
          'تفجير مكتب رئيس الوزراء الإيراني 1981',
        fa:
          'روز مبارزه با تروریسم (انفجار دفتر نخست‌وزیری و شهادت رجایی و باهنر)',
        fr:
          'Attentat du 30 août 1981 à Téhéran',
      },
      holiday: {},
      year: 1360,
    },
  ],
  p0610: [
    {
      title: {
        en:
          'Islamic banking and finance',

        ar:
          'مصرفية إسلامية',
        az:
          'İslam bankçılığı',
        bn:
          'ইসলামি ব্যাংকিং ও অর্থসংস্থান',
        de:
          'Islamisches Bankwesen',
        fa:
          'روز بانکداری اسلامی (تصویب قانون عملیات بانکی بدون ربا)',
      },
      holiday: {},
    },
  ],
  p0611: [
    {
      title: {
        en: 'Printing',

        fa:
          'روز صنعت چاپ',
      },
      holiday: {},
    },
  ],
  p0612: [
    {
      title: {
        en: 'Behvarz',

        fa:
          'روز بهورز',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Rais Ali Delvari',
        az:
          'Rəisəli Delvari',
        fa:
          'روز مبارزه با استعمار انگلیس (سالروز شهادت رئیس‌علی دلواری)',
      },
      holiday: {},
    },
  ],
  p0613: [
    {
      title: {
        en: 'Cooperative',

        fa:
          'روز تعاون',
      },
      holiday: {},
    },
    {
      title: {
        en: 'Al-Biruni',

        ar:
          'أبو الريحان البيروني',
        az:
          'Əl-Biruni',
        fa:
          'روز بزرگداشت ابوریحان بیرونی',
      },
      holiday: {},
    },
    {
      title: {
        en: 'Anthropology',

        fa:
          'روز مردم‌شناسی',
      },
      holiday: {},
    },
  ],
  p0614: [
    {
      title: {
        en:
          'Ali Qoddusi',

        fa:
          'شهادت آیت‌الله قدوسی و سرتیپ وحید دستجردی',
      },
      holiday: {},
      year: 1360,
    },
  ],
  p0615: [
    {
      title: {
        en: 'Bazarjashn',

        fa:
          'بازارجشن',
      },
      holiday: {},
    },
  ],
  p0617: [
    {
      title: {
        en:
          'Black Friday (1978)',

        ar:
          'الجمعة السوداء (1978)',
        de:
          'Schwarzer Freitag (1978)',
        es:
          'Viernes Negro (1978)',
        fa:
          'قیام ۱۷ شهریور و کشتار جمعی از مردم به دست مأموران پهلوی',
        fr:
          'Vendredi noir (1978)',
        ko:
          '검은 금요일 (1978년)',
        pt:
          'Sexta-feira Negra (1978)',
      },
      holiday: {},
      year: 1357,
    },
  ],
  p0619: [
    {
      title: {
        en:
          'Mahmoud Taleghani',

        ar:
          'محمود طالقاني',
        de:
          'Mahmud Taleghani',
        es:
          'Mahmud Taleghani',
        fa:
          'وفات آیت‌الله سید محمود طالقانی اولین امام جمعهٔ تهران',
        fr:
          'Mahmoud Taleghani',
        it:
          'Mahmud Taleghani',
        ja:
          'マフムード・ターレガーニー',
      },
      holiday: {},
      year: 1358,
    },
  ],
  p0620: [
    {
      title: {
        en:
          'Mir Asadollah Madani',

        fa:
          'شهادت آیت‌الله مدنی',
      },
      holiday: {},
      year: 1360,
    },
  ],
  p0621: [
    {
      title: {
        en:
          'Cinema',

        de:
          'Cinema (Begriffsklärung)',
        es:
          'Cinema',
        fa:
          'روز سینما',
        fr:
          'Cinéma (homonymie)',
        hi:
          'चलचित्रपट',
        id:
          'Sinema',
        it:
          'Cinema (disambigua)',
      },
      holiday: {},
    },
  ],
  p0627: [
    {
      title: {
        en: 'Persian literature',

        fa:
          'روز شعر و ادب فارسی',
        ru:
          'День персидской литературы и поэзии',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Mohammad-Hossein Shahriar',

        ar:
          'محمد حسين شهريار',
        az:
          'Məhəmmədhüseyn Şəhriyar',
        de:
          'Seyyed Mohammad Hossein Behjat-Tabrizi',
        es:
          'Mohammad-Hossein Shahriar',
        fa:
          'روز بزرگداشت استاد سید محمدحسین شهریار',
        fr:
          'Mohammad Hossein Behjat Tabrizi',
      },
      holiday: {},
    },
  ],
  p0630: [
    {
      title: {
        en:
          'Dialogue Among Civilizations',

        ar:
          'حوار الحضارات',
        es:
          'Diálogo entre civilizaciones',
        fa:
          'روز گفت‌وگوی تمدن‌ها',
        it:
          'Dialogo di civiltà',
      },
      holiday: {},
    },
  ],
  p0631: [
    {
      title: {
        en:
          'Sacred Defence Week',

        az:
          'Müqəddəs Müdafiə Həftəsi',
        fa:
          'آغاز هفتهٔ دفاع مقدس',
        tr:
          'Kutsal Savunma Haftası',
      },
      holiday: {},
    },
    {
      title: {
        en: 'End of summer feast',

        fa:
          'گاهنبار پَتیَه‌شَهیم، جشن پایان تابستان',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Iraqi invasion of Iran',

        ar:
          'الغزو العراقي لإيران (1980)',
        fa:
          'آغاز جنگ تحمیلی',
        ur:
          'ایران پر عراقی یلغار(1980)',
      },
      holiday: {},
      year: 1359,
    },
  ],
  p0701: [
    {
      title: {
        en: 'Mitrakana',

        fa:
          'جشن میتراکانا / سال نو هخامنشی',
      },
      holiday: {},
    },
  ],
  p0705: [
    {
      title: {
        en:
          "Operation Samen-ol-A'emeh",

        ar:
          'عملية ثامن الأئمة',
        es:
          "Operación Samen-ol-A'emeh",
        fa:
          'شکست حصر آبادان در عملیات ثامن‌الأئمه (ع)',
        ja:
          'サーメノル＝アエンメ作戦',
      },
      holiday: {},
      year: 1360,
    },
  ],
  p0707: [
    {
      title: {
        en: 'Iran–Iraq War',

        ar:
          'حرب الخليج الأولى',
        az:
          'İran-İraq müharibəsi',
        fa:
          'روز بزرگداشت فرماندهان شهید دفاع مقدس',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Shams Tabrizi',

        ar:
          'الشمس التبريزي',
        az:
          'Şəms Təbrizi',
        bn:
          'শামস তাবরিজি',
        de:
          'Schams-e Tabrizi',
        fa:
          'روز بزرگداشت شمس',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Firefighting',

        ar:
          'مكافحة الحريق',
        de:
          'Brandbekämpfung',
        fa:
          'روز آتش‌نشانی و ایمنی',
        fr:
          "Lutte contre l'incendie",
        hi:
          'अग्निशमन',
      },
      holiday: {},
    },
    {
      title: {
        en:
          '1981 Iranian Air Force C-130 crash',

        ar:
          'تحطم الطائرة العسكرية سي-130',
        fa:
          'شهادت فلاحی، فکوری، نامجو، کلاهدوز و جهان‌آرا از فرماندهان ارتش و سپاه',
        zh:
          '1981年伊朗空军C-130运输机坠机事故',
      },
      holiday: {},
      year: 1360,
    },
  ],
  p0708: [
    {
      title: {
        en: 'Rumi',

        ar:
          'جلال الدين الرومي',
        az:
          'Mövlana Cəlaləddin Rumi',
        fa:
          'روز بزرگداشت مولوی',
      },
      holiday: {},
    },
  ],
  p0709: [
    {
      title: {
        en: 'Palestine',

        ar:
          'فلسطين',
        az:
          'Fələstin',
        fa:
          'روز همبستگی و همدردی با کودکان و نوجوانان فلسطینی',
      },
      holiday: {},
    },
  ],
  p0712: [
    {
      title: {
        en: 'Qalishouyan',

        fa:
          'آیین قالیشویان اردهال، بازماندی از تیرگان',
      },
      holiday: {},
    },
  ],
  p0713: [
    {
      title: {
        en: 'Tirrouz',

        fa:
          'تیرروز، جشن تیرروزی',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Law Enforcement Force (Iran)',

        de:
          'Ordnungskräfte des Iran',
        es:
          'Fuerza Disciplinaria de la República Islámica de Irán',
        fa:
          'روز نیروی انتظامی',
        hi:
          'इस्लामी गणतंत्र ईरान का कानून प्रवर्तन बल',
        it:
          "Forza disciplinare della Repubblica Islamica dell'Iran",
        ru:
          'Силы правопорядка Исламской Республики Иран',
        tr:
          'İran Kolluk Kuvvetleri',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Ruhollah Khomeini',

        ar:
          'روح الله الخميني',
        az:
          'Ruhullah Xomeyni',
        fa:
          'هجرت آیت‌الله روح‌الله خمینی از عراق به پاریس',
      },
      holiday: {},
      year: 1357,
    },
  ],
  p0714: [
    {
      title: {
        en: 'Veterinary medicine',

        ar:
          'طب بيطري',
        bn:
          'প্রাণি চিকিৎসাবিজ্ঞান',
        fa:
          'روز دامپزشکی',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Salman the Persian',

        ar:
          'سلمان الفارسي',
        az:
          'Salman Farsi',
        bn:
          'সালমান আল-ফারসি',
        de:
          'Salmān al-Fārisī',
        fa:
          'روز بزرگداشت سلمان فارسی',
      },
      holiday: {},
    },
  ],
  p0715: [
    {
      title: {
        en: 'Nomad',

        fa:
          'روز روستا و عشایر',
      },
      holiday: {},
    },
  ],
  p0716: [
    {
      title: {
        en: 'Mehregan',

        fa:
          'مهرروز، جشن مهرگان',
      },
      holiday: {},
    },
  ],
  p0720: [
    {
      title: {
        en: 'Disability',

        fa:
          'روز اسکان معلولان و سالمندان',
      },
      holiday: {},
    },
    {
      title: {
        en: 'Hafez',

        ar:
          'حافظ الشيرازي',
        az:
          'Hafiz Şirazi',
        fa:
          'روز بزرگداشت حافظ',
      },
      holiday: {},
    },
  ],
  p0721: [
    {
      title: {
        en: 'Ramrouz',

        fa:
          'رام‌روز، جشن رام‌روزی / جشن پیروزی کاوه و فریدون',
      },
      holiday: {},
    },
  ],
  p0723: [
    {
      title: {
        en:
          "Ata'ollah Ashrafi Esfahani",

        fa:
          'شهادت آیت‌الله اشرفی اصفهانی',
        fr:
          "Ata'ollah Ashrafi Esfahani",
      },
      holiday: {},
      year: 1361,
    },
  ],
  p0724: [
    {
      title: {
        en: 'Parent-teacher conference',

        fa:
          'روز پیوند اولیا و مربیان',
      },
      holiday: {},
    },
    {
      title: {
        en: 'Paralympic Games',

        fa:
          'روز ملی پارالمپیک',
      },
      holiday: {},
    },
    {
      title: {
        en: 'Jameh Mosque of Kerman',

        fa:
          'به آتش کشیده‌شدن مسجد جامع شهر کرمان',
      },
      holiday: {},
      year: 1357,
    },
  ],
  p0726: [
    {
      title: {
        en: 'Sports',

        fa:
          'روز تربیت بدنی و ورزش',
      },
      holiday: {},
    },
  ],
  p0729: [
    {
      title: {
        en: 'Export',

        ar:
          'تصدير',
        az:
          'İxracat',
        fa:
          'روز صادرات',
      },
      holiday: {},
    },
  ],
  p0801: [
    {
      title: {
        en: 'Statistics and planning',

        fa:
          'روز آمار و برنامه‌ریزی',
      },
      holiday: {},
    },
  ],
  p0804: [
    {
      title: {
        en: 'Capitulation',

        es:
          'Capitulación en Irán',
        fa:
          'اعتراض و افشاگری امام خمينی عليه پذيرش كاپيتولاسيون',
      },
      holiday: {},
      year: 1343,
    },
  ],
  p0807: [
    {
      title: {
        en:
          'Cyrus the Great Day',

        fa:
          'روز کوروش بزرگ',
        fr:
          'Cyrus Jour',
        id:
          'Hari Koresh Agung',
      },
      holiday: {},
    },
  ],
  p0808: [
    {
      title: {
        en:
          'Mohammad Hossein Fahmideh',

        de:
          'Hossein Fahmideh',
        es:
          'Mohammad Hosein Fahmidé',
        fa:
          'شهادت محمدحسين فهميده(بسيجی ۱۳ ساله) ـ روز نوجوان و بسيج دانش آموزی',
        fr:
          'Mohammad Hossein Fahmideh',
        pl:
          'Mohammad Hosejn Fahmide',
        ru:
          'Фахмиде, Мохаммад Хосейн',
      },
      holiday: {},
      year: 1359,
    },
    {
      title: {
        en: 'Passive Defense',

        fa:
          'روز پدافند غیرعامل',
      },
      holiday: {},
      year: 1390,
    },
  ],
  p0810: [
    {
      title: {
        en:
          'Aban',

        fa:
          'آبان‌روز، جشن آبانگان',
        ja:
          'アープ (水神)',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Mohammad Ali Qazi Tabatabaei',

        fa:
          'شهادت آيت‌الله قاضی طباطبایی',
      },
      holiday: {},
      year: 1358,
    },
  ],
  p0813: [
    {
      title: {
        en:
          'Pupil Day (Iran)',

        fa:
          'روز دانش آموز',
      },
      holiday: {},
      year: 1357,
    },
    {
      title: {
        en: 'American embassy in Iran',

        ar:
          'أزمة رهائن إيران',
        az:
          'İran girov böhranı',
        bn:
          'ইরান জিম্মি সংকট',
        de:
          'Geiselnahme von Teheran',
        fa:
          'تسخیر سفارت آمریکا و روز ملی مبارزه با استکبار جهانی',
      },
      holiday: {},
      year: 1358,
    },
  ],
  p0814: [
    {
      title: {
        en: 'General culture',
        fa:
          'روز فرهنگ عمومی',
      },
      holiday: {},
    },
  ],
  p0815: [
    {
      title: {
        en:
          'Gahambars',

        fa:
          'گاهنبار اَیاثرَم، جشن میانهٔ پاییز',
        fr:
          'Gāhanbār',
      },
      holiday: {},
    },
  ],
  p0818: [
    {
      title: {
        en: "Quality Day",

        fa:
          'روز کیفیت',
      },
      holiday: {},
    },
  ],
  p0824: [
    {
      title: {
        en: 'Book Day',

        fa:
          'روزكتاب، كتابخوانی و كتابدار',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Muhammad Husayn Tabatabai',

        ar:
          'محمد حسين الطباطبائي',
        az:
          'Əllamə Təbatəbai',
        bn:
          'আল্লামা তাবাতাবাঈ',
        de:
          'Allameh Tabatabai',
        es:
          'Alamé Tabatabaí',
        fa:
          'روز بزرگداشت آيت‌الله علامه سيدمحمدحسين طباطبايی',
        fr:
          "Muhammad Husayn Tabataba'i",
        id:
          "Muhammad Husain Thabathaba'i",
      },
      holiday: {},
    },
  ],
  p0826: [
    {
      title: {
        en:
          'Liberation of Susangerd',

        fa:
          'آزادسازی سوسنگرد',
      },
      holiday: {},
    },
  ],
  p0901: [
    {
      title: {
        en: 'Azarjashn',

        fa:
          'آذرجشن',
      },
      holiday: {},
    },
  ],
  p0905: [
    {
      title: {
        en: 'Gorgan uprising',
        fa:
          'سالروز قیام مردم گرگان',
      },
      holiday: {},
      year: 1357,
    },
    {
      title: {
        en:
          'Basij',

        ar:
          'الباسيج',
        az:
          'Bəsic',
        de:
          "Basidsch-e Mostaz'afin",

        fa:
          'تشکیل بسیج مستضعفان',
      },
      holiday: {},
      year: 1358,
    },
  ],
  p0907: [
    {
      title: {
        en:
          'Islamic Republic of Iran Navy',

        ar:
          'القوة البحرية لجيش الجمهورية الإسلامية الإيرانية',
        az:
          'İran Hərbi Dəniz Qüvvələri',

        es:
          'Armada de la República Islámica de Irán',
        fa:
          'روز نیروی دریایی',
        fr:
          "Marine de la république islamique d'Iran",
        id:
          'Angkatan Laut Republik Islam Iran',
        it:
          "Marina militare della Repubblica Islamica dell'Iran",
      },
      holiday: {},
      year: 1359,
    },
  ],
  p0909: [
    {
      title: {
        en:
          'Azar Rouz',

        fa:
          'آذرروز، جشن آذرگان',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Al-Shaykh Al-Mufid',

        ar:
          'الشيخ المفيد',
        az:
          'Şeyx Müfid',
        de:
          'Asch-Schaich al-Mufīd',
        fa:
          'روز بزرگداشت شیخ مفید',
        fr:
          'Cheikh Al-Moufid',
        it:
          'Al-Shaykh al-Mufid',
        ru:
          'Мухаммад аль-Муфид',
      },
      holiday: {},
    },
  ],
  p0910: [
    {
      title: {
        en: 'The Parliament of Iran',

        fa:
          'روز مجلس',
      },
      holiday: {},
      year: 1316,
    },
    {
      title: {
        en:
          'Hassan Modarres',

        ar:
          'حسن المدرس',
        az:
          'Seyid Həsən Müdərris',
        de:
          'Hassan Modarres',
        es:
          'Seyyed Hasán Modarrés',
        fa:
          'شهادت آیت‌الله سید حسن مدرس',
        fr:
          'Hassan Modarres',
        it:
          'Ayatollah Modarres',
        tr:
          'Seyid Hasan Müderris',
      },
      holiday: {},
      year: 1316,
    },
  ],
  p0911: [
    {
      title: {
        en:
          'Mirza Kuchik Khan',

        ar:
          'ميرزا كوجك خان',
        az:
          'Mirzə Kiçik xan',
        de:
          'Mirza Kutschak Khan',
        fa:
          'شهادت میرزا کوچک خان جنگلی',
        fr:
          'Mirza Koutchak Khan',
        pt:
          'Kuchik Khan',
        ru:
          'Мирза Кучек-хан',
      },
      holiday: {},
      year: 1300,
    },
  ],
  p0912: [
    {
      title: {
        en:
          'Constitution of the Islamic Republic of Iran',

        ar:
          'دستور الجمهورية الإسلامية الإيرانية',
        az:
          'İran İslam Respublikasının Konstitusiyası',
        es:
          'Constitución de Irán',
        fa:
          'روز قانون اساسی جمهوری اسلامی ایران (تصویب قانون اساسی جمهوری اسلامی ایران)',
        fr:
          "Constitution de l'Iran",
        ja:
          'イラン・イスラーム共和国憲法',
      },
      holiday: {},
      year: 1358,
    },
  ],
  p0913: [
    {
      title: {
        en: 'Insurance',

        ar:
          'تأمين',
        az:
          'Sığorta',
        fa:
          'روز بیمه',
      },
      holiday: {},
      year: 1358,
    },
  ],
  p0916: [
    {
      title: {
        en:
          'Student Day (Iran)',

        fa:
          'روز دانشجو',
        ru:
          'День студента в Иране',
      },
      holiday: {},
    },
  ],
  p0918: [
    {
      title: {
        en:
          'United Nations Security Council Resolution 598',

        ar:
          'قرار مجلس الأمن التابع للأمم المتحدة رقم 598',
        fa:
          'معرفی عراق به عنوان مسئول و آغازگر جنگ از سوی سازمان ملل',
        id:
          'Resolusi 598 Dewan Keamanan Perserikatan Bangsa-Bangsa',
        nl:
          'Resolutie 598 Veiligheidsraad Verenigde Naties',
      },
      holiday: {},
      year: 1370,
    },
  ],
  p0919: [
    {
      title: {
        en:
          'Supreme Council of the Cultural Revolution',

        fa:
          'تشکیل شورای عالی انقلاب فرهنگی',
        ru:
          'Верховный совет культурной революции',
      },
      holiday: {},
      year: 1363,
    },
  ],
  p0920: [
    {
      title: {
        en:
          'Abdol Hossein Dastgheib',

        ar:
          'عبد الحسين دستغيب',
        fa:
          'شهادت آیت‌الله دستغیب',
        fr:
          'Abdol Hossein Dastgheib',
      },
      holiday: {},
      year: 1360,
    },
  ],
  p0925: [
    {
      title: {
        en: 'Research',

        fa:
          'روز پژوهش',
      },
      holiday: {},
    },
  ],
  p0926: [
    {
      title: {
        en: "Shipping and drivers day",

        fa:
          'روز حمل و نقل و رانندگان',
      },
      holiday: {},
      year: 1376,
    },
  ],
  p0927: [
    {
      title: {
        en:
          'Seminary',

        az:
          'Seminariya',
        de:
          'Theologisches Seminar',

        es:
          'Seminario',
        fa:
          'شهادت آیت‌الله دکتر محمد مفتح و روز وحدت حوزه و دانشگاه',
      },
      holiday: {},
      year: 1358,
    },
  ],
  p0929: [
    {
      title: {
        en:
          'Mohammad Javad Tondguyan',

        fa:
          'روز تجلیل از شهید تندگویان',
      },
      holiday: {},
      year: 1370,
    },
  ],
  p0930: [
    {
      title: {
        en:
          'Yaldā Night',

        ar:
          'شب يلدا',
        az:
          'Çillə gecəsi',
        bn:
          'ইয়ালদা',
        de:
          'Yalda-Nacht',

        fa:
          'شب یلدا (چله)',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Gahambars',

        fa:
          'گاهنبار میدیارِم، جشن میانهٔ سال گاهنباری (از مبدأ آغاز تابستان)',
        fr:
          'Gāhanbār',
      },
      holiday: {},
    },
  ],
  p1001: [
    {
      title: {
        en:
          'Khorram rooz',

        fa:
          'روز میلاد خورشید، جشن خرم‌روز / نخستین جشن دیگان / دیدار طلوع خورشید در تقویم آفتابی چارتاقی نیاسر',
      },
      holiday: {},
    },
  ],
  p1003: [
    {
      title: {
        en: 'National Organization for Civil Registration',

        fa:
          'روز ثبت احوال',
      },
      holiday: {},
    },
  ],
  p1005: [
    {
      title: {
        en: 'Bazarjashn',

        fa:
          'بازارجشن',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Zartosht No-Diso',

        fa:
          'روز درگذشت زرتشت',
        hi:
          'जरथुस्त्रनो',
      },
      holiday: {},
    },
    {
      title: {
        en: 'Natural disaster',

        fa:
          'روز ایمنی در برابر زلزله و کاهش اثرات بلایای طبیعی',
      },
      holiday: {},
      year: 1358,
    },
  ],
  p1007: [
    {
      title: {
        en: 'Hossein Ghaffari',

        fa:
          'شهادت آیت‌الله حسین غفاری',
      },
      holiday: {},
      year: 1353,
    },
    {
      title: {
        en: 'Literacy Movement Organization of Iran',

        fa:
          'تشکیل نهضت سوادآموزی',
      },
      holiday: {},
      year: 1358,
    },
  ],
  p1008: [
    {
      title: {
        en:
          'Zoroastrian festivals',

        de:
          'Liste altiranischer Feste',
        fa:
          'دی‌به‌آذرروز، دومین جشن دیگان',
        fr:
          'Fêtes zoroastriennes',
        pt:
          'Gaambares',
      },
      holiday: {},
    },
    {
      title: {
        en: 'Petrochemistry',

        fa:
          'روز صنعت پتروشیمی',
      },
      holiday: {},
    },
  ],
  p1009: [
    {
      title: {
        en:
          'December 30, 2009 Iranian pro-government rallies',

        ar:
          'مظاهرة 30 ديسمبر 2009 المؤيدة للحكومة في إيران',
        fa:
          'روز بصيرت و ميثاق امت با ولايت',
      },
      holiday: {},
    },
  ],
  p1013: [
    {
      title: {
        en:
          "Khomeini's letter to Mikhail Gorbachev",

        ar:
          'رسالة روح الله الخميني إلى ميخائيل غورباتشوف',
        es:
          'Carta de Jomeini a Mijaíl Gorbachov',
        fa:
          'ابلاغ پیام تاریخی امام خمینی به گورباچف رهبر شوروی سابق',
        fr:
          'Lettre de Sayed Rouhollah Khomeini à Mikhaïl Gorbatchev',
        ru:
          'Письмо Рухолла Мусави Хомейни Михаилу Горбачёву в 1989 году',
      },
      holiday: {},
      year: 1367,
    },
  ],
  p1014: [
    {
      title: {
        en: 'Sirsour',

        fa:
          'سیرسور، جشن گیاه‌خواری',
      },
      holiday: {},
    },
  ],
  p1015: [
    {
      title: {
        en:
          'Zoroastrian festivals',

        de:
          'Liste altiranischer Feste',
        fa:
          'جشن پیکرتراشی / دی‌به‌مهرروز، سومین جشن دیگان',
        fr:
          'Fêtes zoroastriennes',
        pt:
          'Gaambares',
      },
      holiday: {},
    },
  ],
  p1016: [
    {
      title: {
        en: 'Deramazinan',

        fa:
          'جشن درامزینان، جشن درفش‌ها',
      },
      holiday: {},
    },
  ],
  p1017: [
    {
      title: {
        en:
          'Kashf-e hijab',

        ar:
          'كشف الحجاب في إيران',

        fa:
          'اجرای طرح حذف حجاب',
        fr:
          'Kashf-e hijab',
      },
      holiday: {},
      year: 1314,
    },
  ],
  p1019: [
    {
      title: {
        en:
          '1978 Qom protest',
        fa:
          'قیام خونین مردم قم',
      },
      holiday: {},
      year: 1356,
    },
  ],
  p1020: [
    {
      title: {
        en:
          'Amir Kabir',

        ar:
          'ميرزا محمد تقي خان فراهاني',
        az:
          'Mirzə Tağı xan Əmir Kəbir',
        de:
          'Amir Kabir',

        es:
          'Amir Kabir',
        fa:
          'قتل میرزاتقی‌خان امیرکبیر',
        fr:
          'Amir Kabir',
        it:
          'Amir Kabir',
      },
      holiday: {},
      year: 1230,
    },
  ],
  p1022: [
    {
      title: {
        en:
          'Council of the Islamic Revolution',

        ar:
          'مجلس الثورة الإسلامية',
        de:
          'Islamischer Revolutionsrat',

        es:
          'Consejo de la Revolución Islámica',
        fa:
          'تشکیل شورای انقلاب',
        ja:
          'イスラーム革命評議会',
        ru:
          'Совет Исламской революции',
      },
      holiday: {},
      year: 1357,
    },
  ],
  p1023: [
    {
      title: {
        en:
          'Zoroastrian festivals',

        de:
          'Liste altiranischer Feste',

        fa:
          'دی‌به‌دین‌روز، چهارمین جشن دیگان',
        fr:
          'Fêtes zoroastriennes',
        pt:
          'Gaambares',
      },
      holiday: {},
    },
  ],
  p1026: [
    {
      title: {
        en: 'Mohammad Reza Pahlavi',

        ar:
          'محمد رضا بهلوي',
        az:
          'Məhəmməd Rza Pəhləvi',
        bn:
          'মোহাম্মদ রেজা পাহলভি',
        fa:
          'خروج شاه از ایران',
      },
      holiday: {},
      year: 1357,
    },
  ],
  p1027: [
    {
      title: {
        en: 'Navvab Safavi',

        fa:
          'شهادت نواب صفوی، طهماسبی، برادران واحدی و ذوالقدر از اعضای فداییان اسلام',
      },
      holiday: {},
      year: 1334,
    },
  ],
  p1029: [
    {
      title: {
        en: 'Gaza',

        fa:
          'روز غزه',
      },
      holiday: {},
    },
  ],
  p1101: [
    {
      title: {
        en: 'Ferdowsi',

        ar:
          'أبو قاسم الفردوسي',
        az:
          'Firdovsi',
        fa:
          'زادروز فردوسی',
      },
      holiday: {},
    },
  ],
  p1102: [
    {
      title: {
        en: 'Bahmanrouz',

        fa:
          'بهمن‌روز، جشن بهمنگان',
      },
      holiday: {},
    },
  ],
  p1105: [
    {
      title: {
        en: 'Nosareh',

        fa:
          'جشن نوسَره',
      },
      holiday: {},
    },
    {
      title: {
        en:
          '1980 Iranian presidential election',

        ar:
          'انتخابات إيران الرئاسية 1980',
        de:
          'Präsidentschaftswahl im Iran 1980',

        es:
          'Elecciones presidenciales de Irán de 1980',
        fa:
          'انتخابات اولین دورهٔ ریاست جمهوری',
        it:
          'Elezioni presidenziali in Iran del 1980',
        ru:
          'Президентские выборы в Иране (1980)',
        tr:
          '1980 İran cumhurbaşkanlığı seçimleri',
      },
      holiday: {},
      year: 1358,
    },
  ],
  p1106: [
    {
      title: {
        en:
          'White Revolution',

        ar:
          'ثورة بيضاء',
        az:
          'Ağ inqilab',
        de:
          'Weiße Revolution',

        es:
          'Revolución Blanca (Irán)',
        fa:
          'انقلاب سفید',
        fr:
          'Révolution blanche',
        hi:
          'इंक़िलाब-ए-सफ़ेद',
        id:
          'Revolusi Putih',
      },
      holiday: {},
      year: 1341,
    },
    {
      title: {
        en:
          '1982 Amol uprising',
        fa:
          'حماسه مردم آمل',
        zh:
          '1982年阿莫勒起义',
      },
      holiday: {},
      year: 1360,
    },
  ],
  p1110: [
    {
      title: {
        en:
          'Sadeh',

        de:
          'Sadeh-Fest',
        fa:
          'آبان‌روز، جشن سَدَه',
        fr:
          'Sadeh',
        ko:
          '사데',
      },
      holiday: {},
    },
  ],
  p1112: [
    {
      title: {
        en:
          "Ruhollah Khomeini's return to Iran",

        es:
          'Regreso del Imam Jomeini a Irán',
        fa:
          'بازگشت آیت‌الله خمینی به ایران',
        ru:
          'Возвращение Хомейни в Иран',
      },
      holiday: {},
      year: 1357,
    },
    {
      title: {
        en:
          'Fajr decade',

        ar:
          'عشرة الفجر',

        es:
          'Década de Fajr',
        fa:
          'آغاز دهه فجر',
        fr:
          'Décade de Fajr',
        ru:
          'Дахе-е фаджр',
      },
      holiday: {},
      year: 1357,
    },
  ],
  p1114: [
    {
      title: {
        en: 'Space technology',

        fa:
          'روز ملی فناوری فضایی',
        ru:
          'Национальный день космических технологий в Иране',
      },
      holiday: {},
      year: 1387,
    },
  ],
  p1115: [
    {
      title: {
        en: 'Mianeh',

        fa:
          'جشن میانهٔ زمستان',
      },
      holiday: {},
    },
  ],
  p1116: [
    {
      title: {
        en:
          'Mehdi Bazargan',

        ar:
          'مهدي بازركان',
        az:
          'Mehdi Bazərgan',
        de:
          'Mehdi Bāzargān',
        es:
          'Mehdí Bazargán',
        fa:
          'انتخاب مهدی بازرگان به نخست‌وزیری انقلاب',
        fr:
          'Mehdi Bazargan',
      },
      holiday: {},
      year: 1357,
    },
  ],
  p1119: [
    {
      title: {
        en:
          'Islamic Republic of Iran Air Force',

        ar:
          'القوات الجوية لجيش الجمهورية الإسلامية الإيرانية',
        az:
          'İran Hərbi Hava Qüvvələri',
        de:
          'Iranische Luftwaffe',
        es:
          'Fuerza Aérea de la República Islámica de Irán',
        fa:
          'روز نیروی هوایی',
        fr:
          "Force aérienne de la République islamique d'Iran",
        it:
          'Niru-ye Havayi-ye Artesh-e Jomhuri-ye Eslami-e Iran',
      },
      holiday: {},
      year: 1357,
    },
  ],
  p1121: [
    {
      title: {
        en:
          'Fajr decade',

        ar:
          'عشرة الفجر',
        es:
          'Década de Fajr',
        fa:
          'شکسته شدن حکومت نظامی به فرمان امام خمینی',
        fr:
          'Décade de Fajr',
        ru:
          'Дахе-е фаджр',
      },
      holiday: {},
      year: 1357,
    },
  ],
  p1122: [
    {
      title: {
        en: 'Badrouz',

        fa:
          'بادروز، جشن بادروزی',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Fajr decade',

        ar:
          'عشرة الفجر',
        es:
          'Década de Fajr',
        fa:
          'پیروزی انقلاب اسلامی ایران و سقوط نظام شاهنشاهی',
        fr:
          'Décade de Fajr',
        ru:
          'Дахе-е фаджр',
      },
      holiday: {
        IR: true,
      },
      year: 1357,
    },
  ],
  p1125: [
    {
      title: {
        en: 'Salman Rushdie',

        ar:
          'سلمان رشدي',
        az:
          'Salman Rüşdi',
        fa:
          'صدور حکم امام خمینی مبنی بر ارتداد سلمان رشدی',
      },
      holiday: {},
      year: 1367,
    },
  ],
  p1129: [
    {
      title: {
        en: 'Sepandarmazgan',

        fa:
          'جشن سپندارمذگان',
      },
      holiday: {},
    },
    {
      title: {
        en: 'The Uprising By the People of Tabriz On February 18, 1978',

        fa:
          'قیام مردم تبریز',
      },
      holiday: {},
      year: 1356,
    },
  ],
  p1201: [
    {
      title: {
        en: 'Esfandi',

        fa:
          'جشن اسفندی / جشن آبسالان، بهارجشن / نمایش‌بازی همگانی',
      },
      holiday: {},
    },
  ],
  p1203: [
    {
      title: {
        en:
          "1921 Persian coup d'état",

        ar:
          'انقلاب 1921 في إيران',
        de:
          'Putsch vom 21. Februar 1921',
        fa:
          'کودتای رضاخان',
        fr:
          "Coup d'État du 21 février 1921",
        pt:
          'Golpe de Estado na Pérsia em 1921',
        ru:
          'Государственный переворот в Персии (1921)',
        tr:
          '1921 İran darbesi',
      },
      holiday: {},
      year: 1299,
    },
  ],
  p1205: [
    {
      title: {
        en: 'Esfandrouz',

        fa:
          'اسفندروز، جشن اسفندگان، گرامیداشت زمین و بانوان / جشن برزگران',
      },
      holiday: {},
    },
    {
      title: {
        en:
          "Engineer's Day",

        ar:
          'يوم المهندس',
        bn:
          'প্রকৌশলী দিবস',
        fa:
          'روز بزرگداشت خواجه نصیر الدین طوسی و روز مهندس',
        hi:
          'अभियन्ता दिवस',
        id:
          'Hari Teknisi',
        zh:
          '工程師節',
      },
      holiday: {},
    },
  ],
  p1207: [
    {
      title: {
        en: 'Lawyers Day',

        fa:
          'سالروز استقلال کانون وکلای دادگستری و روز وکیل مدافع',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Ali-Akbar Dehkhoda',

        ar:
          'علي أكبر دهخدا',
        az:
          'Mirzə Əliəkbər Dehxuda',
        de:
          'Ali Akbar Dehchoda',
        es:
          'Alí Akbar Dehjodá',
        fa:
          'سالروز درگذشت علی اکبر دهخدا',
        fr:
          'Ali Akbar Dehkhoda',
      },
      holiday: {},
      year: 1334,
    },
  ],
  p1208: [
    {
      title: {
        en: 'Educational Affairs Day',

        fa:
          'روز امور تربیتی و تربیت اسلامی',
      },
      holiday: {},
    },
  ],
  p1209: [
    {
      title: {
        en:
          'Consumer protection',

        ar:
          'قانون حماية المستهلك',
        de:
          'Verbraucherschutz',
        es:
          'Derecho del consumo',
        fa:
          'روز ملی حمایت از حقوق مصرف‌کنندگان',
      },
      holiday: {},
    },
  ],
  p1210: [
    {
      title: {
        en: 'Vakhshnam',

        fa:
          'جشن وخشنکام',
      },
      holiday: {},
    },
  ],
  p1214: [
    {
      title: {
        en:
          'Imam Khomeini Relief Foundation',

        fa:
          'روز احسان و نیکوکاری و روز تأسیس کمیته امداد امام خمینی',
      },
      holiday: {},
      year: 1357,
    },
  ],
  p1215: [
    {
      title: {
        en:
          'Arbor Day',

        ar:
          'يوم الشجرة',
        az:
          'Ağac əkilməsi günü',
        de:
          'Tag des Baumes',
        fa:
          'روز درختکاری',
      },
      holiday: {},
    },
  ],
  p1218: [
    {
      title: {
        en: 'Iranian Mosque',

        fa:
          'سالروز تأسیس کانون‌های فرهنگی و هنری مساجد کشور',
      },
      holiday: {},
    },
    {
      title: {
        en: 'Jamāl al-Dīn al-Afghānī',

        ar:
          'جمال الدين الأفغاني',
        az:
          'Cəmaləddin Əfqani',
        bn:
          'জামাল উদ্দিন আফগানি',
        de:
          'Dschamal ad-Din al-Afghani',
        fa:
          'روز بزرگداشت سید جمال‌الدین اسدآبادی',
      },
      holiday: {},
      year: 1275,
    },
  ],
  p1219: [
    {
      title: {
        en: 'Norouz Roudha',

        fa:
          'جشن نوروز رودها',
      },
      holiday: {},
    },
  ],
  p1220: [
    {
      title: {
        en:
          'Rahian-e Noor',

        fa:
          'روز راهیان نور',
        fr:
          'Rahian-e Noor',
        zh:
          '光之路者',
      },
      holiday: {},
    },
    {
      title: {
        en: 'Flower pot',
        fa:
          'جشن گلدان',
      },
      holiday: {},
    },
  ],
  p1221: [
    {
      title: {
        en: 'Nizami Ganjavi',

        ar:
          'نظامي الكنجوي',
        az:
          'Nizami Gəncəvi',
        fa:
          'روز بزرگداشت نظامی گنجوی',
      },
      holiday: {},
    },
  ],
  p1222: [
    {
      title: {
        en: 'Foundation of Martyrs and Veterans Affairs',

        fa:
          'روز بزرگداشت شهدا (تأسیس بنیاد شهید انقلاب اسلامی)',
      },
      holiday: {},
      year: 1358,
    },
  ],
  p1224: [
    {
      title: {
        en: 'The Parliament of Iran',

        fa:
          'برگزاری انتخابات اولین دورهٔ مجلس شورای اسلامی',
      },
      holiday: {},
      year: 1358,
    },
  ],
  p1225: [
    {
      title: {
        en: 'Shahnameh',

        ar:
          'الشاهنامه',
        az:
          'Şahnamə',
        fa:
          'هزارهٔ شاهنامه، هزارمین سالگرد پایان سرایش شاهنامهٔ فردوسی',
      },
      holiday: {},
    },
    {
      title: {
        en:
          "Parvin E'tesami",

        ar:
          'بروين اعتصامي',
        az:
          'Pərvin Etisami',
        de:
          "Parvin E'tesami",
        fa:
          'روز بزرگداشت پروین اعتصامی',
        fr:
          "Parvin E'tesami",
        ja:
          'パルヴィーン・エーテサーミー',
      },
      holiday: {},
      year: 1320,
    },
    {
      title: {
        en:
          'Halabja chemical attack',

        ar:
          'الهجوم الكيميائي على حلبجة',
        az:
          'Hələbcə şəhərinə zəhərli qaz hücumu',
        de:
          'Giftgasangriff auf Halabdscha',
        fa:
          'بمباران شیمیایی حلبچه توسط ارتش بعث عراق',
      },
      holiday: {},
      year: 1366,
    },
  ],
  p1226: [
    {
      title: {
        en: 'Farvardgan',

        fa:
          'فروردگان',
      },
      holiday: {},
    },
  ],
  p1229: [
    {
      title: {
        en: 'End of winter',

        fa:
          'گاهنبار هَمَسپَتمَدَم، جشن پایان زمستان (در آخرین روز سال) / جشن اوشیدر (نجات‌بخش ایرانی) در دریاچهٔ هامون و کوه خواجه / آتش‌افروزی بر بام‌ها در استقبال از نوروز',
      },
      holiday: {},
    },
    {
      title: {
        en:
          'Nationalization of the Iranian oil industry',

        ar:
          'حركة تأميم صناعة النفط في إيران 1951',
        de:
          'Zeittafel zur Verstaatlichung der iranischen Ölindustrie',
        fa:
          'روز ملی شدن صنعت نفت ایران',
        fr:
          "Chronologie de la nationalisation de l'industrie pétrolière iranienne",
        ru:
          'Национализация нефтяной промышленности Ирана',
      },
      holiday: {
        IR: true,
      },
      year: 1329,
    },
  ],
};

},{}],28:[function(require,module,exports){
module.exports = [
  'ar',
  'az',
  'bn',
  'de',
  'en',
  'es',
  'fa',
  'fr',
  'hi',
  'id',
  'it',
  'ja',
  'ko',
  'ku',
  'nl',
  'pl',
  'ps',
  'pt',
  'ru',
  'sw',
  'tr',
  'ur',
  'zh',
];

},{}],29:[function(require,module,exports){
module.exports = {
  AE: ['g', 'i'],
  AF: ['p', 'g', 'i'],
  BH: ['g', 'i'],
  CN: ['g'],
  CX: ['g'],
  DJ: ['g', 'i'],
  DZ: ['g', 'i'],
  EG: ['g', 'i'],
  EH: ['g', 'i'],
  ER: ['g', 'i'],
  ET: ['g'],
  HK: ['g'],
  IL: ['g', 'i'],
  IN: ['g'],
  IQ: ['g', 'i'],
  IR: ['p', 'g', 'i'],
  JO: ['g', 'i'],
  JP: ['g'],
  KM: ['g', 'i'],
  KR: ['g'],
  KW: ['g', 'i'],
  LB: ['g', 'i'],
  LY: ['g', 'i'],
  MA: ['g', 'i'],
  MO: ['g'],
  MR: ['g', 'i'],
  OM: ['g', 'i'],
  PS: ['g', 'i'],
  QA: ['g', 'i'],
  SA: ['i', 'g'],
  SD: ['g', 'i'],
  SG: ['g'],
  SY: ['g', 'i'],
  TD: ['g', 'i'],
  TH: ['g'],
  TN: ['g', 'i'],
  TW: ['g'],
  YE: ['g', 'i'],
};

},{}],30:[function(require,module,exports){
module.exports = {
  AD: [1, 2, 3, 4, 5, 6, 0],
  AE: [6, 0, 1, 2, 3, 4, 5],
  AF: [6, 0, 1, 2, 3, 4, 5],
  AG: [0, 1, 2, 3, 4, 5, 6],
  AI: [1, 2, 3, 4, 5, 6, 0],
  AL: [1, 2, 3, 4, 5, 6, 0],
  AM: [1, 2, 3, 4, 5, 6, 0],
  AN: [1, 2, 3, 4, 5, 6, 0],
  AR: [1, 2, 3, 4, 5, 6, 0],
  AS: [0, 1, 2, 3, 4, 5, 6],
  AT: [1, 2, 3, 4, 5, 6, 0],
  AU: [0, 1, 2, 3, 4, 5, 6],
  AX: [1, 2, 3, 4, 5, 6, 0],
  AZ: [1, 2, 3, 4, 5, 6, 0],
  BA: [1, 2, 3, 4, 5, 6, 0],
  BD: [0, 1, 2, 3, 4, 5, 6],
  BE: [1, 2, 3, 4, 5, 6, 0],
  BG: [1, 2, 3, 4, 5, 6, 0],
  BH: [6, 0, 1, 2, 3, 4, 5],
  BM: [1, 2, 3, 4, 5, 6, 0],
  BN: [1, 2, 3, 4, 5, 6, 0],
  BR: [0, 1, 2, 3, 4, 5, 6],
  BS: [0, 1, 2, 3, 4, 5, 6],
  BT: [0, 1, 2, 3, 4, 5, 6],
  BW: [0, 1, 2, 3, 4, 5, 6],
  BY: [1, 2, 3, 4, 5, 6, 0],
  BZ: [0, 1, 2, 3, 4, 5, 6],
  CA: [0, 1, 2, 3, 4, 5, 6],
  CH: [1, 2, 3, 4, 5, 6, 0],
  CL: [1, 2, 3, 4, 5, 6, 0],
  CM: [1, 2, 3, 4, 5, 6, 0],
  CN: [0, 1, 2, 3, 4, 5, 6],
  CO: [0, 1, 2, 3, 4, 5, 6],
  CR: [1, 2, 3, 4, 5, 6, 0],
  CY: [1, 2, 3, 4, 5, 6, 0],
  CZ: [1, 2, 3, 4, 5, 6, 0],
  DE: [1, 2, 3, 4, 5, 6, 0],
  DJ: [6, 0, 1, 2, 3, 4, 5],
  DK: [1, 2, 3, 4, 5, 6, 0],
  DM: [0, 1, 2, 3, 4, 5, 6],
  DO: [0, 1, 2, 3, 4, 5, 6],
  DZ: [6, 0, 1, 2, 3, 4, 5],
  EC: [1, 2, 3, 4, 5, 6, 0],
  EE: [1, 2, 3, 4, 5, 6, 0],
  EG: [6, 0, 1, 2, 3, 4, 5],
  ES: [1, 2, 3, 4, 5, 6, 0],
  ET: [0, 1, 2, 3, 4, 5, 6],
  FI: [1, 2, 3, 4, 5, 6, 0],
  FJ: [1, 2, 3, 4, 5, 6, 0],
  FO: [1, 2, 3, 4, 5, 6, 0],
  FR: [1, 2, 3, 4, 5, 6, 0],
  GB: [1, 2, 3, 4, 5, 6, 0],
  GE: [1, 2, 3, 4, 5, 6, 0],
  GF: [1, 2, 3, 4, 5, 6, 0],
  GP: [1, 2, 3, 4, 5, 6, 0],
  GR: [1, 2, 3, 4, 5, 6, 0],
  GT: [0, 1, 2, 3, 4, 5, 6],
  GU: [0, 1, 2, 3, 4, 5, 6],
  HK: [0, 1, 2, 3, 4, 5, 6],
  HN: [0, 1, 2, 3, 4, 5, 6],
  HR: [1, 2, 3, 4, 5, 6, 0],
  HU: [1, 2, 3, 4, 5, 6, 0],
  ID: [0, 1, 2, 3, 4, 5, 6],
  IE: [1, 2, 3, 4, 5, 6, 0],
  IL: [0, 1, 2, 3, 4, 5, 6],
  IN: [0, 1, 2, 3, 4, 5, 6],
  IQ: [6, 0, 1, 2, 3, 4, 5],
  IR: [6, 0, 1, 2, 3, 4, 5],
  IS: [1, 2, 3, 4, 5, 6, 0],
  IT: [1, 2, 3, 4, 5, 6, 0],
  JM: [0, 1, 2, 3, 4, 5, 6],
  JO: [6, 0, 1, 2, 3, 4, 5],
  JP: [0, 1, 2, 3, 4, 5, 6],
  KE: [0, 1, 2, 3, 4, 5, 6],
  KG: [1, 2, 3, 4, 5, 6, 0],
  KH: [0, 1, 2, 3, 4, 5, 6],
  KR: [0, 1, 2, 3, 4, 5, 6],
  KW: [6, 0, 1, 2, 3, 4, 5],
  KZ: [1, 2, 3, 4, 5, 6, 0],
  LA: [0, 1, 2, 3, 4, 5, 6],
  LB: [1, 2, 3, 4, 5, 6, 0],
  LI: [1, 2, 3, 4, 5, 6, 0],
  LK: [1, 2, 3, 4, 5, 6, 0],
  LT: [1, 2, 3, 4, 5, 6, 0],
  LU: [1, 2, 3, 4, 5, 6, 0],
  LV: [1, 2, 3, 4, 5, 6, 0],
  LY: [6, 0, 1, 2, 3, 4, 5],
  MC: [1, 2, 3, 4, 5, 6, 0],
  MD: [1, 2, 3, 4, 5, 6, 0],
  ME: [1, 2, 3, 4, 5, 6, 0],
  MH: [0, 1, 2, 3, 4, 5, 6],
  MK: [1, 2, 3, 4, 5, 6, 0],
  MM: [0, 1, 2, 3, 4, 5, 6],
  MN: [1, 2, 3, 4, 5, 6, 0],
  MO: [0, 1, 2, 3, 4, 5, 6],
  MQ: [1, 2, 3, 4, 5, 6, 0],
  MT: [0, 1, 2, 3, 4, 5, 6],
  MV: [5, 6, 0, 1, 2, 3, 4],
  MX: [0, 1, 2, 3, 4, 5, 6],
  MY: [1, 2, 3, 4, 5, 6, 0],
  MZ: [0, 1, 2, 3, 4, 5, 6],
  NI: [0, 1, 2, 3, 4, 5, 6],
  NL: [1, 2, 3, 4, 5, 6, 0],
  NO: [1, 2, 3, 4, 5, 6, 0],
  NP: [0, 1, 2, 3, 4, 5, 6],
  NZ: [1, 2, 3, 4, 5, 6, 0],
  OM: [6, 0, 1, 2, 3, 4, 5],
  PA: [0, 1, 2, 3, 4, 5, 6],
  PE: [0, 1, 2, 3, 4, 5, 6],
  PH: [0, 1, 2, 3, 4, 5, 6],
  PK: [0, 1, 2, 3, 4, 5, 6],
  PL: [1, 2, 3, 4, 5, 6, 0],
  PR: [0, 1, 2, 3, 4, 5, 6],
  PT: [0, 1, 2, 3, 4, 5, 6],
  PY: [0, 1, 2, 3, 4, 5, 6],
  QA: [6, 0, 1, 2, 3, 4, 5],
  RE: [1, 2, 3, 4, 5, 6, 0],
  RO: [1, 2, 3, 4, 5, 6, 0],
  RS: [1, 2, 3, 4, 5, 6, 0],
  RU: [1, 2, 3, 4, 5, 6, 0],
  SA: [0, 1, 2, 3, 4, 5, 6],
  SD: [6, 0, 1, 2, 3, 4, 5],
  SE: [1, 2, 3, 4, 5, 6, 0],
  SG: [0, 1, 2, 3, 4, 5, 6],
  SI: [1, 2, 3, 4, 5, 6, 0],
  SK: [1, 2, 3, 4, 5, 6, 0],
  SM: [1, 2, 3, 4, 5, 6, 0],
  SV: [0, 1, 2, 3, 4, 5, 6],
  SY: [6, 0, 1, 2, 3, 4, 5],
  TH: [0, 1, 2, 3, 4, 5, 6],
  TJ: [1, 2, 3, 4, 5, 6, 0],
  TM: [1, 2, 3, 4, 5, 6, 0],
  TR: [1, 2, 3, 4, 5, 6, 0],
  TT: [0, 1, 2, 3, 4, 5, 6],
  TW: [0, 1, 2, 3, 4, 5, 6],
  UA: [1, 2, 3, 4, 5, 6, 0],
  UM: [0, 1, 2, 3, 4, 5, 6],
  US: [0, 1, 2, 3, 4, 5, 6],
  UY: [1, 2, 3, 4, 5, 6, 0],
  UZ: [1, 2, 3, 4, 5, 6, 0],
  VA: [1, 2, 3, 4, 5, 6, 0],
  VE: [0, 1, 2, 3, 4, 5, 6],
  VI: [0, 1, 2, 3, 4, 5, 6],
  VN: [1, 2, 3, 4, 5, 6, 0],
  WS: [0, 1, 2, 3, 4, 5, 6],
  XK: [1, 2, 3, 4, 5, 6, 0],
  YE: [0, 1, 2, 3, 4, 5, 6],
  ZA: [0, 1, 2, 3, 4, 5, 6],
  ZW: [0, 1, 2, 3, 4, 5, 6],
};

},{}],31:[function(require,module,exports){
module.exports = {
  AE: [5, 6],
  AF: [4, 5],
  BH: [5, 6],
  DZ: [5, 6],
  EG: [5, 6],
  IL: [5, 6],
  IN: [0],
  IQ: [5, 6],
  IR: [5],
  JO: [5, 6],
  KW: [5, 6],
  LY: [5, 6],
  OM: [5, 6],
  QA: [5, 6],
  SA: [5, 6],
  SD: [5, 6],
  SY: [5, 6],
  UG: [0],
  YE: [5, 6],
};

},{}],32:[function(require,module,exports){
/*
  Expose functions.
*/
module.exports =
  { toJalaali: toJalaali
  , toGregorian: toGregorian
  , isValidJalaaliDate: isValidJalaaliDate
  , isLeapJalaaliYear: isLeapJalaaliYear
  , jalaaliMonthLength: jalaaliMonthLength
  , jalCal: jalCal
  , j2d: j2d
  , d2j: d2j
  , g2d: g2d
  , d2g: d2g
  }

/*
  Converts a Gregorian date to Jalaali.
*/
function toJalaali(gy, gm, gd) {
  if (Object.prototype.toString.call(gy) === '[object Date]') {
    gd = gy.getDate()
    gm = gy.getMonth() + 1
    gy = gy.getFullYear()
  }
  return d2j(g2d(gy, gm, gd))
}

/*
  Converts a Jalaali date to Gregorian.
*/
function toGregorian(jy, jm, jd) {
  return d2g(j2d(jy, jm, jd))
}

/*
  Checks whether a Jalaali date is valid or not.
*/
function isValidJalaaliDate(jy, jm, jd) {
  return  jy >= -61 && jy <= 3177 &&
          jm >= 1 && jm <= 12 &&
          jd >= 1 && jd <= jalaaliMonthLength(jy, jm)
}

/*
  Is this a leap year or not?
*/
function isLeapJalaaliYear(jy) {
  return jalCal(jy).leap === 0
}

/*
  Number of days in a given month in a Jalaali year.
*/
function jalaaliMonthLength(jy, jm) {
  if (jm <= 6) return 31
  if (jm <= 11) return 30
  if (isLeapJalaaliYear(jy)) return 30
  return 29
}

/*
  This function determines if the Jalaali (Persian) year is
  leap (366-day long) or is the common year (365 days), and
  finds the day in March (Gregorian calendar) of the first
  day of the Jalaali year (jy).

  @param jy Jalaali calendar year (-61 to 3177)
  @return
    leap: number of years since the last leap year (0 to 4)
    gy: Gregorian year of the beginning of Jalaali year
    march: the March day of Farvardin the 1st (1st day of jy)
  @see: http://www.astro.uni.torun.pl/~kb/Papers/EMP/PersianC-EMP.htm
  @see: http://www.fourmilab.ch/documents/calendar/
*/
function jalCal(jy) {
  // Jalaali years starting the 33-year rule.
  var breaks =  [ -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210
                , 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
                ]
    , bl = breaks.length
    , gy = jy + 621
    , leapJ = -14
    , jp = breaks[0]
    , jm
    , jump
    , leap
    , leapG
    , march
    , n
    , i

  if (jy < jp || jy >= breaks[bl - 1])
    throw new Error('Invalid Jalaali year ' + jy)

  // Find the limiting years for the Jalaali year jy.
  for (i = 1; i < bl; i += 1) {
    jm = breaks[i]
    jump = jm - jp
    if (jy < jm)
      break
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4)
    jp = jm
  }
  n = jy - jp

  // Find the number of leap years from AD 621 to the beginning
  // of the current Jalaali year in the Persian calendar.
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
  if (mod(jump, 33) === 4 && jump - n === 4)
    leapJ += 1

  // And the same in the Gregorian calendar (until the year gy).
  leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150

  // Determine the Gregorian date of Farvardin the 1st.
  march = 20 + leapJ - leapG

  // Find how many years have passed since the last leap year.
  if (jump - n < 6)
    n = n - jump + div(jump + 4, 33) * 33
  leap = mod(mod(n + 1, 33) - 1, 4)
  if (leap === -1) {
    leap = 4
  }

  return  { leap: leap
          , gy: gy
          , march: march
          }
}

/*
  Converts a date of the Jalaali calendar to the Julian Day number.

  @param jy Jalaali year (1 to 3100)
  @param jm Jalaali month (1 to 12)
  @param jd Jalaali day (1 to 29/31)
  @return Julian Day number
*/
function j2d(jy, jm, jd) {
  var r = jalCal(jy)
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
}

/*
  Converts the Julian Day number to a date in the Jalaali calendar.

  @param jdn Julian Day number
  @return
    jy: Jalaali year (1 to 3100)
    jm: Jalaali month (1 to 12)
    jd: Jalaali day (1 to 29/31)
*/
function d2j(jdn) {
  var gy = d2g(jdn).gy // Calculate Gregorian year (gy).
    , jy = gy - 621
    , r = jalCal(jy)
    , jdn1f = g2d(gy, 3, r.march)
    , jd
    , jm
    , k

  // Find number of days that passed since 1 Farvardin.
  k = jdn - jdn1f
  if (k >= 0) {
    if (k <= 185) {
      // The first 6 months.
      jm = 1 + div(k, 31)
      jd = mod(k, 31) + 1
      return  { jy: jy
              , jm: jm
              , jd: jd
              }
    } else {
      // The remaining months.
      k -= 186
    }
  } else {
    // Previous Jalaali year.
    jy -= 1
    k += 179
    if (r.leap === 1)
      k += 1
  }
  jm = 7 + div(k, 30)
  jd = mod(k, 30) + 1
  return  { jy: jy
          , jm: jm
          , jd: jd
          }
}

/*
  Calculates the Julian Day number from Gregorian or Julian
  calendar dates. This integer number corresponds to the noon of
  the date (i.e. 12 hours of Universal Time).
  The procedure was tested to be good since 1 March, -100100 (of both
  calendars) up to a few million years into the future.

  @param gy Calendar year (years BC numbered 0, -1, -2, ...)
  @param gm Calendar month (1 to 12)
  @param gd Calendar day of the month (1 to 28/29/30/31)
  @return Julian Day number
*/
function g2d(gy, gm, gd) {
  var d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
      + div(153 * mod(gm + 9, 12) + 2, 5)
      + gd - 34840408
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752
  return d
}

/*
  Calculates Gregorian and Julian calendar dates from the Julian Day number
  (jdn) for the period since jdn=-34839655 (i.e. the year -100100 of both
  calendars) to some millions years ahead of the present.

  @param jdn Julian Day number
  @return
    gy: Calendar year (years BC numbered 0, -1, -2, ...)
    gm: Calendar month (1 to 12)
    gd: Calendar day of the month M (1 to 28/29/30/31)
*/
function d2g(jdn) {
  var j
    , i
    , gd
    , gm
    , gy
  j = 4 * jdn + 139361631
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
  i = div(mod(j, 1461), 4) * 5 + 308
  gd = div(mod(i, 153), 5) + 1
  gm = mod(div(i, 153), 12) + 1
  gy = div(j, 1461) - 100100 + div(8 - gm, 6)
  return  { gy: gy
          , gm: gm
          , gd: gd
          }
}

/*
  Utility helper functions.
*/

function div(a, b) {
  return ~~(a / b)
}

function mod(a, b) {
  return a - ~~(a / b) * b
}

},{}],33:[function(require,module,exports){
(function (global){
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used to compose bitmasks for comparison styles. */
var UNORDERED_COMPARE_FLAG = 1,
    PARTIAL_COMPARE_FLAG = 2;

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0,
    MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    promiseTag = '[object Promise]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/,
    reLeadingDot = /^\./,
    rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    return freeProcess && freeProcess.binding('util');
  } catch (e) {}
}());

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

/**
 * A specialized version of `baseAggregator` for arrays.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} setter The function to set `accumulator` values.
 * @param {Function} iteratee The iteratee to transform keys.
 * @param {Object} accumulator The initial aggregated object.
 * @returns {Function} Returns `accumulator`.
 */
function arrayAggregator(array, setter, iteratee, accumulator) {
  var index = -1,
      length = array ? array.length : 0;

  while (++index < length) {
    var value = array[index];
    setter(accumulator, value, iteratee(value), array);
  }
  return accumulator;
}

/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array ? array.length : 0;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */
function isHostObject(value) {
  // Many host objects are `Object` objects that can coerce to strings
  // despite having improperly defined `toString` methods.
  var result = false;
  if (value != null && typeof value.toString != 'function') {
    try {
      result = !!(value + '');
    } catch (e) {}
  }
  return result;
}

/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
  var index = -1,
      result = Array(map.size);

  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype,
    funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/** Built-in value references. */
var Symbol = root.Symbol,
    Uint8Array = root.Uint8Array,
    propertyIsEnumerable = objectProto.propertyIsEnumerable,
    splice = arrayProto.splice;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = overArg(Object.keys, Object);

/* Built-in method references that are verified to be native. */
var DataView = getNative(root, 'DataView'),
    Map = getNative(root, 'Map'),
    Promise = getNative(root, 'Promise'),
    Set = getNative(root, 'Set'),
    WeakMap = getNative(root, 'WeakMap'),
    nativeCreate = getNative(Object, 'create');

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = toSource(DataView),
    mapCtorString = toSource(Map),
    promiseCtorString = toSource(Promise),
    setCtorString = toSource(Set),
    weakMapCtorString = toSource(WeakMap);

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  return this.has(key) && delete this.__data__[key];
}

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
}

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
}

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  return getMapData(this, key)['delete'](key);
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  getMapData(this, key).set(key, value);
  return this;
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var index = -1,
      length = values ? values.length : 0;

  this.__data__ = new MapCache;
  while (++index < length) {
    this.add(values[index]);
  }
}

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED);
  return this;
}

/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
SetCache.prototype.has = setCacheHas;

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  this.__data__ = new ListCache(entries);
}

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new ListCache;
}

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  return this.__data__['delete'](key);
}

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var cache = this.__data__;
  if (cache instanceof ListCache) {
    var pairs = cache.__data__;
    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      return this;
    }
    cache = this.__data__ = new MapCache(pairs);
  }
  cache.set(key, value);
  return this;
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  // Safari 9 makes `arguments.length` enumerable in strict mode.
  var result = (isArray(value) || isArguments(value))
    ? baseTimes(value.length, String)
    : [];

  var length = result.length,
      skipIndexes = !!length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) &&
        !(skipIndexes && (key == 'length' || isIndex(key, length)))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/**
 * Aggregates elements of `collection` on `accumulator` with keys transformed
 * by `iteratee` and values set by `setter`.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} setter The function to set `accumulator` values.
 * @param {Function} iteratee The iteratee to transform keys.
 * @param {Object} accumulator The initial aggregated object.
 * @returns {Function} Returns `accumulator`.
 */
function baseAggregator(collection, setter, iteratee, accumulator) {
  baseEach(collection, function(value, key, collection) {
    setter(accumulator, value, iteratee(value), collection);
  });
  return accumulator;
}

/**
 * The base implementation of `_.forEach` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 */
var baseEach = createBaseEach(baseForOwn);

/**
 * The base implementation of `baseForOwn` which iterates over `object`
 * properties returned by `keysFunc` and invokes `iteratee` for each property.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

/**
 * The base implementation of `_.forOwn` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return object && baseFor(object, iteratee, keys);
}

/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path) {
  path = isKey(path, object) ? [path] : castPath(path);

  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[toKey(path[index++])];
  }
  return (index && index == length) ? object : undefined;
}

/**
 * The base implementation of `getTag`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  return objectToString.call(value);
}

/**
 * The base implementation of `_.hasIn` without support for deep paths.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {Array|string} key The key to check.
 * @returns {boolean} Returns `true` if `key` exists, else `false`.
 */
function baseHasIn(object, key) {
  return object != null && key in Object(object);
}

/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {boolean} [bitmask] The bitmask of comparison flags.
 *  The bitmask may be composed of the following flags:
 *     1 - Unordered comparison
 *     2 - Partial comparison
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, customizer, bitmask, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, baseIsEqual, customizer, bitmask, stack);
}

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {number} [bitmask] The bitmask of comparison flags. See `baseIsEqual`
 *  for more details.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, equalFunc, customizer, bitmask, stack) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = arrayTag,
      othTag = arrayTag;

  if (!objIsArr) {
    objTag = getTag(object);
    objTag = objTag == argsTag ? objectTag : objTag;
  }
  if (!othIsArr) {
    othTag = getTag(other);
    othTag = othTag == argsTag ? objectTag : othTag;
  }
  var objIsObj = objTag == objectTag && !isHostObject(object),
      othIsObj = othTag == objectTag && !isHostObject(other),
      isSameTag = objTag == othTag;

  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack);
    return (objIsArr || isTypedArray(object))
      ? equalArrays(object, other, equalFunc, customizer, bitmask, stack)
      : equalByTag(object, other, objTag, equalFunc, customizer, bitmask, stack);
  }
  if (!(bitmask & PARTIAL_COMPARE_FLAG)) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;

      stack || (stack = new Stack);
      return equalFunc(objUnwrapped, othUnwrapped, customizer, bitmask, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack);
  return equalObjects(object, other, equalFunc, customizer, bitmask, stack);
}

/**
 * The base implementation of `_.isMatch` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Object} source The object of property values to match.
 * @param {Array} matchData The property names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparisons.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */
function baseIsMatch(object, source, matchData, customizer) {
  var index = matchData.length,
      length = index,
      noCustomizer = !customizer;

  if (object == null) {
    return !length;
  }
  object = Object(object);
  while (index--) {
    var data = matchData[index];
    if ((noCustomizer && data[2])
          ? data[1] !== object[data[0]]
          : !(data[0] in object)
        ) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0],
        objValue = object[key],
        srcValue = data[1];

    if (noCustomizer && data[2]) {
      if (objValue === undefined && !(key in object)) {
        return false;
      }
    } else {
      var stack = new Stack;
      if (customizer) {
        var result = customizer(objValue, srcValue, key, object, source, stack);
      }
      if (!(result === undefined
            ? baseIsEqual(srcValue, objValue, customizer, UNORDERED_COMPARE_FLAG | PARTIAL_COMPARE_FLAG, stack)
            : result
          )) {
        return false;
      }
    }
  }
  return true;
}

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[objectToString.call(value)];
}

/**
 * The base implementation of `_.iteratee`.
 *
 * @private
 * @param {*} [value=_.identity] The value to convert to an iteratee.
 * @returns {Function} Returns the iteratee.
 */
function baseIteratee(value) {
  // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
  // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
  if (typeof value == 'function') {
    return value;
  }
  if (value == null) {
    return identity;
  }
  if (typeof value == 'object') {
    return isArray(value)
      ? baseMatchesProperty(value[0], value[1])
      : baseMatches(value);
  }
  return property(value);
}

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

/**
 * The base implementation of `_.matches` which doesn't clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatches(source) {
  var matchData = getMatchData(source);
  if (matchData.length == 1 && matchData[0][2]) {
    return matchesStrictComparable(matchData[0][0], matchData[0][1]);
  }
  return function(object) {
    return object === source || baseIsMatch(object, source, matchData);
  };
}

/**
 * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatchesProperty(path, srcValue) {
  if (isKey(path) && isStrictComparable(srcValue)) {
    return matchesStrictComparable(toKey(path), srcValue);
  }
  return function(object) {
    var objValue = get(object, path);
    return (objValue === undefined && objValue === srcValue)
      ? hasIn(object, path)
      : baseIsEqual(srcValue, objValue, undefined, UNORDERED_COMPARE_FLAG | PARTIAL_COMPARE_FLAG);
  };
}

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function basePropertyDeep(path) {
  return function(object) {
    return baseGet(object, path);
  };
}

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value) {
  return isArray(value) ? value : stringToPath(value);
}

/**
 * Creates a function like `_.groupBy`.
 *
 * @private
 * @param {Function} setter The function to set accumulator values.
 * @param {Function} [initializer] The accumulator object initializer.
 * @returns {Function} Returns the new aggregator function.
 */
function createAggregator(setter, initializer) {
  return function(collection, iteratee) {
    var func = isArray(collection) ? arrayAggregator : baseAggregator,
        accumulator = initializer ? initializer() : {};

    return func(collection, setter, baseIteratee(iteratee, 2), accumulator);
  };
}

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    if (collection == null) {
      return collection;
    }
    if (!isArrayLike(collection)) {
      return eachFunc(collection, iteratee);
    }
    var length = collection.length,
        index = fromRight ? length : -1,
        iterable = Object(collection);

    while ((fromRight ? index-- : ++index < length)) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1,
        iterable = Object(object),
        props = keysFunc(object),
        length = props.length;

    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} customizer The function to customize comparisons.
 * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
 *  for more details.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, equalFunc, customizer, bitmask, stack) {
  var isPartial = bitmask & PARTIAL_COMPARE_FLAG,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(array);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var index = -1,
      result = true,
      seen = (bitmask & UNORDERED_COMPARE_FLAG) ? new SetCache : undefined;

  stack.set(array, other);
  stack.set(other, array);

  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, arrValue, index, other, array, stack)
        : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== undefined) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (seen) {
      if (!arraySome(other, function(othValue, othIndex) {
            if (!seen.has(othIndex) &&
                (arrValue === othValue || equalFunc(arrValue, othValue, customizer, bitmask, stack))) {
              return seen.add(othIndex);
            }
          })) {
        result = false;
        break;
      }
    } else if (!(
          arrValue === othValue ||
            equalFunc(arrValue, othValue, customizer, bitmask, stack)
        )) {
      result = false;
      break;
    }
  }
  stack['delete'](array);
  stack['delete'](other);
  return result;
}

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} customizer The function to customize comparisons.
 * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
 *  for more details.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag, equalFunc, customizer, bitmask, stack) {
  switch (tag) {
    case dataViewTag:
      if ((object.byteLength != other.byteLength) ||
          (object.byteOffset != other.byteOffset)) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;

    case arrayBufferTag:
      if ((object.byteLength != other.byteLength) ||
          !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
        return false;
      }
      return true;

    case boolTag:
    case dateTag:
    case numberTag:
      // Coerce booleans to `1` or `0` and dates to milliseconds.
      // Invalid dates are coerced to `NaN`.
      return eq(+object, +other);

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
      // for more details.
      return object == (other + '');

    case mapTag:
      var convert = mapToArray;

    case setTag:
      var isPartial = bitmask & PARTIAL_COMPARE_FLAG;
      convert || (convert = setToArray);

      if (object.size != other.size && !isPartial) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= UNORDERED_COMPARE_FLAG;

      // Recursively compare objects (susceptible to call stack limits).
      stack.set(object, other);
      var result = equalArrays(convert(object), convert(other), equalFunc, customizer, bitmask, stack);
      stack['delete'](object);
      return result;

    case symbolTag:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} customizer The function to customize comparisons.
 * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
 *  for more details.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, equalFunc, customizer, bitmask, stack) {
  var isPartial = bitmask & PARTIAL_COMPARE_FLAG,
      objProps = keys(object),
      objLength = objProps.length,
      othProps = keys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(object);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);

  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, objValue, key, other, object, stack)
        : customizer(objValue, othValue, key, object, other, stack);
    }
    // Recursively compare objects (susceptible to call stack limits).
    if (!(compared === undefined
          ? (objValue === othValue || equalFunc(objValue, othValue, customizer, bitmask, stack))
          : compared
        )) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack['delete'](object);
  stack['delete'](other);
  return result;
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/**
 * Gets the property names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData(object) {
  var result = keys(object),
      length = result.length;

  while (length--) {
    var key = result[length],
        value = object[key];

    result[length] = [key, value, isStrictComparable(value)];
  }
  return result;
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11,
// for data views in Edge < 14, and promises in Node.js.
if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
    (Map && getTag(new Map) != mapTag) ||
    (Promise && getTag(Promise.resolve()) != promiseTag) ||
    (Set && getTag(new Set) != setTag) ||
    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
  getTag = function(value) {
    var result = objectToString.call(value),
        Ctor = result == objectTag ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : undefined;

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag;
        case mapCtorString: return mapTag;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag;
        case weakMapCtorString: return weakMapTag;
      }
    }
    return result;
  };
}

/**
 * Checks if `path` exists on `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @param {Function} hasFunc The function to check properties.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 */
function hasPath(object, path, hasFunc) {
  path = isKey(path, object) ? [path] : castPath(path);

  var result,
      index = -1,
      length = path.length;

  while (++index < length) {
    var key = toKey(path[index]);
    if (!(result = object != null && hasFunc(object, key))) {
      break;
    }
    object = object[key];
  }
  if (result) {
    return result;
  }
  var length = object ? object.length : 0;
  return !!length && isLength(length) && isIndex(key, length) &&
    (isArray(object) || isArguments(object));
}

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length &&
    (typeof value == 'number' || reIsUint.test(value)) &&
    (value > -1 && value % 1 == 0 && value < length);
}

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  if (isArray(value)) {
    return false;
  }
  var type = typeof value;
  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
      value == null || isSymbol(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
    (object != null && value in Object(object));
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

  return value === proto;
}

/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */
function isStrictComparable(value) {
  return value === value && !isObject(value);
}

/**
 * A specialized version of `matchesProperty` for source values suitable
 * for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function matchesStrictComparable(key, srcValue) {
  return function(object) {
    if (object == null) {
      return false;
    }
    return object[key] === srcValue &&
      (srcValue !== undefined || (key in Object(object)));
  };
}

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = memoize(function(string) {
  string = toString(string);

  var result = [];
  if (reLeadingDot.test(string)) {
    result.push('');
  }
  string.replace(rePropName, function(match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
});

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(value) {
  if (typeof value == 'string' || isSymbol(value)) {
    return value;
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to process.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/**
 * Creates an object composed of keys generated from the results of running
 * each element of `collection` thru `iteratee`. The order of grouped values
 * is determined by the order they occur in `collection`. The corresponding
 * value of each key is an array of elements responsible for generating the
 * key. The iteratee is invoked with one argument: (value).
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity]
 *  The iteratee to transform keys.
 * @returns {Object} Returns the composed aggregate object.
 * @example
 *
 * _.groupBy([6.1, 4.2, 6.3], Math.floor);
 * // => { '4': [4.2], '6': [6.1, 6.3] }
 *
 * // The `_.property` iteratee shorthand.
 * _.groupBy(['one', 'two', 'three'], 'length');
 * // => { '3': ['one', 'two'], '5': ['three'] }
 */
var groupBy = createAggregator(function(result, value, key) {
  if (hasOwnProperty.call(result, key)) {
    result[key].push(value);
  } else {
    result[key] = [value];
  }
});

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize(func, resolver) {
  if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result);
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache);
  return memoized;
}

// Assign cache to `_.memoize`.
memoize.Cache = MapCache;

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
    (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.get(object, 'a[0].b.c');
 * // => 3
 *
 * _.get(object, ['a', '0', 'b', 'c']);
 * // => 3
 *
 * _.get(object, 'a.b.c', 'default');
 * // => 'default'
 */
function get(object, path, defaultValue) {
  var result = object == null ? undefined : baseGet(object, path);
  return result === undefined ? defaultValue : result;
}

/**
 * Checks if `path` is a direct or inherited property of `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 * @example
 *
 * var object = _.create({ 'a': _.create({ 'b': 2 }) });
 *
 * _.hasIn(object, 'a');
 * // => true
 *
 * _.hasIn(object, 'a.b');
 * // => true
 *
 * _.hasIn(object, ['a', 'b']);
 * // => true
 *
 * _.hasIn(object, 'b');
 * // => false
 */
function hasIn(object, path) {
  return object != null && hasPath(object, path, baseHasIn);
}

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

/**
 * Creates a function that returns the value at `path` of a given object.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': 2 } },
 *   { 'a': { 'b': 1 } }
 * ];
 *
 * _.map(objects, _.property('a.b'));
 * // => [2, 1]
 *
 * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
 * // => [1, 2]
 */
function property(path) {
  return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
}

module.exports = groupBy;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],34:[function(require,module,exports){
// moment-hijri.js
// author: Suhail Alkowaileet
// This is a modified version of moment-jalaali by Behrang Noruzi Niya
// license: MIT

'use strict';

/************************************
    Expose Moment Hijri
************************************/
(function (root, factory) {
	/* global define */
	if (typeof define === 'function' && define.amd) {
		define(['moment'], function (moment) {
			root.moment = factory(moment)
			return root.moment
		})
	} else if (typeof exports === 'object') {
		module.exports = factory(require('moment'))
	} else {
		root.moment = factory(root.moment)
	}
})(this, function (moment) { // jshint ignore:line

	if (moment == null) {
		throw new Error('Cannot find moment')
	}

	/************************************
      Constants
  ************************************/

	var ummalqura = {
		ummalquraData: [28607, 28636, 28665, 28695, 28724, 28754, 28783, 28813, 28843, 28872, 28901, 28931, 28960, 28990, 29019, 29049, 29078, 29108, 29137, 29167,
                      29196, 29226, 29255, 29285, 29315, 29345, 29375, 29404, 29434, 29463, 29492, 29522, 29551, 29580, 29610, 29640, 29669, 29699, 29729, 29759,
                      29788, 29818, 29847, 29876, 29906, 29935, 29964, 29994, 30023, 30053, 30082, 30112, 30141, 30171, 30200, 30230, 30259, 30289, 30318, 30348,
                      30378, 30408, 30437, 30467, 30496, 30526, 30555, 30585, 30614, 30644, 30673, 30703, 30732, 30762, 30791, 30821, 30850, 30880, 30909, 30939,
                      30968, 30998, 31027, 31057, 31086, 31116, 31145, 31175, 31204, 31234, 31263, 31293, 31322, 31352, 31381, 31411, 31441, 31471, 31500, 31530,
                      31559, 31589, 31618, 31648, 31676, 31706, 31736, 31766, 31795, 31825, 31854, 31884, 31913, 31943, 31972, 32002, 32031, 32061, 32090, 32120,
                      32150, 32180, 32209, 32239, 32268, 32298, 32327, 32357, 32386, 32416, 32445, 32475, 32504, 32534, 32563, 32593, 32622, 32652, 32681, 32711,
                      32740, 32770, 32799, 32829, 32858, 32888, 32917, 32947, 32976, 33006, 33035, 33065, 33094, 33124, 33153, 33183, 33213, 33243, 33272, 33302,
                      33331, 33361, 33390, 33420, 33450, 33479, 33509, 33539, 33568, 33598, 33627, 33657, 33686, 33716, 33745, 33775, 33804, 33834, 33863, 33893,
                      33922, 33952, 33981, 34011, 34040, 34069, 34099, 34128, 34158, 34187, 34217, 34247, 34277, 34306, 34336, 34365, 34395, 34424, 34454, 34483,
                      34512, 34542, 34571, 34601, 34631, 34660, 34690, 34719, 34749, 34778, 34808, 34837, 34867, 34896, 34926, 34955, 34985, 35015, 35044, 35074,
                      35103, 35133, 35162, 35192, 35222, 35251, 35280, 35310, 35340, 35370, 35399, 35429, 35458, 35488, 35517, 35547, 35576, 35605, 35635, 35665,
                      35694, 35723, 35753, 35782, 35811, 35841, 35871, 35901, 35930, 35960, 35989, 36019, 36048, 36078, 36107, 36136, 36166, 36195, 36225, 36254,
                      36284, 36314, 36343, 36373, 36403, 36433, 36462, 36492, 36521, 36551, 36580, 36610, 36639, 36669, 36698, 36728, 36757, 36786, 36816, 36845,
                      36875, 36904, 36934, 36963, 36993, 37022, 37052, 37081, 37111, 37141, 37170, 37200, 37229, 37259, 37288, 37318, 37347, 37377, 37406, 37436,
                      37465, 37495, 37524, 37554, 37584, 37613, 37643, 37672, 37701, 37731, 37760, 37790, 37819, 37849, 37878, 37908, 37938, 37967, 37997, 38027,
                      38056, 38085, 38115, 38144, 38174, 38203, 38233, 38262, 38292, 38322, 38351, 38381, 38410, 38440, 38469, 38499, 38528, 38558, 38587, 38617,
                      38646, 38676, 38705, 38735, 38764, 38794, 38823, 38853, 38882, 38912, 38941, 38971, 39001, 39030, 39059, 39089, 39118, 39148, 39178, 39208,
                      39237, 39267, 39297, 39326, 39355, 39385, 39414, 39444, 39473, 39503, 39532, 39562, 39592, 39621, 39650, 39680, 39709, 39739, 39768, 39798,
                      39827, 39857, 39886, 39916, 39946, 39975, 40005, 40035, 40064, 40094, 40123, 40153, 40182, 40212, 40241, 40271, 40300, 40330, 40359, 40389,
                      40418, 40448, 40477, 40507, 40536, 40566, 40595, 40625, 40655, 40685, 40714, 40744, 40773, 40803, 40832, 40862, 40892, 40921, 40951, 40980,
                      41009, 41039, 41068, 41098, 41127, 41157, 41186, 41216, 41245, 41275, 41304, 41334, 41364, 41393, 41422, 41452, 41481, 41511, 41540, 41570,
                      41599, 41629, 41658, 41688, 41718, 41748, 41777, 41807, 41836, 41865, 41894, 41924, 41953, 41983, 42012, 42042, 42072, 42102, 42131, 42161,
                      42190, 42220, 42249, 42279, 42308, 42337, 42367, 42397, 42426, 42456, 42485, 42515, 42545, 42574, 42604, 42633, 42662, 42692, 42721, 42751,
                      42780, 42810, 42839, 42869, 42899, 42929, 42958, 42988, 43017, 43046, 43076, 43105, 43135, 43164, 43194, 43223, 43253, 43283, 43312, 43342,
                      43371, 43401, 43430, 43460, 43489, 43519, 43548, 43578, 43607, 43637, 43666, 43696, 43726, 43755, 43785, 43814, 43844, 43873, 43903, 43932,
                      43962, 43991, 44021, 44050, 44080, 44109, 44139, 44169, 44198, 44228, 44258, 44287, 44317, 44346, 44375, 44405, 44434, 44464, 44493, 44523,
                      44553, 44582, 44612, 44641, 44671, 44700, 44730, 44759, 44788, 44818, 44847, 44877, 44906, 44936, 44966, 44996, 45025, 45055, 45084, 45114,
                      45143, 45172, 45202, 45231, 45261, 45290, 45320, 45350, 45380, 45409, 45439, 45468, 45498, 45527, 45556, 45586, 45615, 45644, 45674, 45704,
                      45733, 45763, 45793, 45823, 45852, 45882, 45911, 45940, 45970, 45999, 46028, 46058, 46088, 46117, 46147, 46177, 46206, 46236, 46265, 46295,
                      46324, 46354, 46383, 46413, 46442, 46472, 46501, 46531, 46560, 46590, 46620, 46649, 46679, 46708, 46738, 46767, 46797, 46826, 46856, 46885,
                      46915, 46944, 46974, 47003, 47033, 47063, 47092, 47122, 47151, 47181, 47210, 47240, 47269, 47298, 47328, 47357, 47387, 47417, 47446, 47476,
                      47506, 47535, 47565, 47594, 47624, 47653, 47682, 47712, 47741, 47771, 47800, 47830, 47860, 47890, 47919, 47949, 47978, 48008, 48037, 48066,
                      48096, 48125, 48155, 48184, 48214, 48244, 48273, 48303, 48333, 48362, 48392, 48421, 48450, 48480, 48509, 48538, 48568, 48598, 48627, 48657,
                      48687, 48717, 48746, 48776, 48805, 48834, 48864, 48893, 48922, 48952, 48982, 49011, 49041, 49071, 49100, 49130, 49160, 49189, 49218, 49248,
                      49277, 49306, 49336, 49365, 49395, 49425, 49455, 49484, 49514, 49543, 49573, 49602, 49632, 49661, 49690, 49720, 49749, 49779, 49809, 49838,
                      49868, 49898, 49927, 49957, 49986, 50016, 50045, 50075, 50104, 50133, 50163, 50192, 50222, 50252, 50281, 50311, 50340, 50370, 50400, 50429,
                      50459, 50488, 50518, 50547, 50576, 50606, 50635, 50665, 50694, 50724, 50754, 50784, 50813, 50843, 50872, 50902, 50931, 50960, 50990, 51019,
                      51049, 51078, 51108, 51138, 51167, 51197, 51227, 51256, 51286, 51315, 51345, 51374, 51403, 51433, 51462, 51492, 51522, 51552, 51582, 51611,
                      51641, 51670, 51699, 51729, 51758, 51787, 51816, 51846, 51876, 51906, 51936, 51965, 51995, 52025, 52054, 52083, 52113, 52142, 52171, 52200,
                      52230, 52260, 52290, 52319, 52349, 52379, 52408, 52438, 52467, 52497, 52526, 52555, 52585, 52614, 52644, 52673, 52703, 52733, 52762, 52792,
                      52822, 52851, 52881, 52910, 52939, 52969, 52998, 53028, 53057, 53087, 53116, 53146, 53176, 53205, 53235, 53264, 53294, 53324, 53353, 53383,
                      53412, 53441, 53471, 53500, 53530, 53559, 53589, 53619, 53648, 53678, 53708, 53737, 53767, 53796, 53825, 53855, 53884, 53913, 53943, 53973,
                      54003, 54032, 54062, 54092, 54121, 54151, 54180, 54209, 54239, 54268, 54297, 54327, 54357, 54387, 54416, 54446, 54476, 54505, 54535, 54564,
                      54593, 54623, 54652, 54681, 54711, 54741, 54770, 54800, 54830, 54859, 54889, 54919, 54948, 54977, 55007, 55036, 55066, 55095, 55125, 55154,
                      55184, 55213, 55243, 55273, 55302, 55332, 55361, 55391, 55420, 55450, 55479, 55508, 55538, 55567, 55597, 55627, 55657, 55686, 55716, 55745,
                      55775, 55804, 55834, 55863, 55892, 55922, 55951, 55981, 56011, 56040, 56070, 56100, 56129, 56159, 56188, 56218, 56247, 56276, 56306, 56335,
                      56365, 56394, 56424, 56454, 56483, 56513, 56543, 56572, 56601, 56631, 56660, 56690, 56719, 56749, 56778, 56808, 56837, 56867, 56897, 56926,
                      56956, 56985, 57015, 57044, 57074, 57103, 57133, 57162, 57192, 57221, 57251, 57280, 57310, 57340, 57369, 57399, 57429, 57458, 57487, 57517,
                      57546, 57576, 57605, 57634, 57664, 57694, 57723, 57753, 57783, 57813, 57842, 57871, 57901, 57930, 57959, 57989, 58018, 58048, 58077, 58107,
                      58137, 58167, 58196, 58226, 58255, 58285, 58314, 58343, 58373, 58402, 58432, 58461, 58491, 58521, 58551, 58580, 58610, 58639, 58669, 58698,
                      58727, 58757, 58786, 58816, 58845, 58875, 58905, 58934, 58964, 58994, 59023, 59053, 59082, 59111, 59141, 59170, 59200, 59229, 59259, 59288,
                      59318, 59348, 59377, 59407, 59436, 59466, 59495, 59525, 59554, 59584, 59613, 59643, 59672, 59702, 59731, 59761, 59791, 59820, 59850, 59879,
                      59909, 59939, 59968, 59997, 60027, 60056, 60086, 60115, 60145, 60174, 60204, 60234, 60264, 60293, 60323, 60352, 60381, 60411, 60440, 60469,
                      60499, 60528, 60558, 60588, 60618, 60648, 60677, 60707, 60736, 60765, 60795, 60824, 60853, 60883, 60912, 60942, 60972, 61002, 61031, 61061,
                      61090, 61120, 61149, 61179, 61208, 61237, 61267, 61296, 61326, 61356, 61385, 61415, 61445, 61474, 61504, 61533, 61563, 61592, 61621, 61651,
                      61680, 61710, 61739, 61769, 61799, 61828, 61858, 61888, 61917, 61947, 61976, 62006, 62035, 62064, 62094, 62123, 62153, 62182, 62212, 62242,
                      62271, 62301, 62331, 62360, 62390, 62419, 62448, 62478, 62507, 62537, 62566, 62596, 62625, 62655, 62685, 62715, 62744, 62774, 62803, 62832,
                      62862, 62891, 62921, 62950, 62980, 63009, 63039, 63069, 63099, 63128, 63157, 63187, 63216, 63246, 63275, 63305, 63334, 63363, 63393, 63423,
                      63453, 63482, 63512, 63541, 63571, 63600, 63630, 63659, 63689, 63718, 63747, 63777, 63807, 63836, 63866, 63895, 63925, 63955, 63984, 64014,
                      64043, 64073, 64102, 64131, 64161, 64190, 64220, 64249, 64279, 64309, 64339, 64368, 64398, 64427, 64457, 64486, 64515, 64545, 64574, 64603,
                      64633, 64663, 64692, 64722, 64752, 64782, 64811, 64841, 64870, 64899, 64929, 64958, 64987, 65017, 65047, 65076, 65106, 65136, 65166, 65195,
                      65225, 65254, 65283, 65313, 65342, 65371, 65401, 65431, 65460, 65490, 65520, 65549, 65579, 65608, 65638, 65667, 65697, 65726, 65755, 65785,
                      65815, 65844, 65874, 65903, 65933, 65963, 65992, 66022, 66051, 66081, 66110, 66140, 66169, 66199, 66228, 66258, 66287, 66317, 66346, 66376,
                      66405, 66435, 66465, 66494, 66524, 66553, 66583, 66612, 66641, 66671, 66700, 66730, 66760, 66789, 66819, 66849, 66878, 66908, 66937, 66967,
                      66996, 67025, 67055, 67084, 67114, 67143, 67173, 67203, 67233, 67262, 67292, 67321, 67351, 67380, 67409, 67439, 67468, 67497, 67527, 67557,
                      67587, 67617, 67646, 67676, 67705, 67735, 67764, 67793, 67823, 67852, 67882, 67911, 67941, 67971, 68000, 68030, 68060, 68089, 68119, 68148,
                      68177, 68207, 68236, 68266, 68295, 68325, 68354, 68384, 68414, 68443, 68473, 68502, 68532, 68561, 68591, 68620, 68650, 68679, 68708, 68738,
                      68768, 68797, 68827, 68857, 68886, 68916, 68946, 68975, 69004, 69034, 69063, 69092, 69122, 69152, 69181, 69211, 69240, 69270, 69300, 69330,
                      69359, 69388, 69418, 69447, 69476, 69506, 69535, 69565, 69595, 69624, 69654, 69684, 69713, 69743, 69772, 69802, 69831, 69861, 69890, 69919,
                      69949, 69978, 70008, 70038, 70067, 70097, 70126, 70156, 70186, 70215, 70245, 70274, 70303, 70333, 70362, 70392, 70421, 70451, 70481, 70510,
                      70540, 70570, 70599, 70629, 70658, 70687, 70717, 70746, 70776, 70805, 70835, 70864, 70894, 70924, 70954, 70983, 71013, 71042, 71071, 71101,
                      71130, 71159, 71189, 71218, 71248, 71278, 71308, 71337, 71367, 71397, 71426, 71455, 71485, 71514, 71543, 71573, 71602, 71632, 71662, 71691,
                      71721, 71751, 71781, 71810, 71839, 71869, 71898, 71927, 71957, 71986, 72016, 72046, 72075, 72105, 72135, 72164, 72194, 72223, 72253, 72282,
                      72311, 72341, 72370, 72400, 72429, 72459, 72489, 72518, 72548, 72577, 72607, 72637, 72666, 72695, 72725, 72754, 72784, 72813, 72843, 72872,
                      72902, 72931, 72961, 72991, 73020, 73050, 73080, 73109, 73139, 73168, 73197, 73227, 73256, 73286, 73315, 73345, 73375, 73404, 73434, 73464,
                      73493, 73523, 73552, 73581, 73611, 73640, 73669, 73699, 73729, 73758, 73788, 73818, 73848, 73877, 73907, 73936, 73965, 73995, 74024, 74053,
                      74083, 74113, 74142, 74172, 74202, 74231, 74261, 74291, 74320, 74349, 74379, 74408, 74437, 74467, 74497, 74526, 74556, 74586, 74615, 74645,
                      74675, 74704, 74733, 74763, 74792, 74822, 74851, 74881, 74910, 74940, 74969, 74999, 75029, 75058, 75088, 75117, 75147, 75176, 75206, 75235,
                      75264, 75294, 75323, 75353, 75383, 75412, 75442, 75472, 75501, 75531, 75560, 75590, 75619, 75648, 75678, 75707, 75737, 75766, 75796, 75826,
                      75856, 75885, 75915, 75944, 75974, 76003, 76032, 76062, 76091, 76121, 76150, 76180, 76210, 76239, 76269, 76299, 76328, 76358, 76387, 76416,
                      76446, 76475, 76505, 76534, 76564, 76593, 76623, 76653, 76682, 76712, 76741, 76771, 76801, 76830, 76859, 76889, 76918, 76948, 76977, 77007,
                      77036, 77066, 77096, 77125, 77155, 77185, 77214, 77243, 77273, 77302, 77332, 77361, 77390, 77420, 77450, 77479, 77509, 77539, 77569, 77598,
                      77627, 77657, 77686, 77715, 77745, 77774, 77804, 77833, 77863, 77893, 77923, 77952, 77982, 78011, 78041, 78070, 78099, 78129, 78158, 78188,
                      78217, 78247, 78277, 78307, 78336, 78366, 78395, 78425, 78454, 78483, 78513, 78542, 78572, 78601, 78631, 78661, 78690, 78720, 78750, 78779,
                      78808, 78838, 78867, 78897, 78926, 78956, 78985, 79015, 79044, 79074, 79104, 79133, 79163, 79192, 79222, 79251, 79281, 79310, 79340, 79369,
                      79399, 79428, 79458, 79487, 79517, 79546, 79576, 79606, 79635, 79665, 79695, 79724, 79753, 79783, 79812, 79841, 79871, 79900, 79930, 79960,
                      79990]
	}

	var formattingTokens = /(\[[^\[]*\])|(\\)?i(Mo|MM?M?M?|Do|DDDo|DD?D?D?|w[o|w]?|YYYYY|YYYY|YY|gg(ggg?)?)|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|SS?S?|X|zz?|ZZ?|.)/g,
		localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g

	, parseTokenOneOrTwoDigits = /\d\d?/, parseTokenOneToThreeDigits = /\d{1,3}/, parseTokenThreeDigits = /\d{3}/, parseTokenFourDigits = /\d{1,4}/, parseTokenSixDigits = /[+\-]?\d{1,6}/, parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.?)|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/i, parseTokenT = /T/i, parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/

	, unitAliases = {
		hd: 'idate',
		hm: 'imonth',
		hy: 'iyear'
	}

	, formatFunctions = {}

	, ordinalizeTokens = 'DDD w M D'.split(' '), paddedTokens = 'M D w'.split(' ')

	, formatTokenFunctions = {
		iM: function () {
			return this.iMonth() + 1
		},
		iMMM: function (format) {
			return this.localeData().iMonthsShort(this, format)
		},
		iMMMM: function (format) {
			return this.localeData().iMonths(this, format)
		},
		iD: function () {
			return this.iDate()
		},
		iDDD: function () {
			return this.iDayOfYear()
		},
		iw: function () {
			return this.iWeek()
		},
		iYY: function () {
			return leftZeroFill(this.iYear() % 100, 2)
		},
		iYYYY: function () {
			return leftZeroFill(this.iYear(), 4)
		},
		iYYYYY: function () {
			return leftZeroFill(this.iYear(), 5)
		},
		igg: function () {
			return leftZeroFill(this.iWeekYear() % 100, 2)
		},
		igggg: function () {
			return this.iWeekYear()
		},
		iggggg: function () {
			return leftZeroFill(this.iWeekYear(), 5)
		}
	}, i

	function padToken(func, count) {
		return function (a) {
			return leftZeroFill(func.call(this, a), count)
		}
	}

	function ordinalizeToken(func, period) {
		return function (a) {
			return this.localeData().ordinal(func.call(this, a), period)
		}
	}

	while (ordinalizeTokens.length) {
		i = ordinalizeTokens.pop()
		formatTokenFunctions['i' + i + 'o'] = ordinalizeToken(formatTokenFunctions['i' + i], i)
	}
	while (paddedTokens.length) {
		i = paddedTokens.pop()
		formatTokenFunctions['i' + i + i] = padToken(formatTokenFunctions['i' + i], 2)
	}
	formatTokenFunctions.iDDDD = padToken(formatTokenFunctions.iDDD, 3)

	/************************************
      Helpers
  ************************************/

	function extend(a, b) {
		var key
		for (key in b)
			if (b.hasOwnProperty(key))
				a[key] = b[key]
		return a
	}

	function leftZeroFill(number, targetLength) {
		var output = number + ''
		while (output.length < targetLength)
			output = '0' + output
		return output
	}

	function isArray(input) {
		return Object.prototype.toString.call(input) === '[object Array]'
	}

	function normalizeUnits(units) {
		return units ? unitAliases[units] || units.toLowerCase().replace(/(.)s$/, '$1') : units
	}

	function setDate(moment, year, month, date) {
		var utc = moment._isUTC ? 'UTC' : ''
		moment._d['set' + utc + 'FullYear'](year)
		moment._d['set' + utc + 'Month'](month)
		moment._d['set' + utc + 'Date'](date)
	}

	function objectCreate(parent) {
		function F() {}
		F.prototype = parent
		return new F()
	}

	function getPrototypeOf(object) {
		if (Object.getPrototypeOf)
			return Object.getPrototypeOf(object)
		else if (''.__proto__) // jshint ignore:line
			return object.__proto__ // jshint ignore:line
		else
			return object.constructor.prototype
	}

	/************************************
      Languages
  ************************************/
	extend(getPrototypeOf(moment.localeData()), {
		_iMonths: ['Muharram'
                , 'Safar'
                , 'Rabi\' al-Awwal'
                , 'Rabi\' al-Thani'
                , 'Jumada al-Ula'
                , 'Jumada al-Alkhirah'
                , 'Rajab'
                , 'Sha’ban'
                , 'Ramadhan'
                , 'Shawwal'
                , 'Thul-Qi’dah'
                , 'Thul-Hijjah'
                ],
		iMonths: function (m) {
			return this._iMonths[m.iMonth()]
		}

		,
		_iMonthsShort: ['Muh'
                      , 'Saf'
                      , 'Rab-I'
                      , 'Rab-II'
                      , 'Jum-I'
                      , 'Jum-II'
                      , 'Raj'
                      , 'Sha'
                      , 'Ram'
                      , 'Shw'
                      , 'Dhu-Q'
                      , 'Dhu-H'
                      ],
		iMonthsShort: function (m) {
			return this._iMonthsShort[m.iMonth()]
		}

		,
		iMonthsParse: function (monthName) {
			var i, mom, regex
			if (!this._iMonthsParse)
				this._iMonthsParse = []
			for (i = 0; i < 12; i += 1) {
				// Make the regex if we don't have it already.
				if (!this._iMonthsParse[i]) {
					mom = hMoment([2000, (2 + i) % 12, 25])
					regex = '^' + this.iMonths(mom, '') + '$|^' + this.iMonthsShort(mom, '') + '$'
					this._iMonthsParse[i] = new RegExp(regex.replace('.', ''), 'i')
				}
				// Test the regex.
				if (this._iMonthsParse[i].test(monthName))
					return i
			}
		}
	});
	var iMonthNames = {
		iMonths: 'محرم_صفر_ربيع الأول_ربيع الثاني_جمادى الأولى_جمادى الآخرة_رجب_شعبان_رمضان_شوال_ذو القعدة_ذو الحجة'.split('_'),
		iMonthsShort: 'محرم_صفر_ربيع ١_ربيع ٢_جمادى ١_جمادى ٢_رجب_شعبان_رمضان_شوال_ذو القعدة_ذو الحجة'.split('_')
	};

	// Default to the momentjs 2.12+ API
	if (typeof moment.updateLocale === 'function') {
		moment.updateLocale('ar-sa', iMonthNames);
	} else {
		var oldLocale = moment.locale();
		moment.defineLocale('ar-sa', iMonthNames);
		moment.locale(oldLocale);
	}

	/************************************
      Formatting
  ************************************/

	function makeFormatFunction(format) {
		var array = format.match(formattingTokens),
			length = array.length,
			i

		for (i = 0; i < length; i += 1)
			if (formatTokenFunctions[array[i]])
				array[i] = formatTokenFunctions[array[i]]

		return function (mom) {
			var output = ''
			for (i = 0; i < length; i += 1)
				output += array[i] instanceof Function ? '[' + array[i].call(mom, format) + ']' : array[i]
			return output
		}
	}

	/************************************
      Parsing
  ************************************/

	function getParseRegexForToken(token, config) {
		switch (token) {
		case 'iDDDD':
			return parseTokenThreeDigits
		case 'iYYYY':
			return parseTokenFourDigits
		case 'iYYYYY':
			return parseTokenSixDigits
		case 'iDDD':
			return parseTokenOneToThreeDigits
		case 'iMMM':
		case 'iMMMM':
			return parseTokenWord
		case 'iMM':
		case 'iDD':
		case 'iYY':
		case 'iM':
		case 'iD':
			return parseTokenOneOrTwoDigits
		case 'DDDD':
			return parseTokenThreeDigits
		case 'YYYY':
			return parseTokenFourDigits
		case 'YYYYY':
			return parseTokenSixDigits
		case 'S':
		case 'SS':
		case 'SSS':
		case 'DDD':
			return parseTokenOneToThreeDigits
		case 'MMM':
		case 'MMMM':
		case 'dd':
		case 'ddd':
		case 'dddd':
			return parseTokenWord
		case 'a':
		case 'A':
			return moment.localeData(config._l)._meridiemParse
		case 'X':
			return parseTokenTimestampMs
		case 'Z':
		case 'ZZ':
			return parseTokenTimezone
		case 'T':
			return parseTokenT
		case 'MM':
		case 'DD':
		case 'YY':
		case 'HH':
		case 'hh':
		case 'mm':
		case 'ss':
		case 'M':
		case 'D':
		case 'd':
		case 'H':
		case 'h':
		case 'm':
		case 's':
			return parseTokenOneOrTwoDigits
		default:
			return new RegExp(token.replace('\\', ''))
		}
	}

	function addTimeToArrayFromToken(token, input, config) {
		var a, datePartArray = config._a

		switch (token) {
		case 'iM':
		case 'iMM':
			datePartArray[1] = input == null ? 0 : ~~input - 1
			break
		case 'iMMM':
		case 'iMMMM':
			a = moment.localeData(config._l).iMonthsParse(input)
			if (a != null)
				datePartArray[1] = a
			else
				config._isValid = false
			break
		case 'iD':
		case 'iDD':
		case 'iDDD':
		case 'iDDDD':
			if (input != null)
				datePartArray[2] = ~~input
			break
		case 'iYY':
			datePartArray[0] = ~~input + (~~input > 47 ? 1300 : 1400)
			break
		case 'iYYYY':
		case 'iYYYYY':
			datePartArray[0] = ~~input
		}
		if (input == null)
			config._isValid = false
	}

	function dateFromArray(config) {
		var g, h, hy = config._a[0],
			hm = config._a[1],
			hd = config._a[2]

		if ((hy == null) && (hm == null) && (hd == null))
			return [0, 0, 1]
		hy = hy || 0
		hm = hm || 0
		hd = hd || 1
		if (hd < 1 || hd > hMoment.iDaysInMonth(hy, hm))
			config._isValid = false
		g = toGregorian(hy, hm, hd)
		h = toHijri(g.gy, g.gm, g.gd)
		config._hDiff = 0
		if (~~h.hy !== hy)
			config._hDiff += 1
		if (~~h.hm !== hm)
			config._hDiff += 1
		if (~~h.hd !== hd)
			config._hDiff += 1
		return [g.gy, g.gm, g.gd]
	}

	function makeDateFromStringAndFormat(config) {
		var tokens = config._f.match(formattingTokens),
			string = config._i,
			len = tokens.length,
			i, token, parsedInput

		config._a = []

		for (i = 0; i < len; i += 1) {
			token = tokens[i]
			parsedInput = (getParseRegexForToken(token, config).exec(string) || [])[0];
			if (parsedInput)
				string = string.slice(string.indexOf(parsedInput) + parsedInput.length)
			if (formatTokenFunctions[token])
				addTimeToArrayFromToken(token, parsedInput, config)
		}
		if (string)
			config._il = string

		return dateFromArray(config)
	}

	function makeDateFromStringAndArray(config, utc) {
		var len = config._f.length
		, i
		, format
		, tempMoment
		, bestMoment
		, currentScore
		, scoreToBeat

		if (len === 0) {
			return makeMoment(new Date(NaN))
		}

		for (i = 0; i < len; i += 1) {
			format = config._f[i]
			currentScore = 0
			tempMoment = makeMoment(config._i, format, config._l, utc)

			if (!tempMoment.isValid()) continue

			currentScore += tempMoment._hDiff
			if (tempMoment._il)
				currentScore += tempMoment._il.length
			if (scoreToBeat == null || currentScore < scoreToBeat) {
				scoreToBeat = currentScore
				bestMoment = tempMoment
			}
		}

		return bestMoment
	}

	function removeParsedTokens(config) {
		var string = config._i,
			input = '',
			format = '',
			array = config._f.match(formattingTokens),
			len = array.length,
			i, match, parsed

		for (i = 0; i < len; i += 1) {
			match = array[i]
			parsed = (getParseRegexForToken(match, config).exec(string) || [])[0]
			if (parsed)
				string = string.slice(string.indexOf(parsed) + parsed.length)
			if (!(formatTokenFunctions[match] instanceof Function)) {
				format += match
				if (parsed)
					input += parsed
			}
		}
		config._i = input
		config._f = format
	}

	/************************************
      Week of Year
  ************************************/

	function iWeekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
		var end = firstDayOfWeekOfYear - firstDayOfWeek,
			daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
			adjustedMoment

		if (daysToDayOfWeek > end) {
			daysToDayOfWeek -= 7
		}
		if (daysToDayOfWeek < end - 7) {
			daysToDayOfWeek += 7
		}
		adjustedMoment = hMoment(mom).add(daysToDayOfWeek, 'd')
		return {
			week: Math.ceil(adjustedMoment.iDayOfYear() / 7),
			year: adjustedMoment.iYear()
		}
	}

	/************************************
      Top Level Functions
  ************************************/

	function makeMoment(input, format, lang, utc) {
		var config =
			{ _i: input
			, _f: format
			, _l: lang
			}
			, date
			, m
			, hm
		if (format) {
			if (isArray(format)) {
				return makeDateFromStringAndArray(config, utc)
			} else {
				date = makeDateFromStringAndFormat(config)
				removeParsedTokens(config)
				format = 'YYYY-MM-DD-' + config._f
				input = leftZeroFill(date[0], 4) + '-'
					+ leftZeroFill(date[1] + 1, 2) + '-'
					+ leftZeroFill(date[2], 2) + '-'
					+ config._i
			}
		}
		if (utc)
			m = moment.utc(input, format, lang)
		else
			m = moment(input, format, lang)
		if (config._isValid === false)
			m._isValid = false
		m._hDiff = config._hDiff || 0
		hm = objectCreate(hMoment.fn)
		extend(hm, m)
		return hm
	}

	function hMoment(input, format, lang) {
		return makeMoment(input, format, lang, false)
	}

	extend(hMoment, moment)
	hMoment.fn = objectCreate(moment.fn)

	hMoment.utc = function (input, format, lang) {
		return makeMoment(input, format, lang, true)
	}

	/************************************
      hMoment Prototype
  ************************************/

	hMoment.fn.format = function (format) {
		var i, replace, me = this

		if (format) {
			i = 5
			replace = function (input) {
				return me.localeData().longDateFormat(input) || input
			}
			while (i > 0 && localFormattingTokens.test(format)) {
				i -= 1
				format = format.replace(localFormattingTokens, replace)
			}
			if (!formatFunctions[format]) {
				formatFunctions[format] = makeFormatFunction(format)
			}
			format = formatFunctions[format](this)
		}
		return moment.fn.format.call(this, format)
	}

	hMoment.fn.iYear = function (input) {
		var lastDay, h, g
		if (typeof input === 'number') {
			h = toHijri(this.year(), this.month(), this.date())
			lastDay = Math.min(h.hd, hMoment.iDaysInMonth(input, h.hm))
			g = toGregorian(input, h.hm, lastDay)
			setDate(this, g.gy, g.gm, g.gd)
			//Workaround: sometimes moment wont set the date correctly if current day is the last in the month
			if (this.month() !== g.gm || this.date() !== g.gd || this.year() !== g.gy) {
				setDate(this, g.gy, g.gm, g.gd)
			}
			moment.updateOffset(this)
			return this
		} else {
			return toHijri(this.year(), this.month(), this.date()).hy
		}
	}

	hMoment.fn.iMonth = function (input) {
		var lastDay, h, g
		if (input != null) {
			if (typeof input === 'string') {
				input = this.localeData().iMonthsParse(input)
				if(input >= 0) {
					input -= 1
				} else {
					return this
				}
			}
			h = toHijri(this.year(), this.month(), this.date())
			lastDay = Math.min(h.hd, hMoment.iDaysInMonth(h.hy, input))
			this.iYear(h.hy + div(input, 12))
			input = mod(input, 12)
			if (input < 0) {
				input += 12
				this.iYear(this.iYear() - 1)
			}
			g = toGregorian(this.iYear(), input, lastDay)
			setDate(this, g.gy, g.gm, g.gd)
			//Workaround: sometimes moment wont set the date correctly if current day is the last in the month
			if (this.month() !== g.gm || this.date() !== g.gd || this.year() !== g.gy) {
				setDate(this, g.gy, g.gm, g.gd)
			}
			moment.updateOffset(this)
			return this
		} else {
			return toHijri(this.year(), this.month(), this.date()).hm
		}
	}

	hMoment.fn.iDate = function (input) {
		var h, g
		if (typeof input === 'number') {
			h = toHijri(this.year(), this.month(), this.date())
			g = toGregorian(h.hy, h.hm, input)
			setDate(this, g.gy, g.gm, g.gd)
			//Workaround: sometimes moment wont set the date correctly if current day is the last in the month
			if (this.month() !== g.gm || this.date() !== g.gd || this.year() !== g.gy) {
				setDate(this, g.gy, g.gm, g.gd)
			}
			moment.updateOffset(this)
			return this
		} else {
			return toHijri(this.year(), this.month(), this.date()).hd
		}
	}

	hMoment.fn.iDayOfYear = function (input) {
		var dayOfYear = Math.round((hMoment(this).startOf('day') - hMoment(this).startOf('iYear')) / 864e5) + 1
		return input == null ? dayOfYear : this.add(input - dayOfYear, 'd')
	}

	hMoment.fn.iDaysInMonth = function () {
		return parseInt(hMoment(this).endOf('iMonth').format('iDD'));
	}

	hMoment.fn.iWeek = function (input) {
		var week = iWeekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).week
		return input == null ? week : this.add( (input - week) * 7, 'd')
	}

	hMoment.fn.iWeekYear = function (input) {
		var year = iWeekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).year
		return input == null ? year : this.add(input - year, 'y')
	}

	hMoment.fn.add = function (val, units) {
		var temp
		if (units !== null && !isNaN(+units)) {
			temp = val
			val = units
			units = temp
		}
		units = normalizeUnits(units)
		if (units === 'iyear') {
			this.iYear(this.iYear() + val)
		} else if (units === 'imonth') {
			this.iMonth(this.iMonth() + val)
		} else if (units === 'idate') {
			this.iDate(this.iDate() + val)
		}
		 else {
			moment.fn.add.call(this, val, units)
		}
		return this
	}

	hMoment.fn.subtract = function (val, units) {
		var temp
		if (units !== null && !isNaN(+units)) {
			temp = val
			val = units
			units = temp
		}
		units = normalizeUnits(units)
		if (units === 'iyear') {
			this.iYear(this.iYear() - val)
		} else if (units === 'imonth') {
			this.iMonth(this.iMonth() - val)
		} else if (units === 'idate') {
			this.iDate(this.iDate() - val)
		} else {
			moment.fn.subtract.call(this, val, units)
		}
		return this
	}

	hMoment.fn.startOf = function (units) {
		units = normalizeUnits(units)
		if (units === 'iyear' || units === 'imonth') {
			if (units === 'iyear') {
				this.iMonth(0)
			}
			this.iDate(1)
			this.hours(0)
			this.minutes(0)
			this.seconds(0)
			this.milliseconds(0)
			return this
		} else {
			return moment.fn.startOf.call(this, units)
		}
	}

	hMoment.fn.endOf = function (units) {
		units = normalizeUnits(units)
		if (units === undefined || units === 'milisecond') {
			return this
		}
		return this.startOf(units).add(1, (units === 'isoweek' ? 'week' : units)).subtract(1, 'milliseconds')
	}

	hMoment.fn.clone = function () {
		return hMoment(this)
	}

	hMoment.fn.iYears = hMoment.fn.iYear
	hMoment.fn.iMonths = hMoment.fn.iMonth
	hMoment.fn.iDates = hMoment.fn.iDate
	hMoment.fn.iWeeks = hMoment.fn.iWeek

	/************************************
      hMoment Statics
  ************************************/

	hMoment.iDaysInMonth = function (year, month) {
		var i = getNewMoonMJDNIndex(year, month + 1),
			daysInMonth = ummalqura.ummalquraData[i] - ummalqura.ummalquraData[i - 1]
		return daysInMonth
	}

	function toHijri(gy, gm, gd) {
		var h = d2h(g2d(gy, gm + 1, gd))
		h.hm -= 1
		return h
	}

	function toGregorian(hy, hm, hd) {
		var g = d2g(h2d(hy, hm + 1, hd))
		g.gm -= 1
		return g
	}

	hMoment.iConvert = {
		toHijri: toHijri,
		toGregorian: toGregorian
	}

	return hMoment

	/************************************
      Hijri Conversion
  ************************************/

	/*
    Utility helper functions.
  */

	function div(a, b) {
		return~~ (a / b)
	}

	function mod(a, b) {
		return a - ~~(a / b) * b
	}

	/*
    Converts a date of the Hijri calendar to the Julian Day number.

    @param hy Hijri year (1356 to 1500)
    @param hm Hijri month (1 to 12)
    @param hd Hijri day (1 to 29/30)
    @return Julian Day number
  */

	function h2d(hy, hm, hd) {
		var i = getNewMoonMJDNIndex(hy, hm),
			mjdn = hd + ummalqura.ummalquraData[i - 1] - 1,
			jdn = mjdn + 2400000;
		return jdn
	}

	/*
    Converts the Julian Day number to a date in the Hijri calendar.

    @param jdn Julian Day number
    @return
      hy: Hijri year (1356 to 1500)
      hm: Hijri month (1 to 12)
      hd: Hijri day (1 to 29/30)
  */

	function d2h(jdn) {
		var mjdn = jdn - 2400000,
			i = getNewMoonMJDNIndexByJDN(mjdn),
			totalMonths = i + 16260,
			cYears = Math.floor((totalMonths - 1) / 12),
			hy = cYears + 1,
			hm = totalMonths - 12 * cYears,
			hd = mjdn - ummalqura.ummalquraData[i - 1] + 1

		return {
			hy: hy,
			hm: hm,
			hd: hd
		}
	}

	/*
    Calculates the Julian Day number from Gregorian or Julian
    calendar dates. This integer number corresponds to the noon of
    the date (i.e. 12 hours of Universal Time).
    The procedure was tested to be good since 1 March, -100100 (of both
    calendars) up to a few million years into the future.

    @param gy Calendar year (years BC numbered 0, -1, -2, ...)
    @param gm Calendar month (1 to 12)
    @param gd Calendar day of the month (1 to 28/29/30/31)
    @return Julian Day number
  */

	function g2d(gy, gm, gd) {
		var d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408
		d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752
		return d
	}

	/*
    Calculates Gregorian and Julian calendar dates from the Julian Day number
    (hdn) for the period since jdn=-34839655 (i.e. the year -100100 of both
    calendars) to some millions years ahead of the present.

    @param jdn Julian Day number
    @return
      gy: Calendar year (years BC numbered 0, -1, -2, ...)
      gm: Calendar month (1 to 12)
      gd: Calendar day of the month M (1 to 28/29/30/31)
  */

	function d2g(jdn) {
		var j, i, gd, gm, gy
		j = 4 * jdn + 139361631
		j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
		i = div(mod(j, 1461), 4) * 5 + 308
		gd = div(mod(i, 153), 5) + 1
		gm = mod(div(i, 153), 12) + 1
		gy = div(j, 1461) - 100100 + div(8 - gm, 6)
		return {
			gy: gy,
			gm: gm,
			gd: gd
		}
	}

	/*
    Returns the index of the modified Julian day number of the new moon
    by the given year and month

    @param hy: Hijri year (1356 to 1500)
    @param hm: Hijri month (1 to 12)
    @return
        i: the index of the new moon in modified Julian day number.
  */
	function getNewMoonMJDNIndex(hy, hm) {
		var cYears = hy - 1,
			totalMonths = (cYears * 12) + 1 + (hm - 1),
			i = totalMonths - 16260
		return i
	}

	/*
    Returns the nearest new moon

    @param jdn Julian Day number
    @return
      i: the index of a modified Julian day number.
  */
	function getNewMoonMJDNIndexByJDN(mjdn) {
		for (var i = 0; i < ummalqura.ummalquraData.length; i=i+1) {
			if (ummalqura.ummalquraData[i] > mjdn)
				return i
		}
	}

});

},{"moment":36}],35:[function(require,module,exports){

module.exports = jMoment

var moment = require('moment')
  , jalaali = require('jalaali-js')

/************************************
    Constants
************************************/

var formattingTokens = /(\[[^\[]*\])|(\\)?j(Mo|MM?M?M?|Do|DDDo|DD?D?D?|w[o|w]?|YYYYY|YYYY|YY|gg(ggg?)?|)|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|SS?S?|X|zz?|ZZ?|.)/g
  , localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS?|LL?L?L?|l{1,4})/g

  , parseTokenOneOrTwoDigits = /\d\d?/
  , parseTokenOneToThreeDigits = /\d{1,3}/
  , parseTokenThreeDigits = /\d{3}/
  , parseTokenFourDigits = /\d{1,4}/
  , parseTokenSixDigits = /[+\-]?\d{1,6}/
  , parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i
  , parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/i
  , parseTokenT = /T/i
  , parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/
  , symbolMap = {
    '1': '۱',
    '2': '۲',
    '3': '۳',
    '4': '۴',
    '5': '۵',
    '6': '۶',
    '7': '۷',
    '8': '۸',
    '9': '۹',
    '0': '۰'
  }
  , numberMap = {
    '۱': '1',
    '۲': '2',
    '۳': '3',
    '۴': '4',
    '۵': '5',
    '۶': '6',
    '۷': '7',
    '۸': '8',
    '۹': '9',
    '۰': '0'
  }


  , unitAliases =
    { jm: 'jmonth'
    , jmonths: 'jmonth'
    , jy: 'jyear'
    , jyears: 'jyear'
    }

  , formatFunctions = {}

  , ordinalizeTokens = 'DDD w M D'.split(' ')
  , paddedTokens = 'M D w'.split(' ')

  , formatTokenFunctions =
    { jM: function () {
        return this.jMonth() + 1
      }
    , jMMM: function (format) {
        return this.localeData().jMonthsShort(this, format)
      }
    , jMMMM: function (format) {
        return this.localeData().jMonths(this, format)
      }
    , jD: function () {
        return this.jDate()
      }
    , jDDD: function () {
        return this.jDayOfYear()
      }
    , jw: function () {
        return this.jWeek()
      }
    , jYY: function () {
        return leftZeroFill(this.jYear() % 100, 2)
      }
    , jYYYY: function () {
        return leftZeroFill(this.jYear(), 4)
      }
    , jYYYYY: function () {
        return leftZeroFill(this.jYear(), 5)
      }
    , jgg: function () {
        return leftZeroFill(this.jWeekYear() % 100, 2)
      }
    , jgggg: function () {
        return this.jWeekYear()
      }
    , jggggg: function () {
        return leftZeroFill(this.jWeekYear(), 5)
      }
    }

function padToken(func, count) {
  return function (a) {
    return leftZeroFill(func.call(this, a), count)
  }
}
function ordinalizeToken(func, period) {
  return function (a) {
    return this.localeData().ordinal(func.call(this, a), period)
  }
}

(function () {
  var i
  while (ordinalizeTokens.length) {
    i = ordinalizeTokens.pop()
    formatTokenFunctions['j' + i + 'o'] = ordinalizeToken(formatTokenFunctions['j' + i], i)
  }
  while (paddedTokens.length) {
    i = paddedTokens.pop()
    formatTokenFunctions['j' + i + i] = padToken(formatTokenFunctions['j' + i], 2)
  }
  formatTokenFunctions.jDDDD = padToken(formatTokenFunctions.jDDD, 3)
}())

/************************************
    Helpers
************************************/

function extend(a, b) {
  var key
  for (key in b)
    if (b.hasOwnProperty(key))
      a[key] = b[key]
  return a
}

function leftZeroFill(number, targetLength) {
  var output = number + ''
  while (output.length < targetLength)
    output = '0' + output
  return output
}

function isArray(input) {
  return Object.prototype.toString.call(input) === '[object Array]'
}

// function compareArrays(array1, array2) {
//   var len = Math.min(array1.length, array2.length)
//     , lengthDiff = Math.abs(array1.length - array2.length)
//     , diffs = 0
//     , i
//   for (i = 0; i < len; i += 1)
//     if (~~array1[i] !== ~~array2[i])
//       diffs += 1
//   return diffs + lengthDiff
// }

function normalizeUnits(units) {
  if (units) {
    var lowered = units.toLowerCase()
    units = unitAliases[lowered] || lowered
  }
  return units
}

function setDate(m, year, month, date) {
  var d = m._d
  if (isNaN(year)) {
    m._isValid = false
  }
  if (m._isUTC) {
    /*eslint-disable new-cap*/
    m._d = new Date(Date.UTC(year, month, date,
        d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()))
    /*eslint-enable new-cap*/
  } else {
    m._d = new Date(year, month, date,
        d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds())
  }
}

function objectCreate(parent) {
  function F() {}
  F.prototype = parent
  return new F()
}

function getPrototypeOf(object) {
  if (Object.getPrototypeOf)
    return Object.getPrototypeOf(object)
  else if (''.__proto__)
    return object.__proto__
  else
    return object.constructor.prototype
}

/************************************
    Languages
************************************/
extend(getPrototypeOf(moment.localeData()),
  { _jMonths: [ 'Farvardin'
              , 'Ordibehesht'
              , 'Khordaad'
              , 'Tir'
              , 'Amordaad'
              , 'Shahrivar'
              , 'Mehr'
              , 'Aabaan'
              , 'Aazar'
              , 'Dey'
              , 'Bahman'
              , 'Esfand'
              ]
  , jMonths: function (m) {
      return this._jMonths[m.jMonth()]
    }

  , _jMonthsShort:  [ 'Far'
                    , 'Ord'
                    , 'Kho'
                    , 'Tir'
                    , 'Amo'
                    , 'Sha'
                    , 'Meh'
                    , 'Aab'
                    , 'Aaz'
                    , 'Dey'
                    , 'Bah'
                    , 'Esf'
                    ]
  , jMonthsShort: function (m) {
      return this._jMonthsShort[m.jMonth()]
    }

  , jMonthsParse: function (monthName) {
      var i
        , mom
        , regex
      if (!this._jMonthsParse)
        this._jMonthsParse = []
      for (i = 0; i < 12; i += 1) {
        // Make the regex if we don't have it already.
        if (!this._jMonthsParse[i]) {
          mom = jMoment([2000, (2 + i) % 12, 25])
          regex = '^' + this.jMonths(mom, '') + '|^' + this.jMonthsShort(mom, '')
          this._jMonthsParse[i] = new RegExp(regex.replace('.', ''), 'i')
        }
        // Test the regex.
        if (this._jMonthsParse[i].test(monthName))
          return i
      }
    }
  }
)

/************************************
    Formatting
************************************/

function makeFormatFunction(format) {
  var array = format.match(formattingTokens)
    , length = array.length
    , i

  for (i = 0; i < length; i += 1)
    if (formatTokenFunctions[array[i]])
      array[i] = formatTokenFunctions[array[i]]

  return function (mom) {
    var output = ''
    for (i = 0; i < length; i += 1)
      output += array[i] instanceof Function ? '[' + array[i].call(mom, format) + ']' : array[i]
    return output
  }
}

/************************************
    Parsing
************************************/

function getParseRegexForToken(token, config) {
  switch (token) {
  case 'jDDDD':
    return parseTokenThreeDigits
  case 'jYYYY':
    return parseTokenFourDigits
  case 'jYYYYY':
    return parseTokenSixDigits
  case 'jDDD':
    return parseTokenOneToThreeDigits
  case 'jMMM':
  case 'jMMMM':
    return parseTokenWord
  case 'jMM':
  case 'jDD':
  case 'jYY':
  case 'jM':
  case 'jD':
    return parseTokenOneOrTwoDigits
  case 'DDDD':
    return parseTokenThreeDigits
  case 'YYYY':
    return parseTokenFourDigits
  case 'YYYYY':
    return parseTokenSixDigits
  case 'S':
  case 'SS':
  case 'SSS':
  case 'DDD':
    return parseTokenOneToThreeDigits
  case 'MMM':
  case 'MMMM':
  case 'dd':
  case 'ddd':
  case 'dddd':
    return parseTokenWord
  case 'a':
  case 'A':
    return moment.localeData(config._l)._meridiemParse
  case 'X':
    return parseTokenTimestampMs
  case 'Z':
  case 'ZZ':
    return parseTokenTimezone
  case 'T':
    return parseTokenT
  case 'MM':
  case 'DD':
  case 'YY':
  case 'HH':
  case 'hh':
  case 'mm':
  case 'ss':
  case 'M':
  case 'D':
  case 'd':
  case 'H':
  case 'h':
  case 'm':
  case 's':
    return parseTokenOneOrTwoDigits
  default:
    return new RegExp(token.replace('\\', ''))
  }
}

function addTimeToArrayFromToken(token, input, config) {
  var a
    , datePartArray = config._a

  switch (token) {
  case 'jM':
  case 'jMM':
    datePartArray[1] = input == null ? 0 : ~~input - 1
    break
  case 'jMMM':
  case 'jMMMM':
    a = moment.localeData(config._l).jMonthsParse(input)
    if (a != null)
      datePartArray[1] = a
    else
      config._isValid = false
    break
  case 'jD':
  case 'jDD':
  case 'jDDD':
  case 'jDDDD':
    if (input != null)
      datePartArray[2] = ~~input
    break
  case 'jYY':
    datePartArray[0] = ~~input + (~~input > 47 ? 1300 : 1400)
    break
  case 'jYYYY':
  case 'jYYYYY':
    datePartArray[0] = ~~input
  }
  if (input == null)
    config._isValid = false
}

function dateFromArray(config) {
  var g
    , j
    , jy = config._a[0]
    , jm = config._a[1]
    , jd = config._a[2]

  if ((jy == null) && (jm == null) && (jd == null))
    return [0, 0, 1]
  jy = jy != null ? jy : 0
  jm = jm != null ? jm : 0
  jd = jd != null ? jd : 1
  if (jd < 1 || jd > jMoment.jDaysInMonth(jy, jm) || jm < 0 || jm > 11)
    config._isValid = false
  g = toGregorian(jy, jm, jd)
  j = toJalaali(g.gy, g.gm, g.gd)
  if (isNaN(g.gy))
    config._isValid = false
  config._jDiff = 0
  if (~~j.jy !== jy)
    config._jDiff += 1
  if (~~j.jm !== jm)
    config._jDiff += 1
  if (~~j.jd !== jd)
    config._jDiff += 1
  return [g.gy, g.gm, g.gd]
}

function makeDateFromStringAndFormat(config) {
  var tokens = config._f.match(formattingTokens)
    , string = config._i + ''
    , len = tokens.length
    , i
    , token
    , parsedInput

  config._a = []

  for (i = 0; i < len; i += 1) {
    token = tokens[i]
    parsedInput = (getParseRegexForToken(token, config).exec(string) || [])[0]
    if (parsedInput)
      string = string.slice(string.indexOf(parsedInput) + parsedInput.length)
    if (formatTokenFunctions[token])
      addTimeToArrayFromToken(token, parsedInput, config)
  }
  if (string)
    config._il = string
  return dateFromArray(config)
}

function makeDateFromStringAndArray(config, utc) {
  var len = config._f.length
    , i
    , format
    , tempMoment
    , bestMoment
    , currentScore
    , scoreToBeat

  if (len === 0) {
    return makeMoment(new Date(NaN))
  }

  for (i = 0; i < len; i += 1) {
    format = config._f[i]
    currentScore = 0
    tempMoment = makeMoment(config._i, format, config._l, config._strict, utc)

    if (!tempMoment.isValid()) continue

    // currentScore = compareArrays(tempMoment._a, tempMoment.toArray())
    currentScore += tempMoment._jDiff
    if (tempMoment._il)
      currentScore += tempMoment._il.length
    if (scoreToBeat == null || currentScore < scoreToBeat) {
      scoreToBeat = currentScore
      bestMoment = tempMoment
    }
  }

  return bestMoment
}

function removeParsedTokens(config) {
  var string = config._i + ''
    , input = ''
    , format = ''
    , array = config._f.match(formattingTokens)
    , len = array.length
    , i
    , match
    , parsed

  for (i = 0; i < len; i += 1) {
    match = array[i]
    parsed = (getParseRegexForToken(match, config).exec(string) || [])[0]
    if (parsed)
      string = string.slice(string.indexOf(parsed) + parsed.length)
    if (!(formatTokenFunctions[match] instanceof Function)) {
      format += match
      if (parsed)
        input += parsed
    }
  }
  config._i = input
  config._f = format
}

/************************************
    Week of Year
************************************/

function jWeekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
  var end = firstDayOfWeekOfYear - firstDayOfWeek
    , daysToDayOfWeek = firstDayOfWeekOfYear - mom.day()
    , adjustedMoment

  if (daysToDayOfWeek > end) {
    daysToDayOfWeek -= 7
  }
  if (daysToDayOfWeek < end - 7) {
    daysToDayOfWeek += 7
  }
  adjustedMoment = jMoment(mom).add(daysToDayOfWeek, 'd')
  return  { week: Math.ceil(adjustedMoment.jDayOfYear() / 7)
          , year: adjustedMoment.jYear()
          }
}

/************************************
    Top Level Functions
************************************/
var maxTimestamp = 57724432199999

function makeMoment(input, format, lang, strict, utc) {
  if (typeof lang === 'boolean') {
    strict = lang
    lang = undefined
  }

  if (format && typeof format === 'string')
    format = fixFormat(format, moment)

  var config =
      { _i: input
      , _f: format
      , _l: lang
      , _strict: strict
      , _isUTC: utc
      }
    , date
    , m
    , jm
    , origInput = input
    , origFormat = format
  if (format) {
    if (isArray(format)) {
      return makeDateFromStringAndArray(config, utc)
    } else {
      date = makeDateFromStringAndFormat(config)
      removeParsedTokens(config)
      format = 'YYYY-MM-DD-' + config._f
      input = leftZeroFill(date[0], 4) + '-'
            + leftZeroFill(date[1] + 1, 2) + '-'
            + leftZeroFill(date[2], 2) + '-'
            + config._i
    }
  }
  if (utc)
    m = moment.utc(input, format, lang, strict)
  else
    m = moment(input, format, lang, strict)
  if (config._isValid === false)
    m._isValid = false
  m._jDiff = config._jDiff || 0
  jm = objectCreate(jMoment.fn)
  extend(jm, m)
  if (strict && format && jm.isValid()) {
    jm._isValid = jm.format(origFormat) === origInput
  }
  if (m._d.getTime() > maxTimestamp) {
    jm._isValid = false
  }
  return jm
}

function jMoment(input, format, lang, strict) {
  return makeMoment(input, format, lang, strict, false)
}

extend(jMoment, moment)
jMoment.fn = objectCreate(moment.fn)

jMoment.utc = function (input, format, lang, strict) {
  return makeMoment(input, format, lang, strict, true)
}

jMoment.unix = function (input) {
  return makeMoment(input * 1000)
}

/************************************
    jMoment Prototype
************************************/

function fixFormat(format, _moment) {
  var i = 5
  var replace = function (input) {
    return _moment.localeData().longDateFormat(input) || input
  }
  while (i > 0 && localFormattingTokens.test(format)) {
    i -= 1
    format = format.replace(localFormattingTokens, replace)
  }
  return format
}

jMoment.fn.format = function (format) {

  if (format) {
    format = fixFormat(format, this)

    if (!formatFunctions[format]) {
      formatFunctions[format] = makeFormatFunction(format)
    }
    format = formatFunctions[format](this)
  }
  return moment.fn.format.call(this, format)
}

jMoment.fn.jYear = function (input) {
  var lastDay
    , j
    , g
  if (typeof input === 'number') {
    j = toJalaali(this.year(), this.month(), this.date())
    lastDay = Math.min(j.jd, jMoment.jDaysInMonth(input, j.jm))
    g = toGregorian(input, j.jm, lastDay)
    setDate(this, g.gy, g.gm, g.gd)
    moment.updateOffset(this)
    return this
  } else {
    return toJalaali(this.year(), this.month(), this.date()).jy
  }
}

jMoment.fn.jMonth = function (input) {
  var lastDay
    , j
    , g
  if (input != null) {
    if (typeof input === 'string') {
      input = this.localeData().jMonthsParse(input)
      if (typeof input !== 'number')
        return this
    }
    j = toJalaali(this.year(), this.month(), this.date())
    lastDay = Math.min(j.jd, jMoment.jDaysInMonth(j.jy, input))
    this.jYear(j.jy + div(input, 12))
    input = mod(input, 12)
    if (input < 0) {
      input += 12
      this.jYear(this.jYear() - 1)
    }
    g = toGregorian(this.jYear(), input, lastDay)
    setDate(this, g.gy, g.gm, g.gd)
    moment.updateOffset(this)
    return this
  } else {
    return toJalaali(this.year(), this.month(), this.date()).jm
  }
}

jMoment.fn.jDate = function (input) {
  var j
    , g
  if (typeof input === 'number') {
    j = toJalaali(this.year(), this.month(), this.date())
    g = toGregorian(j.jy, j.jm, input)
    setDate(this, g.gy, g.gm, g.gd)
    moment.updateOffset(this)
    return this
  } else {
    return toJalaali(this.year(), this.month(), this.date()).jd
  }
}

jMoment.fn.jDayOfYear = function (input) {
  var dayOfYear = Math.round((jMoment(this).startOf('day') - jMoment(this).startOf('jYear')) / 864e5) + 1
  return input == null ? dayOfYear : this.add(input - dayOfYear, 'd')
}

jMoment.fn.jWeek = function (input) {
  var week = jWeekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).week
  return input == null ? week : this.add((input - week) * 7, 'd')
}

jMoment.fn.jWeekYear = function (input) {
  var year = jWeekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).year
  return input == null ? year : this.add(input - year, 'y')
}

jMoment.fn.add = function (val, units) {
  var temp
  if (units !== null && !isNaN(+units)) {
    temp = val
    val = units
    units = temp
  }
  units = normalizeUnits(units)
  if (units === 'jyear') {
    this.jYear(this.jYear() + val)
  } else if (units === 'jmonth') {
    this.jMonth(this.jMonth() + val)
  } else {
    moment.fn.add.call(this, val, units)
    if (isNaN(this.jYear())) {
      this._isValid = false
    }
  }
  return this
}

jMoment.fn.subtract = function (val, units) {
  var temp
  if (units !== null && !isNaN(+units)) {
    temp = val
    val = units
    units = temp
  }
  units = normalizeUnits(units)
  if (units === 'jyear') {
    this.jYear(this.jYear() - val)
  } else if (units === 'jmonth') {
    this.jMonth(this.jMonth() - val)
  } else {
    moment.fn.subtract.call(this, val, units)
  }
  return this
}

jMoment.fn.startOf = function (units) {
  units = normalizeUnits(units)
  if (units === 'jyear' || units === 'jmonth') {
    if (units === 'jyear') {
      this.jMonth(0)
    }
    this.jDate(1)
    this.hours(0)
    this.minutes(0)
    this.seconds(0)
    this.milliseconds(0)
    return this
  } else {
    return moment.fn.startOf.call(this, units)
  }
}

jMoment.fn.endOf = function (units) {
  units = normalizeUnits(units)
  if (units === undefined || units === 'milisecond') {
    return this
  }
  return this.startOf(units).add(1, (units === 'isoweek' ? 'week' : units)).subtract(1, 'ms')
}

jMoment.fn.isSame = function (other, units) {
  units = normalizeUnits(units)
  if (units === 'jyear' || units === 'jmonth') {
    return moment.fn.isSame.call(this.startOf(units), other.startOf(units))
  }
  return moment.fn.isSame.call(this, other, units)
}

jMoment.fn.clone = function () {
  return jMoment(this)
}

jMoment.fn.jYears = jMoment.fn.jYear
jMoment.fn.jMonths = jMoment.fn.jMonth
jMoment.fn.jDates = jMoment.fn.jDate
jMoment.fn.jWeeks = jMoment.fn.jWeek

/************************************
    jMoment Statics
************************************/

jMoment.jDaysInMonth = function (year, month) {
  year += div(month, 12)
  month = mod(month, 12)
  if (month < 0) {
    month += 12
    year -= 1
  }
  if (month < 6) {
    return 31
  } else if (month < 11) {
    return 30
  } else if (jMoment.jIsLeapYear(year)) {
    return 30
  } else {
    return 29
  }
}

jMoment.jIsLeapYear = jalaali.isLeapJalaaliYear

jMoment.loadPersian = function (args) {
  var usePersianDigits =  args !== undefined && args.hasOwnProperty('usePersianDigits') ? args.usePersianDigits : false
  var dialect =  args !== undefined && args.hasOwnProperty('dialect') ? args.dialect : 'persian'
  moment.locale('fa')
  moment.updateLocale('fa'
  , { months: ('ژانویه_فوریه_مارس_آوریل_مه_ژوئن_ژوئیه_اوت_سپتامبر_اکتبر_نوامبر_دسامبر').split('_')
    , monthsShort: ('ژانویه_فوریه_مارس_آوریل_مه_ژوئن_ژوئیه_اوت_سپتامبر_اکتبر_نوامبر_دسامبر').split('_')
    , weekdays:
      {
        'persian': ('یک\u200cشنبه_دوشنبه_سه\u200cشنبه_چهارشنبه_پنج\u200cشنبه_آدینه_شنبه').split('_'),
        'persian-modern': ('یک\u200cشنبه_دوشنبه_سه\u200cشنبه_چهارشنبه_پنج\u200cشنبه_جمعه_شنبه').split('_')
      }[dialect]
    , weekdaysShort:
      {
        'persian': ('یک\u200cشنبه_دوشنبه_سه\u200cشنبه_چهارشنبه_پنج\u200cشنبه_آدینه_شنبه').split('_'),
        'persian-modern': ('یک\u200cشنبه_دوشنبه_سه\u200cشنبه_چهارشنبه_پنج\u200cشنبه_جمعه_شنبه').split('_')
      }[dialect]
    , weekdaysMin:
      {
        'persian': 'ی_د_س_چ_پ_آ_ش'.split('_'),
        'persian-modern': 'ی_د_س_چ_پ_ج_ش'.split('_')
      }[dialect]
    , longDateFormat:
      { LT: 'HH:mm'
      , L: 'jYYYY/jMM/jDD'
      , LL: 'jD jMMMM jYYYY'
      , LLL: 'jD jMMMM jYYYY LT'
      , LLLL: 'dddd، jD jMMMM jYYYY LT'
      }
    , calendar:
      { sameDay: '[امروز ساعت] LT'
      , nextDay: '[فردا ساعت] LT'
      , nextWeek: 'dddd [ساعت] LT'
      , lastDay: '[دیروز ساعت] LT'
      , lastWeek: 'dddd [ی پیش ساعت] LT'
      , sameElse: 'L'
      }
    , relativeTime:
      { future: 'در %s'
      , past: '%s پیش'
      , s: 'چند ثانیه'
      , m: '1 دقیقه'
      , mm: '%d دقیقه'
      , h: '1 ساعت'
      , hh: '%d ساعت'
      , d: '1 روز'
      , dd: '%d روز'
      , M: '1 ماه'
      , MM: '%d ماه'
      , y: '1 سال'
      , yy: '%d سال'
      }
    , preparse: function (string) {
        if (usePersianDigits) {
          return string.replace(/[۰-۹]/g, function (match) {
            return numberMap[match]
          }).replace(/،/g, ',')
        }
        return string
    }
    , postformat: function (string) {
        if (usePersianDigits) {
          return string.replace(/\d/g, function (match) {
            return symbolMap[match]
          }).replace(/,/g, '،')
        }
        return string
    }
    , ordinal: '%dم'
    , week:
      { dow: 6 // Saturday is the first day of the week.
      , doy: 12 // The week that contains Jan 1st is the first week of the year.
      }
    , meridiem: function (hour) {
        return hour < 12 ? 'ق.ظ' : 'ب.ظ'
      }
    , jMonths:
      {
        'persian': ('فروردین_اردیبهشت_خرداد_تیر_امرداد_شهریور_مهر_آبان_آذر_دی_بهمن_اسفند').split('_'),
        'persian-modern': ('فروردین_اردیبهشت_خرداد_تیر_مرداد_شهریور_مهر_آبان_آذر_دی_بهمن_اسفند').split('_')
      }[dialect]
    , jMonthsShort:
      {
        'persian': 'فرو_ارد_خرد_تیر_امر_شهر_مهر_آبا_آذر_دی_بهم_اسف'.split('_'),
        'persian-modern': 'فرو_ارد_خرد_تیر_مرد_شهر_مهر_آبا_آذر_دی_بهم_اسف'.split('_')
      }[dialect]
    }
  )
}

jMoment.jConvert =  { toJalaali: toJalaali
                    , toGregorian: toGregorian
                    }

/************************************
    Jalaali Conversion
************************************/

function toJalaali(gy, gm, gd) {
  try {
    var j = jalaali.toJalaali(gy, gm + 1, gd)
    j.jm -= 1
    return j
  } catch (e) {
    return {
      jy: NaN
      , jm: NaN
      , jd: NaN
    }
  }
}

function toGregorian(jy, jm, jd) {
  try {
    var g = jalaali.toGregorian(jy, jm + 1, jd)
    g.gm -= 1
    return g
  } catch (e) {
    return {
      gy: NaN
      , gm: NaN
      , gd: NaN
    }
  }
}

/*
  Utility helper functions.
*/

function div(a, b) {
  return ~~(a / b)
}

function mod(a, b) {
  return a - ~~(a / b) * b
}

},{"jalaali-js":32,"moment":36}],36:[function(require,module,exports){
//! moment.js
//! version : 2.27.0
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, (function () { 'use strict';

    var hookCallback;

    function hooks() {
        return hookCallback.apply(null, arguments);
    }

    // This is done to register the method called with moment()
    // without creating circular dependencies.
    function setHookCallback(callback) {
        hookCallback = callback;
    }

    function isArray(input) {
        return (
            input instanceof Array ||
            Object.prototype.toString.call(input) === '[object Array]'
        );
    }

    function isObject(input) {
        // IE8 will treat undefined and null as object if it wasn't for
        // input != null
        return (
            input != null &&
            Object.prototype.toString.call(input) === '[object Object]'
        );
    }

    function hasOwnProp(a, b) {
        return Object.prototype.hasOwnProperty.call(a, b);
    }

    function isObjectEmpty(obj) {
        if (Object.getOwnPropertyNames) {
            return Object.getOwnPropertyNames(obj).length === 0;
        } else {
            var k;
            for (k in obj) {
                if (hasOwnProp(obj, k)) {
                    return false;
                }
            }
            return true;
        }
    }

    function isUndefined(input) {
        return input === void 0;
    }

    function isNumber(input) {
        return (
            typeof input === 'number' ||
            Object.prototype.toString.call(input) === '[object Number]'
        );
    }

    function isDate(input) {
        return (
            input instanceof Date ||
            Object.prototype.toString.call(input) === '[object Date]'
        );
    }

    function map(arr, fn) {
        var res = [],
            i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function createUTC(input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, true).utc();
    }

    function defaultParsingFlags() {
        // We need to deep clone this object.
        return {
            empty: false,
            unusedTokens: [],
            unusedInput: [],
            overflow: -2,
            charsLeftOver: 0,
            nullInput: false,
            invalidEra: null,
            invalidMonth: null,
            invalidFormat: false,
            userInvalidated: false,
            iso: false,
            parsedDateParts: [],
            era: null,
            meridiem: null,
            rfc2822: false,
            weekdayMismatch: false,
        };
    }

    function getParsingFlags(m) {
        if (m._pf == null) {
            m._pf = defaultParsingFlags();
        }
        return m._pf;
    }

    var some;
    if (Array.prototype.some) {
        some = Array.prototype.some;
    } else {
        some = function (fun) {
            var t = Object(this),
                len = t.length >>> 0,
                i;

            for (i = 0; i < len; i++) {
                if (i in t && fun.call(this, t[i], i, t)) {
                    return true;
                }
            }

            return false;
        };
    }

    function isValid(m) {
        if (m._isValid == null) {
            var flags = getParsingFlags(m),
                parsedParts = some.call(flags.parsedDateParts, function (i) {
                    return i != null;
                }),
                isNowValid =
                    !isNaN(m._d.getTime()) &&
                    flags.overflow < 0 &&
                    !flags.empty &&
                    !flags.invalidEra &&
                    !flags.invalidMonth &&
                    !flags.invalidWeekday &&
                    !flags.weekdayMismatch &&
                    !flags.nullInput &&
                    !flags.invalidFormat &&
                    !flags.userInvalidated &&
                    (!flags.meridiem || (flags.meridiem && parsedParts));

            if (m._strict) {
                isNowValid =
                    isNowValid &&
                    flags.charsLeftOver === 0 &&
                    flags.unusedTokens.length === 0 &&
                    flags.bigHour === undefined;
            }

            if (Object.isFrozen == null || !Object.isFrozen(m)) {
                m._isValid = isNowValid;
            } else {
                return isNowValid;
            }
        }
        return m._isValid;
    }

    function createInvalid(flags) {
        var m = createUTC(NaN);
        if (flags != null) {
            extend(getParsingFlags(m), flags);
        } else {
            getParsingFlags(m).userInvalidated = true;
        }

        return m;
    }

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    var momentProperties = (hooks.momentProperties = []),
        updateInProgress = false;

    function copyConfig(to, from) {
        var i, prop, val;

        if (!isUndefined(from._isAMomentObject)) {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (!isUndefined(from._i)) {
            to._i = from._i;
        }
        if (!isUndefined(from._f)) {
            to._f = from._f;
        }
        if (!isUndefined(from._l)) {
            to._l = from._l;
        }
        if (!isUndefined(from._strict)) {
            to._strict = from._strict;
        }
        if (!isUndefined(from._tzm)) {
            to._tzm = from._tzm;
        }
        if (!isUndefined(from._isUTC)) {
            to._isUTC = from._isUTC;
        }
        if (!isUndefined(from._offset)) {
            to._offset = from._offset;
        }
        if (!isUndefined(from._pf)) {
            to._pf = getParsingFlags(from);
        }
        if (!isUndefined(from._locale)) {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i = 0; i < momentProperties.length; i++) {
                prop = momentProperties[i];
                val = from[prop];
                if (!isUndefined(val)) {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    // Moment prototype object
    function Moment(config) {
        copyConfig(this, config);
        this._d = new Date(config._d != null ? config._d.getTime() : NaN);
        if (!this.isValid()) {
            this._d = new Date(NaN);
        }
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            hooks.updateOffset(this);
            updateInProgress = false;
        }
    }

    function isMoment(obj) {
        return (
            obj instanceof Moment || (obj != null && obj._isAMomentObject != null)
        );
    }

    function warn(msg) {
        if (
            hooks.suppressDeprecationWarnings === false &&
            typeof console !== 'undefined' &&
            console.warn
        ) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;

        return extend(function () {
            if (hooks.deprecationHandler != null) {
                hooks.deprecationHandler(null, msg);
            }
            if (firstTime) {
                var args = [],
                    arg,
                    i,
                    key;
                for (i = 0; i < arguments.length; i++) {
                    arg = '';
                    if (typeof arguments[i] === 'object') {
                        arg += '\n[' + i + '] ';
                        for (key in arguments[0]) {
                            if (hasOwnProp(arguments[0], key)) {
                                arg += key + ': ' + arguments[0][key] + ', ';
                            }
                        }
                        arg = arg.slice(0, -2); // Remove trailing comma and space
                    } else {
                        arg = arguments[i];
                    }
                    args.push(arg);
                }
                warn(
                    msg +
                        '\nArguments: ' +
                        Array.prototype.slice.call(args).join('') +
                        '\n' +
                        new Error().stack
                );
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    var deprecations = {};

    function deprecateSimple(name, msg) {
        if (hooks.deprecationHandler != null) {
            hooks.deprecationHandler(name, msg);
        }
        if (!deprecations[name]) {
            warn(msg);
            deprecations[name] = true;
        }
    }

    hooks.suppressDeprecationWarnings = false;
    hooks.deprecationHandler = null;

    function isFunction(input) {
        return (
            (typeof Function !== 'undefined' && input instanceof Function) ||
            Object.prototype.toString.call(input) === '[object Function]'
        );
    }

    function set(config) {
        var prop, i;
        for (i in config) {
            if (hasOwnProp(config, i)) {
                prop = config[i];
                if (isFunction(prop)) {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
        }
        this._config = config;
        // Lenient ordinal parsing accepts just a number in addition to
        // number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
        // TODO: Remove "ordinalParse" fallback in next major release.
        this._dayOfMonthOrdinalParseLenient = new RegExp(
            (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) +
                '|' +
                /\d{1,2}/.source
        );
    }

    function mergeConfigs(parentConfig, childConfig) {
        var res = extend({}, parentConfig),
            prop;
        for (prop in childConfig) {
            if (hasOwnProp(childConfig, prop)) {
                if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                    res[prop] = {};
                    extend(res[prop], parentConfig[prop]);
                    extend(res[prop], childConfig[prop]);
                } else if (childConfig[prop] != null) {
                    res[prop] = childConfig[prop];
                } else {
                    delete res[prop];
                }
            }
        }
        for (prop in parentConfig) {
            if (
                hasOwnProp(parentConfig, prop) &&
                !hasOwnProp(childConfig, prop) &&
                isObject(parentConfig[prop])
            ) {
                // make sure changes to properties don't modify parent config
                res[prop] = extend({}, res[prop]);
            }
        }
        return res;
    }

    function Locale(config) {
        if (config != null) {
            this.set(config);
        }
    }

    var keys;

    if (Object.keys) {
        keys = Object.keys;
    } else {
        keys = function (obj) {
            var i,
                res = [];
            for (i in obj) {
                if (hasOwnProp(obj, i)) {
                    res.push(i);
                }
            }
            return res;
        };
    }

    var defaultCalendar = {
        sameDay: '[Today at] LT',
        nextDay: '[Tomorrow at] LT',
        nextWeek: 'dddd [at] LT',
        lastDay: '[Yesterday at] LT',
        lastWeek: '[Last] dddd [at] LT',
        sameElse: 'L',
    };

    function calendar(key, mom, now) {
        var output = this._calendar[key] || this._calendar['sameElse'];
        return isFunction(output) ? output.call(mom, now) : output;
    }

    function zeroFill(number, targetLength, forceSign) {
        var absNumber = '' + Math.abs(number),
            zerosToFill = targetLength - absNumber.length,
            sign = number >= 0;
        return (
            (sign ? (forceSign ? '+' : '') : '-') +
            Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) +
            absNumber
        );
    }

    var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|N{1,5}|YYYYYY|YYYYY|YYYY|YY|y{2,4}|yo?|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,
        formatFunctions = {},
        formatTokenFunctions = {};

    // token:    'M'
    // padded:   ['MM', 2]
    // ordinal:  'Mo'
    // callback: function () { this.month() + 1 }
    function addFormatToken(token, padded, ordinal, callback) {
        var func = callback;
        if (typeof callback === 'string') {
            func = function () {
                return this[callback]();
            };
        }
        if (token) {
            formatTokenFunctions[token] = func;
        }
        if (padded) {
            formatTokenFunctions[padded[0]] = function () {
                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
            };
        }
        if (ordinal) {
            formatTokenFunctions[ordinal] = function () {
                return this.localeData().ordinal(
                    func.apply(this, arguments),
                    token
                );
            };
        }
    }

    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens),
            i,
            length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '',
                i;
            for (i = 0; i < length; i++) {
                output += isFunction(array[i])
                    ? array[i].call(mom, format)
                    : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());
        formatFunctions[format] =
            formatFunctions[format] || makeFormatFunction(format);

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(
                localFormattingTokens,
                replaceLongDateFormatTokens
            );
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }

    var defaultLongDateFormat = {
        LTS: 'h:mm:ss A',
        LT: 'h:mm A',
        L: 'MM/DD/YYYY',
        LL: 'MMMM D, YYYY',
        LLL: 'MMMM D, YYYY h:mm A',
        LLLL: 'dddd, MMMM D, YYYY h:mm A',
    };

    function longDateFormat(key) {
        var format = this._longDateFormat[key],
            formatUpper = this._longDateFormat[key.toUpperCase()];

        if (format || !formatUpper) {
            return format;
        }

        this._longDateFormat[key] = formatUpper
            .match(formattingTokens)
            .map(function (tok) {
                if (
                    tok === 'MMMM' ||
                    tok === 'MM' ||
                    tok === 'DD' ||
                    tok === 'dddd'
                ) {
                    return tok.slice(1);
                }
                return tok;
            })
            .join('');

        return this._longDateFormat[key];
    }

    var defaultInvalidDate = 'Invalid date';

    function invalidDate() {
        return this._invalidDate;
    }

    var defaultOrdinal = '%d',
        defaultDayOfMonthOrdinalParse = /\d{1,2}/;

    function ordinal(number) {
        return this._ordinal.replace('%d', number);
    }

    var defaultRelativeTime = {
        future: 'in %s',
        past: '%s ago',
        s: 'a few seconds',
        ss: '%d seconds',
        m: 'a minute',
        mm: '%d minutes',
        h: 'an hour',
        hh: '%d hours',
        d: 'a day',
        dd: '%d days',
        w: 'a week',
        ww: '%d weeks',
        M: 'a month',
        MM: '%d months',
        y: 'a year',
        yy: '%d years',
    };

    function relativeTime(number, withoutSuffix, string, isFuture) {
        var output = this._relativeTime[string];
        return isFunction(output)
            ? output(number, withoutSuffix, string, isFuture)
            : output.replace(/%d/i, number);
    }

    function pastFuture(diff, output) {
        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
        return isFunction(format) ? format(output) : format.replace(/%s/i, output);
    }

    var aliases = {};

    function addUnitAlias(unit, shorthand) {
        var lowerCase = unit.toLowerCase();
        aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
    }

    function normalizeUnits(units) {
        return typeof units === 'string'
            ? aliases[units] || aliases[units.toLowerCase()]
            : undefined;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    var priorities = {};

    function addUnitPriority(unit, priority) {
        priorities[unit] = priority;
    }

    function getPrioritizedUnits(unitsObj) {
        var units = [],
            u;
        for (u in unitsObj) {
            if (hasOwnProp(unitsObj, u)) {
                units.push({ unit: u, priority: priorities[u] });
            }
        }
        units.sort(function (a, b) {
            return a.priority - b.priority;
        });
        return units;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function absFloor(number) {
        if (number < 0) {
            // -0 -> 0
            return Math.ceil(number) || 0;
        } else {
            return Math.floor(number);
        }
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            value = absFloor(coercedNumber);
        }

        return value;
    }

    function makeGetSet(unit, keepTime) {
        return function (value) {
            if (value != null) {
                set$1(this, unit, value);
                hooks.updateOffset(this, keepTime);
                return this;
            } else {
                return get(this, unit);
            }
        };
    }

    function get(mom, unit) {
        return mom.isValid()
            ? mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]()
            : NaN;
    }

    function set$1(mom, unit, value) {
        if (mom.isValid() && !isNaN(value)) {
            if (
                unit === 'FullYear' &&
                isLeapYear(mom.year()) &&
                mom.month() === 1 &&
                mom.date() === 29
            ) {
                value = toInt(value);
                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](
                    value,
                    mom.month(),
                    daysInMonth(value, mom.month())
                );
            } else {
                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
            }
        }
    }

    // MOMENTS

    function stringGet(units) {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
            return this[units]();
        }
        return this;
    }

    function stringSet(units, value) {
        if (typeof units === 'object') {
            units = normalizeObjectUnits(units);
            var prioritized = getPrioritizedUnits(units),
                i;
            for (i = 0; i < prioritized.length; i++) {
                this[prioritized[i].unit](units[prioritized[i].unit]);
            }
        } else {
            units = normalizeUnits(units);
            if (isFunction(this[units])) {
                return this[units](value);
            }
        }
        return this;
    }

    var match1 = /\d/, //       0 - 9
        match2 = /\d\d/, //      00 - 99
        match3 = /\d{3}/, //     000 - 999
        match4 = /\d{4}/, //    0000 - 9999
        match6 = /[+-]?\d{6}/, // -999999 - 999999
        match1to2 = /\d\d?/, //       0 - 99
        match3to4 = /\d\d\d\d?/, //     999 - 9999
        match5to6 = /\d\d\d\d\d\d?/, //   99999 - 999999
        match1to3 = /\d{1,3}/, //       0 - 999
        match1to4 = /\d{1,4}/, //       0 - 9999
        match1to6 = /[+-]?\d{1,6}/, // -999999 - 999999
        matchUnsigned = /\d+/, //       0 - inf
        matchSigned = /[+-]?\d+/, //    -inf - inf
        matchOffset = /Z|[+-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
        matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi, // +00 -00 +00:00 -00:00 +0000 -0000 or Z
        matchTimestamp = /[+-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123
        // any word (or two) characters or numbers including two/three word month in arabic.
        // includes scottish gaelic two word and hyphenated months
        matchWord = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i,
        regexes;

    regexes = {};

    function addRegexToken(token, regex, strictRegex) {
        regexes[token] = isFunction(regex)
            ? regex
            : function (isStrict, localeData) {
                  return isStrict && strictRegex ? strictRegex : regex;
              };
    }

    function getParseRegexForToken(token, config) {
        if (!hasOwnProp(regexes, token)) {
            return new RegExp(unescapeFormat(token));
        }

        return regexes[token](config._strict, config._locale);
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function unescapeFormat(s) {
        return regexEscape(
            s
                .replace('\\', '')
                .replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (
                    matched,
                    p1,
                    p2,
                    p3,
                    p4
                ) {
                    return p1 || p2 || p3 || p4;
                })
        );
    }

    function regexEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    var tokens = {};

    function addParseToken(token, callback) {
        var i,
            func = callback;
        if (typeof token === 'string') {
            token = [token];
        }
        if (isNumber(callback)) {
            func = function (input, array) {
                array[callback] = toInt(input);
            };
        }
        for (i = 0; i < token.length; i++) {
            tokens[token[i]] = func;
        }
    }

    function addWeekParseToken(token, callback) {
        addParseToken(token, function (input, array, config, token) {
            config._w = config._w || {};
            callback(input, config._w, config, token);
        });
    }

    function addTimeToArrayFromToken(token, input, config) {
        if (input != null && hasOwnProp(tokens, token)) {
            tokens[token](input, config._a, config, token);
        }
    }

    var YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,
        WEEK = 7,
        WEEKDAY = 8;

    function mod(n, x) {
        return ((n % x) + x) % x;
    }

    var indexOf;

    if (Array.prototype.indexOf) {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function (o) {
            // I know
            var i;
            for (i = 0; i < this.length; ++i) {
                if (this[i] === o) {
                    return i;
                }
            }
            return -1;
        };
    }

    function daysInMonth(year, month) {
        if (isNaN(year) || isNaN(month)) {
            return NaN;
        }
        var modMonth = mod(month, 12);
        year += (month - modMonth) / 12;
        return modMonth === 1
            ? isLeapYear(year)
                ? 29
                : 28
            : 31 - ((modMonth % 7) % 2);
    }

    // FORMATTING

    addFormatToken('M', ['MM', 2], 'Mo', function () {
        return this.month() + 1;
    });

    addFormatToken('MMM', 0, 0, function (format) {
        return this.localeData().monthsShort(this, format);
    });

    addFormatToken('MMMM', 0, 0, function (format) {
        return this.localeData().months(this, format);
    });

    // ALIASES

    addUnitAlias('month', 'M');

    // PRIORITY

    addUnitPriority('month', 8);

    // PARSING

    addRegexToken('M', match1to2);
    addRegexToken('MM', match1to2, match2);
    addRegexToken('MMM', function (isStrict, locale) {
        return locale.monthsShortRegex(isStrict);
    });
    addRegexToken('MMMM', function (isStrict, locale) {
        return locale.monthsRegex(isStrict);
    });

    addParseToken(['M', 'MM'], function (input, array) {
        array[MONTH] = toInt(input) - 1;
    });

    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
        var month = config._locale.monthsParse(input, token, config._strict);
        // if we didn't find a month name, mark the date as invalid.
        if (month != null) {
            array[MONTH] = month;
        } else {
            getParsingFlags(config).invalidMonth = input;
        }
    });

    // LOCALES

    var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
            '_'
        ),
        defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split(
            '_'
        ),
        MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,
        defaultMonthsShortRegex = matchWord,
        defaultMonthsRegex = matchWord;

    function localeMonths(m, format) {
        if (!m) {
            return isArray(this._months)
                ? this._months
                : this._months['standalone'];
        }
        return isArray(this._months)
            ? this._months[m.month()]
            : this._months[
                  (this._months.isFormat || MONTHS_IN_FORMAT).test(format)
                      ? 'format'
                      : 'standalone'
              ][m.month()];
    }

    function localeMonthsShort(m, format) {
        if (!m) {
            return isArray(this._monthsShort)
                ? this._monthsShort
                : this._monthsShort['standalone'];
        }
        return isArray(this._monthsShort)
            ? this._monthsShort[m.month()]
            : this._monthsShort[
                  MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'
              ][m.month()];
    }

    function handleStrictParse(monthName, format, strict) {
        var i,
            ii,
            mom,
            llc = monthName.toLocaleLowerCase();
        if (!this._monthsParse) {
            // this is not used
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
            for (i = 0; i < 12; ++i) {
                mom = createUTC([2000, i]);
                this._shortMonthsParse[i] = this.monthsShort(
                    mom,
                    ''
                ).toLocaleLowerCase();
                this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeMonthsParse(monthName, format, strict) {
        var i, mom, regex;

        if (this._monthsParseExact) {
            return handleStrictParse.call(this, monthName, format, strict);
        }

        if (!this._monthsParse) {
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
        }

        // TODO: add sorting
        // Sorting makes sure if one month (or abbr) is a prefix of another
        // see sorting in computeMonthsParse
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, i]);
            if (strict && !this._longMonthsParse[i]) {
                this._longMonthsParse[i] = new RegExp(
                    '^' + this.months(mom, '').replace('.', '') + '$',
                    'i'
                );
                this._shortMonthsParse[i] = new RegExp(
                    '^' + this.monthsShort(mom, '').replace('.', '') + '$',
                    'i'
                );
            }
            if (!strict && !this._monthsParse[i]) {
                regex =
                    '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (
                strict &&
                format === 'MMMM' &&
                this._longMonthsParse[i].test(monthName)
            ) {
                return i;
            } else if (
                strict &&
                format === 'MMM' &&
                this._shortMonthsParse[i].test(monthName)
            ) {
                return i;
            } else if (!strict && this._monthsParse[i].test(monthName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function setMonth(mom, value) {
        var dayOfMonth;

        if (!mom.isValid()) {
            // No op
            return mom;
        }

        if (typeof value === 'string') {
            if (/^\d+$/.test(value)) {
                value = toInt(value);
            } else {
                value = mom.localeData().monthsParse(value);
                // TODO: Another silent failure?
                if (!isNumber(value)) {
                    return mom;
                }
            }
        }

        dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function getSetMonth(value) {
        if (value != null) {
            setMonth(this, value);
            hooks.updateOffset(this, true);
            return this;
        } else {
            return get(this, 'Month');
        }
    }

    function getDaysInMonth() {
        return daysInMonth(this.year(), this.month());
    }

    function monthsShortRegex(isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsShortStrictRegex;
            } else {
                return this._monthsShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsShortRegex')) {
                this._monthsShortRegex = defaultMonthsShortRegex;
            }
            return this._monthsShortStrictRegex && isStrict
                ? this._monthsShortStrictRegex
                : this._monthsShortRegex;
        }
    }

    function monthsRegex(isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsStrictRegex;
            } else {
                return this._monthsRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsRegex')) {
                this._monthsRegex = defaultMonthsRegex;
            }
            return this._monthsStrictRegex && isStrict
                ? this._monthsStrictRegex
                : this._monthsRegex;
        }
    }

    function computeMonthsParse() {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var shortPieces = [],
            longPieces = [],
            mixedPieces = [],
            i,
            mom;
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, i]);
            shortPieces.push(this.monthsShort(mom, ''));
            longPieces.push(this.months(mom, ''));
            mixedPieces.push(this.months(mom, ''));
            mixedPieces.push(this.monthsShort(mom, ''));
        }
        // Sorting makes sure if one month (or abbr) is a prefix of another it
        // will match the longer piece.
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 12; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
        }
        for (i = 0; i < 24; i++) {
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._monthsShortRegex = this._monthsRegex;
        this._monthsStrictRegex = new RegExp(
            '^(' + longPieces.join('|') + ')',
            'i'
        );
        this._monthsShortStrictRegex = new RegExp(
            '^(' + shortPieces.join('|') + ')',
            'i'
        );
    }

    // FORMATTING

    addFormatToken('Y', 0, 0, function () {
        var y = this.year();
        return y <= 9999 ? zeroFill(y, 4) : '+' + y;
    });

    addFormatToken(0, ['YY', 2], 0, function () {
        return this.year() % 100;
    });

    addFormatToken(0, ['YYYY', 4], 0, 'year');
    addFormatToken(0, ['YYYYY', 5], 0, 'year');
    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

    // ALIASES

    addUnitAlias('year', 'y');

    // PRIORITIES

    addUnitPriority('year', 1);

    // PARSING

    addRegexToken('Y', matchSigned);
    addRegexToken('YY', match1to2, match2);
    addRegexToken('YYYY', match1to4, match4);
    addRegexToken('YYYYY', match1to6, match6);
    addRegexToken('YYYYYY', match1to6, match6);

    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
    addParseToken('YYYY', function (input, array) {
        array[YEAR] =
            input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
    });
    addParseToken('YY', function (input, array) {
        array[YEAR] = hooks.parseTwoDigitYear(input);
    });
    addParseToken('Y', function (input, array) {
        array[YEAR] = parseInt(input, 10);
    });

    // HELPERS

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    // HOOKS

    hooks.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    // MOMENTS

    var getSetYear = makeGetSet('FullYear', true);

    function getIsLeapYear() {
        return isLeapYear(this.year());
    }

    function createDate(y, m, d, h, M, s, ms) {
        // can't just apply() to create a date:
        // https://stackoverflow.com/q/181348
        var date;
        // the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            // preserve leap years using a full 400 year cycle, then reset
            date = new Date(y + 400, m, d, h, M, s, ms);
            if (isFinite(date.getFullYear())) {
                date.setFullYear(y);
            }
        } else {
            date = new Date(y, m, d, h, M, s, ms);
        }

        return date;
    }

    function createUTCDate(y) {
        var date, args;
        // the Date.UTC function remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            args = Array.prototype.slice.call(arguments);
            // preserve leap years using a full 400 year cycle, then reset
            args[0] = y + 400;
            date = new Date(Date.UTC.apply(null, args));
            if (isFinite(date.getUTCFullYear())) {
                date.setUTCFullYear(y);
            }
        } else {
            date = new Date(Date.UTC.apply(null, arguments));
        }

        return date;
    }

    // start-of-first-week - start-of-year
    function firstWeekOffset(year, dow, doy) {
        var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
            fwd = 7 + dow - doy,
            // first-week day local weekday -- which local weekday is fwd
            fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

        return -fwdlw + fwd - 1;
    }

    // https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
        var localWeekday = (7 + weekday - dow) % 7,
            weekOffset = firstWeekOffset(year, dow, doy),
            dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
            resYear,
            resDayOfYear;

        if (dayOfYear <= 0) {
            resYear = year - 1;
            resDayOfYear = daysInYear(resYear) + dayOfYear;
        } else if (dayOfYear > daysInYear(year)) {
            resYear = year + 1;
            resDayOfYear = dayOfYear - daysInYear(year);
        } else {
            resYear = year;
            resDayOfYear = dayOfYear;
        }

        return {
            year: resYear,
            dayOfYear: resDayOfYear,
        };
    }

    function weekOfYear(mom, dow, doy) {
        var weekOffset = firstWeekOffset(mom.year(), dow, doy),
            week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
            resWeek,
            resYear;

        if (week < 1) {
            resYear = mom.year() - 1;
            resWeek = week + weeksInYear(resYear, dow, doy);
        } else if (week > weeksInYear(mom.year(), dow, doy)) {
            resWeek = week - weeksInYear(mom.year(), dow, doy);
            resYear = mom.year() + 1;
        } else {
            resYear = mom.year();
            resWeek = week;
        }

        return {
            week: resWeek,
            year: resYear,
        };
    }

    function weeksInYear(year, dow, doy) {
        var weekOffset = firstWeekOffset(year, dow, doy),
            weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
        return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
    }

    // FORMATTING

    addFormatToken('w', ['ww', 2], 'wo', 'week');
    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

    // ALIASES

    addUnitAlias('week', 'w');
    addUnitAlias('isoWeek', 'W');

    // PRIORITIES

    addUnitPriority('week', 5);
    addUnitPriority('isoWeek', 5);

    // PARSING

    addRegexToken('w', match1to2);
    addRegexToken('ww', match1to2, match2);
    addRegexToken('W', match1to2);
    addRegexToken('WW', match1to2, match2);

    addWeekParseToken(['w', 'ww', 'W', 'WW'], function (
        input,
        week,
        config,
        token
    ) {
        week[token.substr(0, 1)] = toInt(input);
    });

    // HELPERS

    // LOCALES

    function localeWeek(mom) {
        return weekOfYear(mom, this._week.dow, this._week.doy).week;
    }

    var defaultLocaleWeek = {
        dow: 0, // Sunday is the first day of the week.
        doy: 6, // The week that contains Jan 6th is the first week of the year.
    };

    function localeFirstDayOfWeek() {
        return this._week.dow;
    }

    function localeFirstDayOfYear() {
        return this._week.doy;
    }

    // MOMENTS

    function getSetWeek(input) {
        var week = this.localeData().week(this);
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    function getSetISOWeek(input) {
        var week = weekOfYear(this, 1, 4).week;
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    // FORMATTING

    addFormatToken('d', 0, 'do', 'day');

    addFormatToken('dd', 0, 0, function (format) {
        return this.localeData().weekdaysMin(this, format);
    });

    addFormatToken('ddd', 0, 0, function (format) {
        return this.localeData().weekdaysShort(this, format);
    });

    addFormatToken('dddd', 0, 0, function (format) {
        return this.localeData().weekdays(this, format);
    });

    addFormatToken('e', 0, 0, 'weekday');
    addFormatToken('E', 0, 0, 'isoWeekday');

    // ALIASES

    addUnitAlias('day', 'd');
    addUnitAlias('weekday', 'e');
    addUnitAlias('isoWeekday', 'E');

    // PRIORITY
    addUnitPriority('day', 11);
    addUnitPriority('weekday', 11);
    addUnitPriority('isoWeekday', 11);

    // PARSING

    addRegexToken('d', match1to2);
    addRegexToken('e', match1to2);
    addRegexToken('E', match1to2);
    addRegexToken('dd', function (isStrict, locale) {
        return locale.weekdaysMinRegex(isStrict);
    });
    addRegexToken('ddd', function (isStrict, locale) {
        return locale.weekdaysShortRegex(isStrict);
    });
    addRegexToken('dddd', function (isStrict, locale) {
        return locale.weekdaysRegex(isStrict);
    });

    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
        var weekday = config._locale.weekdaysParse(input, token, config._strict);
        // if we didn't get a weekday name, mark the date as invalid
        if (weekday != null) {
            week.d = weekday;
        } else {
            getParsingFlags(config).invalidWeekday = input;
        }
    });

    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
        week[token] = toInt(input);
    });

    // HELPERS

    function parseWeekday(input, locale) {
        if (typeof input !== 'string') {
            return input;
        }

        if (!isNaN(input)) {
            return parseInt(input, 10);
        }

        input = locale.weekdaysParse(input);
        if (typeof input === 'number') {
            return input;
        }

        return null;
    }

    function parseIsoWeekday(input, locale) {
        if (typeof input === 'string') {
            return locale.weekdaysParse(input) % 7 || 7;
        }
        return isNaN(input) ? null : input;
    }

    // LOCALES
    function shiftWeekdays(ws, n) {
        return ws.slice(n, 7).concat(ws.slice(0, n));
    }

    var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
            '_'
        ),
        defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        defaultWeekdaysRegex = matchWord,
        defaultWeekdaysShortRegex = matchWord,
        defaultWeekdaysMinRegex = matchWord;

    function localeWeekdays(m, format) {
        var weekdays = isArray(this._weekdays)
            ? this._weekdays
            : this._weekdays[
                  m && m !== true && this._weekdays.isFormat.test(format)
                      ? 'format'
                      : 'standalone'
              ];
        return m === true
            ? shiftWeekdays(weekdays, this._week.dow)
            : m
            ? weekdays[m.day()]
            : weekdays;
    }

    function localeWeekdaysShort(m) {
        return m === true
            ? shiftWeekdays(this._weekdaysShort, this._week.dow)
            : m
            ? this._weekdaysShort[m.day()]
            : this._weekdaysShort;
    }

    function localeWeekdaysMin(m) {
        return m === true
            ? shiftWeekdays(this._weekdaysMin, this._week.dow)
            : m
            ? this._weekdaysMin[m.day()]
            : this._weekdaysMin;
    }

    function handleStrictParse$1(weekdayName, format, strict) {
        var i,
            ii,
            mom,
            llc = weekdayName.toLocaleLowerCase();
        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._minWeekdaysParse = [];

            for (i = 0; i < 7; ++i) {
                mom = createUTC([2000, 1]).day(i);
                this._minWeekdaysParse[i] = this.weekdaysMin(
                    mom,
                    ''
                ).toLocaleLowerCase();
                this._shortWeekdaysParse[i] = this.weekdaysShort(
                    mom,
                    ''
                ).toLocaleLowerCase();
                this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeWeekdaysParse(weekdayName, format, strict) {
        var i, mom, regex;

        if (this._weekdaysParseExact) {
            return handleStrictParse$1.call(this, weekdayName, format, strict);
        }

        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._minWeekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._fullWeekdaysParse = [];
        }

        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already

            mom = createUTC([2000, 1]).day(i);
            if (strict && !this._fullWeekdaysParse[i]) {
                this._fullWeekdaysParse[i] = new RegExp(
                    '^' + this.weekdays(mom, '').replace('.', '\\.?') + '$',
                    'i'
                );
                this._shortWeekdaysParse[i] = new RegExp(
                    '^' + this.weekdaysShort(mom, '').replace('.', '\\.?') + '$',
                    'i'
                );
                this._minWeekdaysParse[i] = new RegExp(
                    '^' + this.weekdaysMin(mom, '').replace('.', '\\.?') + '$',
                    'i'
                );
            }
            if (!this._weekdaysParse[i]) {
                regex =
                    '^' +
                    this.weekdays(mom, '') +
                    '|^' +
                    this.weekdaysShort(mom, '') +
                    '|^' +
                    this.weekdaysMin(mom, '');
                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (
                strict &&
                format === 'dddd' &&
                this._fullWeekdaysParse[i].test(weekdayName)
            ) {
                return i;
            } else if (
                strict &&
                format === 'ddd' &&
                this._shortWeekdaysParse[i].test(weekdayName)
            ) {
                return i;
            } else if (
                strict &&
                format === 'dd' &&
                this._minWeekdaysParse[i].test(weekdayName)
            ) {
                return i;
            } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function getSetDayOfWeek(input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
        if (input != null) {
            input = parseWeekday(input, this.localeData());
            return this.add(input - day, 'd');
        } else {
            return day;
        }
    }

    function getSetLocaleDayOfWeek(input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
        return input == null ? weekday : this.add(input - weekday, 'd');
    }

    function getSetISODayOfWeek(input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }

        // behaves the same as moment#day except
        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
        // as a setter, sunday should belong to the previous week.

        if (input != null) {
            var weekday = parseIsoWeekday(input, this.localeData());
            return this.day(this.day() % 7 ? weekday : weekday - 7);
        } else {
            return this.day() || 7;
        }
    }

    function weekdaysRegex(isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysStrictRegex;
            } else {
                return this._weekdaysRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                this._weekdaysRegex = defaultWeekdaysRegex;
            }
            return this._weekdaysStrictRegex && isStrict
                ? this._weekdaysStrictRegex
                : this._weekdaysRegex;
        }
    }

    function weekdaysShortRegex(isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysShortStrictRegex;
            } else {
                return this._weekdaysShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysShortRegex')) {
                this._weekdaysShortRegex = defaultWeekdaysShortRegex;
            }
            return this._weekdaysShortStrictRegex && isStrict
                ? this._weekdaysShortStrictRegex
                : this._weekdaysShortRegex;
        }
    }

    function weekdaysMinRegex(isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysMinStrictRegex;
            } else {
                return this._weekdaysMinRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysMinRegex')) {
                this._weekdaysMinRegex = defaultWeekdaysMinRegex;
            }
            return this._weekdaysMinStrictRegex && isStrict
                ? this._weekdaysMinStrictRegex
                : this._weekdaysMinRegex;
        }
    }

    function computeWeekdaysParse() {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var minPieces = [],
            shortPieces = [],
            longPieces = [],
            mixedPieces = [],
            i,
            mom,
            minp,
            shortp,
            longp;
        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, 1]).day(i);
            minp = regexEscape(this.weekdaysMin(mom, ''));
            shortp = regexEscape(this.weekdaysShort(mom, ''));
            longp = regexEscape(this.weekdays(mom, ''));
            minPieces.push(minp);
            shortPieces.push(shortp);
            longPieces.push(longp);
            mixedPieces.push(minp);
            mixedPieces.push(shortp);
            mixedPieces.push(longp);
        }
        // Sorting makes sure if one weekday (or abbr) is a prefix of another it
        // will match the longer piece.
        minPieces.sort(cmpLenRev);
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);

        this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._weekdaysShortRegex = this._weekdaysRegex;
        this._weekdaysMinRegex = this._weekdaysRegex;

        this._weekdaysStrictRegex = new RegExp(
            '^(' + longPieces.join('|') + ')',
            'i'
        );
        this._weekdaysShortStrictRegex = new RegExp(
            '^(' + shortPieces.join('|') + ')',
            'i'
        );
        this._weekdaysMinStrictRegex = new RegExp(
            '^(' + minPieces.join('|') + ')',
            'i'
        );
    }

    // FORMATTING

    function hFormat() {
        return this.hours() % 12 || 12;
    }

    function kFormat() {
        return this.hours() || 24;
    }

    addFormatToken('H', ['HH', 2], 0, 'hour');
    addFormatToken('h', ['hh', 2], 0, hFormat);
    addFormatToken('k', ['kk', 2], 0, kFormat);

    addFormatToken('hmm', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
    });

    addFormatToken('hmmss', 0, 0, function () {
        return (
            '' +
            hFormat.apply(this) +
            zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2)
        );
    });

    addFormatToken('Hmm', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2);
    });

    addFormatToken('Hmmss', 0, 0, function () {
        return (
            '' +
            this.hours() +
            zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2)
        );
    });

    function meridiem(token, lowercase) {
        addFormatToken(token, 0, 0, function () {
            return this.localeData().meridiem(
                this.hours(),
                this.minutes(),
                lowercase
            );
        });
    }

    meridiem('a', true);
    meridiem('A', false);

    // ALIASES

    addUnitAlias('hour', 'h');

    // PRIORITY
    addUnitPriority('hour', 13);

    // PARSING

    function matchMeridiem(isStrict, locale) {
        return locale._meridiemParse;
    }

    addRegexToken('a', matchMeridiem);
    addRegexToken('A', matchMeridiem);
    addRegexToken('H', match1to2);
    addRegexToken('h', match1to2);
    addRegexToken('k', match1to2);
    addRegexToken('HH', match1to2, match2);
    addRegexToken('hh', match1to2, match2);
    addRegexToken('kk', match1to2, match2);

    addRegexToken('hmm', match3to4);
    addRegexToken('hmmss', match5to6);
    addRegexToken('Hmm', match3to4);
    addRegexToken('Hmmss', match5to6);

    addParseToken(['H', 'HH'], HOUR);
    addParseToken(['k', 'kk'], function (input, array, config) {
        var kInput = toInt(input);
        array[HOUR] = kInput === 24 ? 0 : kInput;
    });
    addParseToken(['a', 'A'], function (input, array, config) {
        config._isPm = config._locale.isPM(input);
        config._meridiem = input;
    });
    addParseToken(['h', 'hh'], function (input, array, config) {
        array[HOUR] = toInt(input);
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmmss', function (input, array, config) {
        var pos1 = input.length - 4,
            pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('Hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
    });
    addParseToken('Hmmss', function (input, array, config) {
        var pos1 = input.length - 4,
            pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
    });

    // LOCALES

    function localeIsPM(input) {
        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
        // Using charAt should be more compatible.
        return (input + '').toLowerCase().charAt(0) === 'p';
    }

    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i,
        // Setting the hour should keep the time, because the user explicitly
        // specified which hour they want. So trying to maintain the same hour (in
        // a new timezone) makes sense. Adding/subtracting hours does not follow
        // this rule.
        getSetHour = makeGetSet('Hours', true);

    function localeMeridiem(hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'pm' : 'PM';
        } else {
            return isLower ? 'am' : 'AM';
        }
    }

    var baseConfig = {
        calendar: defaultCalendar,
        longDateFormat: defaultLongDateFormat,
        invalidDate: defaultInvalidDate,
        ordinal: defaultOrdinal,
        dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
        relativeTime: defaultRelativeTime,

        months: defaultLocaleMonths,
        monthsShort: defaultLocaleMonthsShort,

        week: defaultLocaleWeek,

        weekdays: defaultLocaleWeekdays,
        weekdaysMin: defaultLocaleWeekdaysMin,
        weekdaysShort: defaultLocaleWeekdaysShort,

        meridiemParse: defaultLocaleMeridiemParse,
    };

    // internal storage for locale config files
    var locales = {},
        localeFamilies = {},
        globalLocale;

    function commonPrefix(arr1, arr2) {
        var i,
            minl = Math.min(arr1.length, arr2.length);
        for (i = 0; i < minl; i += 1) {
            if (arr1[i] !== arr2[i]) {
                return i;
            }
        }
        return minl;
    }

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0,
            j,
            next,
            locale,
            split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (
                    next &&
                    next.length >= j &&
                    commonPrefix(split, next) >= j - 1
                ) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return globalLocale;
    }

    function loadLocale(name) {
        var oldLocale = null,
            aliasedRequire;
        // TODO: Find a better way to register and load all the locales in Node
        if (
            locales[name] === undefined &&
            typeof module !== 'undefined' &&
            module &&
            module.exports
        ) {
            try {
                oldLocale = globalLocale._abbr;
                aliasedRequire = require;
                aliasedRequire('./locale/' + name);
                getSetGlobalLocale(oldLocale);
            } catch (e) {
                // mark as not found to avoid repeating expensive file require call causing high CPU
                // when trying to find en-US, en_US, en-us for every format call
                locales[name] = null; // null means not found
            }
        }
        return locales[name];
    }

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    function getSetGlobalLocale(key, values) {
        var data;
        if (key) {
            if (isUndefined(values)) {
                data = getLocale(key);
            } else {
                data = defineLocale(key, values);
            }

            if (data) {
                // moment.duration._locale = moment._locale = data;
                globalLocale = data;
            } else {
                if (typeof console !== 'undefined' && console.warn) {
                    //warn user if arguments are passed but the locale could not be set
                    console.warn(
                        'Locale ' + key + ' not found. Did you forget to load it?'
                    );
                }
            }
        }

        return globalLocale._abbr;
    }

    function defineLocale(name, config) {
        if (config !== null) {
            var locale,
                parentConfig = baseConfig;
            config.abbr = name;
            if (locales[name] != null) {
                deprecateSimple(
                    'defineLocaleOverride',
                    'use moment.updateLocale(localeName, config) to change ' +
                        'an existing locale. moment.defineLocale(localeName, ' +
                        'config) should only be used for creating a new locale ' +
                        'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.'
                );
                parentConfig = locales[name]._config;
            } else if (config.parentLocale != null) {
                if (locales[config.parentLocale] != null) {
                    parentConfig = locales[config.parentLocale]._config;
                } else {
                    locale = loadLocale(config.parentLocale);
                    if (locale != null) {
                        parentConfig = locale._config;
                    } else {
                        if (!localeFamilies[config.parentLocale]) {
                            localeFamilies[config.parentLocale] = [];
                        }
                        localeFamilies[config.parentLocale].push({
                            name: name,
                            config: config,
                        });
                        return null;
                    }
                }
            }
            locales[name] = new Locale(mergeConfigs(parentConfig, config));

            if (localeFamilies[name]) {
                localeFamilies[name].forEach(function (x) {
                    defineLocale(x.name, x.config);
                });
            }

            // backwards compat for now: also set the locale
            // make sure we set the locale AFTER all child locales have been
            // created, so we won't end up with the child locale set.
            getSetGlobalLocale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    }

    function updateLocale(name, config) {
        if (config != null) {
            var locale,
                tmpLocale,
                parentConfig = baseConfig;

            if (locales[name] != null && locales[name].parentLocale != null) {
                // Update existing child locale in-place to avoid memory-leaks
                locales[name].set(mergeConfigs(locales[name]._config, config));
            } else {
                // MERGE
                tmpLocale = loadLocale(name);
                if (tmpLocale != null) {
                    parentConfig = tmpLocale._config;
                }
                config = mergeConfigs(parentConfig, config);
                if (tmpLocale == null) {
                    // updateLocale is called for creating a new locale
                    // Set abbr so it will have a name (getters return
                    // undefined otherwise).
                    config.abbr = name;
                }
                locale = new Locale(config);
                locale.parentLocale = locales[name];
                locales[name] = locale;
            }

            // backwards compat for now: also set the locale
            getSetGlobalLocale(name);
        } else {
            // pass null for config to unupdate, useful for tests
            if (locales[name] != null) {
                if (locales[name].parentLocale != null) {
                    locales[name] = locales[name].parentLocale;
                    if (name === getSetGlobalLocale()) {
                        getSetGlobalLocale(name);
                    }
                } else if (locales[name] != null) {
                    delete locales[name];
                }
            }
        }
        return locales[name];
    }

    // returns locale data
    function getLocale(key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return globalLocale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    }

    function listLocales() {
        return keys(locales);
    }

    function checkOverflow(m) {
        var overflow,
            a = m._a;

        if (a && getParsingFlags(m).overflow === -2) {
            overflow =
                a[MONTH] < 0 || a[MONTH] > 11
                    ? MONTH
                    : a[DATE] < 1 || a[DATE] > daysInMonth(a[YEAR], a[MONTH])
                    ? DATE
                    : a[HOUR] < 0 ||
                      a[HOUR] > 24 ||
                      (a[HOUR] === 24 &&
                          (a[MINUTE] !== 0 ||
                              a[SECOND] !== 0 ||
                              a[MILLISECOND] !== 0))
                    ? HOUR
                    : a[MINUTE] < 0 || a[MINUTE] > 59
                    ? MINUTE
                    : a[SECOND] < 0 || a[SECOND] > 59
                    ? SECOND
                    : a[MILLISECOND] < 0 || a[MILLISECOND] > 999
                    ? MILLISECOND
                    : -1;

            if (
                getParsingFlags(m)._overflowDayOfYear &&
                (overflow < YEAR || overflow > DATE)
            ) {
                overflow = DATE;
            }
            if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
                overflow = WEEK;
            }
            if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
                overflow = WEEKDAY;
            }

            getParsingFlags(m).overflow = overflow;
        }

        return m;
    }

    // iso 8601 regex
    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
    var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
        basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d|))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
        tzRegex = /Z|[+-]\d\d(?::?\d\d)?/,
        isoDates = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
            ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
            ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
            ['YYYY-DDD', /\d{4}-\d{3}/],
            ['YYYY-MM', /\d{4}-\d\d/, false],
            ['YYYYYYMMDD', /[+-]\d{10}/],
            ['YYYYMMDD', /\d{8}/],
            ['GGGG[W]WWE', /\d{4}W\d{3}/],
            ['GGGG[W]WW', /\d{4}W\d{2}/, false],
            ['YYYYDDD', /\d{7}/],
            ['YYYYMM', /\d{6}/, false],
            ['YYYY', /\d{4}/, false],
        ],
        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
            ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
            ['HH:mm:ss', /\d\d:\d\d:\d\d/],
            ['HH:mm', /\d\d:\d\d/],
            ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
            ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
            ['HHmmss', /\d\d\d\d\d\d/],
            ['HHmm', /\d\d\d\d/],
            ['HH', /\d\d/],
        ],
        aspNetJsonRegex = /^\/?Date\((-?\d+)/i,
        // RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3
        rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/,
        obsOffsets = {
            UT: 0,
            GMT: 0,
            EDT: -4 * 60,
            EST: -5 * 60,
            CDT: -5 * 60,
            CST: -6 * 60,
            MDT: -6 * 60,
            MST: -7 * 60,
            PDT: -7 * 60,
            PST: -8 * 60,
        };

    // date from iso format
    function configFromISO(config) {
        var i,
            l,
            string = config._i,
            match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
            allowTime,
            dateFormat,
            timeFormat,
            tzFormat;

        if (match) {
            getParsingFlags(config).iso = true;

            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(match[1])) {
                    dateFormat = isoDates[i][0];
                    allowTime = isoDates[i][2] !== false;
                    break;
                }
            }
            if (dateFormat == null) {
                config._isValid = false;
                return;
            }
            if (match[3]) {
                for (i = 0, l = isoTimes.length; i < l; i++) {
                    if (isoTimes[i][1].exec(match[3])) {
                        // match[2] should be 'T' or space
                        timeFormat = (match[2] || ' ') + isoTimes[i][0];
                        break;
                    }
                }
                if (timeFormat == null) {
                    config._isValid = false;
                    return;
                }
            }
            if (!allowTime && timeFormat != null) {
                config._isValid = false;
                return;
            }
            if (match[4]) {
                if (tzRegex.exec(match[4])) {
                    tzFormat = 'Z';
                } else {
                    config._isValid = false;
                    return;
                }
            }
            config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
            configFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    function extractFromRFC2822Strings(
        yearStr,
        monthStr,
        dayStr,
        hourStr,
        minuteStr,
        secondStr
    ) {
        var result = [
            untruncateYear(yearStr),
            defaultLocaleMonthsShort.indexOf(monthStr),
            parseInt(dayStr, 10),
            parseInt(hourStr, 10),
            parseInt(minuteStr, 10),
        ];

        if (secondStr) {
            result.push(parseInt(secondStr, 10));
        }

        return result;
    }

    function untruncateYear(yearStr) {
        var year = parseInt(yearStr, 10);
        if (year <= 49) {
            return 2000 + year;
        } else if (year <= 999) {
            return 1900 + year;
        }
        return year;
    }

    function preprocessRFC2822(s) {
        // Remove comments and folding whitespace and replace multiple-spaces with a single space
        return s
            .replace(/\([^)]*\)|[\n\t]/g, ' ')
            .replace(/(\s\s+)/g, ' ')
            .replace(/^\s\s*/, '')
            .replace(/\s\s*$/, '');
    }

    function checkWeekday(weekdayStr, parsedInput, config) {
        if (weekdayStr) {
            // TODO: Replace the vanilla JS Date object with an independent day-of-week check.
            var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr),
                weekdayActual = new Date(
                    parsedInput[0],
                    parsedInput[1],
                    parsedInput[2]
                ).getDay();
            if (weekdayProvided !== weekdayActual) {
                getParsingFlags(config).weekdayMismatch = true;
                config._isValid = false;
                return false;
            }
        }
        return true;
    }

    function calculateOffset(obsOffset, militaryOffset, numOffset) {
        if (obsOffset) {
            return obsOffsets[obsOffset];
        } else if (militaryOffset) {
            // the only allowed military tz is Z
            return 0;
        } else {
            var hm = parseInt(numOffset, 10),
                m = hm % 100,
                h = (hm - m) / 100;
            return h * 60 + m;
        }
    }

    // date and time from ref 2822 format
    function configFromRFC2822(config) {
        var match = rfc2822.exec(preprocessRFC2822(config._i)),
            parsedArray;
        if (match) {
            parsedArray = extractFromRFC2822Strings(
                match[4],
                match[3],
                match[2],
                match[5],
                match[6],
                match[7]
            );
            if (!checkWeekday(match[1], parsedArray, config)) {
                return;
            }

            config._a = parsedArray;
            config._tzm = calculateOffset(match[8], match[9], match[10]);

            config._d = createUTCDate.apply(null, config._a);
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);

            getParsingFlags(config).rfc2822 = true;
        } else {
            config._isValid = false;
        }
    }

    // date from 1) ASP.NET, 2) ISO, 3) RFC 2822 formats, or 4) optional fallback if parsing isn't strict
    function configFromString(config) {
        var matched = aspNetJsonRegex.exec(config._i);
        if (matched !== null) {
            config._d = new Date(+matched[1]);
            return;
        }

        configFromISO(config);
        if (config._isValid === false) {
            delete config._isValid;
        } else {
            return;
        }

        configFromRFC2822(config);
        if (config._isValid === false) {
            delete config._isValid;
        } else {
            return;
        }

        if (config._strict) {
            config._isValid = false;
        } else {
            // Final attempt, use Input Fallback
            hooks.createFromInputFallback(config);
        }
    }

    hooks.createFromInputFallback = deprecate(
        'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' +
            'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' +
            'discouraged and will be removed in an upcoming major release. Please refer to ' +
            'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    // Pick the first defined of two or three arguments.
    function defaults(a, b, c) {
        if (a != null) {
            return a;
        }
        if (b != null) {
            return b;
        }
        return c;
    }

    function currentDateArray(config) {
        // hooks is actually the exported moment object
        var nowValue = new Date(hooks.now());
        if (config._useUTC) {
            return [
                nowValue.getUTCFullYear(),
                nowValue.getUTCMonth(),
                nowValue.getUTCDate(),
            ];
        }
        return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function configFromArray(config) {
        var i,
            date,
            input = [],
            currentDate,
            expectedWeekday,
            yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear != null) {
            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

            if (
                config._dayOfYear > daysInYear(yearToUse) ||
                config._dayOfYear === 0
            ) {
                getParsingFlags(config)._overflowDayOfYear = true;
            }

            date = createUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] =
                config._a[i] == null ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (
            config._a[HOUR] === 24 &&
            config._a[MINUTE] === 0 &&
            config._a[SECOND] === 0 &&
            config._a[MILLISECOND] === 0
        ) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? createUTCDate : createDate).apply(
            null,
            input
        );
        expectedWeekday = config._useUTC
            ? config._d.getUTCDay()
            : config._d.getDay();

        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }

        // check for mismatching day of week
        if (
            config._w &&
            typeof config._w.d !== 'undefined' &&
            config._w.d !== expectedWeekday
        ) {
            getParsingFlags(config).weekdayMismatch = true;
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow, curWeek;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = defaults(
                w.GG,
                config._a[YEAR],
                weekOfYear(createLocal(), 1, 4).year
            );
            week = defaults(w.W, 1);
            weekday = defaults(w.E, 1);
            if (weekday < 1 || weekday > 7) {
                weekdayOverflow = true;
            }
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            curWeek = weekOfYear(createLocal(), dow, doy);

            weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

            // Default to current week.
            week = defaults(w.w, curWeek.week);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < 0 || weekday > 6) {
                    weekdayOverflow = true;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from beginning of week
                weekday = w.e + dow;
                if (w.e < 0 || w.e > 6) {
                    weekdayOverflow = true;
                }
            } else {
                // default to beginning of week
                weekday = dow;
            }
        }
        if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
            getParsingFlags(config)._overflowWeeks = true;
        } else if (weekdayOverflow != null) {
            getParsingFlags(config)._overflowWeekday = true;
        } else {
            temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }
    }

    // constant that refers to the ISO standard
    hooks.ISO_8601 = function () {};

    // constant that refers to the RFC 2822 form
    hooks.RFC_2822 = function () {};

    // date from string and format string
    function configFromStringAndFormat(config) {
        // TODO: Move this to another part of the creation flow to prevent circular deps
        if (config._f === hooks.ISO_8601) {
            configFromISO(config);
            return;
        }
        if (config._f === hooks.RFC_2822) {
            configFromRFC2822(config);
            return;
        }
        config._a = [];
        getParsingFlags(config).empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i,
            parsedInput,
            tokens,
            token,
            skipped,
            stringLength = string.length,
            totalParsedInputLength = 0,
            era;

        tokens =
            expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) ||
                [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    getParsingFlags(config).unusedInput.push(skipped);
                }
                string = string.slice(
                    string.indexOf(parsedInput) + parsedInput.length
                );
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    getParsingFlags(config).empty = false;
                } else {
                    getParsingFlags(config).unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            } else if (config._strict && !parsedInput) {
                getParsingFlags(config).unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        getParsingFlags(config).charsLeftOver =
            stringLength - totalParsedInputLength;
        if (string.length > 0) {
            getParsingFlags(config).unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (
            config._a[HOUR] <= 12 &&
            getParsingFlags(config).bigHour === true &&
            config._a[HOUR] > 0
        ) {
            getParsingFlags(config).bigHour = undefined;
        }

        getParsingFlags(config).parsedDateParts = config._a.slice(0);
        getParsingFlags(config).meridiem = config._meridiem;
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(
            config._locale,
            config._a[HOUR],
            config._meridiem
        );

        // handle era
        era = getParsingFlags(config).era;
        if (era !== null) {
            config._a[YEAR] = config._locale.erasConvertYear(era, config._a[YEAR]);
        }

        configFromArray(config);
        checkOverflow(config);
    }

    function meridiemFixWrap(locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // this is not supposed to happen
            return hour;
        }
    }

    // date from string and array of format strings
    function configFromStringAndArray(config) {
        var tempConfig,
            bestMoment,
            scoreToBeat,
            i,
            currentScore,
            validFormatFound,
            bestFormatIsValid = false;

        if (config._f.length === 0) {
            getParsingFlags(config).invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            validFormatFound = false;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._f = config._f[i];
            configFromStringAndFormat(tempConfig);

            if (isValid(tempConfig)) {
                validFormatFound = true;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += getParsingFlags(tempConfig).charsLeftOver;

            //or tokens
            currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

            getParsingFlags(tempConfig).score = currentScore;

            if (!bestFormatIsValid) {
                if (
                    scoreToBeat == null ||
                    currentScore < scoreToBeat ||
                    validFormatFound
                ) {
                    scoreToBeat = currentScore;
                    bestMoment = tempConfig;
                    if (validFormatFound) {
                        bestFormatIsValid = true;
                    }
                }
            } else {
                if (currentScore < scoreToBeat) {
                    scoreToBeat = currentScore;
                    bestMoment = tempConfig;
                }
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    function configFromObject(config) {
        if (config._d) {
            return;
        }

        var i = normalizeObjectUnits(config._i),
            dayOrDate = i.day === undefined ? i.date : i.day;
        config._a = map(
            [i.year, i.month, dayOrDate, i.hour, i.minute, i.second, i.millisecond],
            function (obj) {
                return obj && parseInt(obj, 10);
            }
        );

        configFromArray(config);
    }

    function createFromConfig(config) {
        var res = new Moment(checkOverflow(prepareConfig(config)));
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    function prepareConfig(config) {
        var input = config._i,
            format = config._f;

        config._locale = config._locale || getLocale(config._l);

        if (input === null || (format === undefined && input === '')) {
            return createInvalid({ nullInput: true });
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (isMoment(input)) {
            return new Moment(checkOverflow(input));
        } else if (isDate(input)) {
            config._d = input;
        } else if (isArray(format)) {
            configFromStringAndArray(config);
        } else if (format) {
            configFromStringAndFormat(config);
        } else {
            configFromInput(config);
        }

        if (!isValid(config)) {
            config._d = null;
        }

        return config;
    }

    function configFromInput(config) {
        var input = config._i;
        if (isUndefined(input)) {
            config._d = new Date(hooks.now());
        } else if (isDate(input)) {
            config._d = new Date(input.valueOf());
        } else if (typeof input === 'string') {
            configFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            configFromArray(config);
        } else if (isObject(input)) {
            configFromObject(config);
        } else if (isNumber(input)) {
            // from milliseconds
            config._d = new Date(input);
        } else {
            hooks.createFromInputFallback(config);
        }
    }

    function createLocalOrUTC(input, format, locale, strict, isUTC) {
        var c = {};

        if (format === true || format === false) {
            strict = format;
            format = undefined;
        }

        if (locale === true || locale === false) {
            strict = locale;
            locale = undefined;
        }

        if (
            (isObject(input) && isObjectEmpty(input)) ||
            (isArray(input) && input.length === 0)
        ) {
            input = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c._isAMomentObject = true;
        c._useUTC = c._isUTC = isUTC;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;

        return createFromConfig(c);
    }

    function createLocal(input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, false);
    }

    var prototypeMin = deprecate(
            'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
            function () {
                var other = createLocal.apply(null, arguments);
                if (this.isValid() && other.isValid()) {
                    return other < this ? this : other;
                } else {
                    return createInvalid();
                }
            }
        ),
        prototypeMax = deprecate(
            'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
            function () {
                var other = createLocal.apply(null, arguments);
                if (this.isValid() && other.isValid()) {
                    return other > this ? this : other;
                } else {
                    return createInvalid();
                }
            }
        );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return createLocal();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (!moments[i].isValid() || moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    // TODO: Use [].sort instead?
    function min() {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    }

    function max() {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    }

    var now = function () {
        return Date.now ? Date.now() : +new Date();
    };

    var ordering = [
        'year',
        'quarter',
        'month',
        'week',
        'day',
        'hour',
        'minute',
        'second',
        'millisecond',
    ];

    function isDurationValid(m) {
        var key,
            unitHasDecimal = false,
            i;
        for (key in m) {
            if (
                hasOwnProp(m, key) &&
                !(
                    indexOf.call(ordering, key) !== -1 &&
                    (m[key] == null || !isNaN(m[key]))
                )
            ) {
                return false;
            }
        }

        for (i = 0; i < ordering.length; ++i) {
            if (m[ordering[i]]) {
                if (unitHasDecimal) {
                    return false; // only allow non-integers for smallest unit
                }
                if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
                    unitHasDecimal = true;
                }
            }
        }

        return true;
    }

    function isValid$1() {
        return this._isValid;
    }

    function createInvalid$1() {
        return createDuration(NaN);
    }

    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || normalizedInput.isoWeek || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        this._isValid = isDurationValid(normalizedInput);

        // representation for dateAddRemove
        this._milliseconds =
            +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days + weeks * 7;
        // It is impossible to translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months + quarters * 3 + years * 12;

        this._data = {};

        this._locale = getLocale();

        this._bubble();
    }

    function isDuration(obj) {
        return obj instanceof Duration;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.round(-1 * number) * -1;
        } else {
            return Math.round(number);
        }
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if (
                (dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))
            ) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    // FORMATTING

    function offset(token, separator) {
        addFormatToken(token, 0, 0, function () {
            var offset = this.utcOffset(),
                sign = '+';
            if (offset < 0) {
                offset = -offset;
                sign = '-';
            }
            return (
                sign +
                zeroFill(~~(offset / 60), 2) +
                separator +
                zeroFill(~~offset % 60, 2)
            );
        });
    }

    offset('Z', ':');
    offset('ZZ', '');

    // PARSING

    addRegexToken('Z', matchShortOffset);
    addRegexToken('ZZ', matchShortOffset);
    addParseToken(['Z', 'ZZ'], function (input, array, config) {
        config._useUTC = true;
        config._tzm = offsetFromString(matchShortOffset, input);
    });

    // HELPERS

    // timezone chunker
    // '+10:00' > ['10',  '00']
    // '-1530'  > ['-15', '30']
    var chunkOffset = /([\+\-]|\d\d)/gi;

    function offsetFromString(matcher, string) {
        var matches = (string || '').match(matcher),
            chunk,
            parts,
            minutes;

        if (matches === null) {
            return null;
        }

        chunk = matches[matches.length - 1] || [];
        parts = (chunk + '').match(chunkOffset) || ['-', 0, 0];
        minutes = +(parts[1] * 60) + toInt(parts[2]);

        return minutes === 0 ? 0 : parts[0] === '+' ? minutes : -minutes;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function cloneWithOffset(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff =
                (isMoment(input) || isDate(input)
                    ? input.valueOf()
                    : createLocal(input).valueOf()) - res.valueOf();
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(res._d.valueOf() + diff);
            hooks.updateOffset(res, false);
            return res;
        } else {
            return createLocal(input).local();
        }
    }

    function getDateOffset(m) {
        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
        // https://github.com/moment/moment/pull/1871
        return -Math.round(m._d.getTimezoneOffset());
    }

    // HOOKS

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    hooks.updateOffset = function () {};

    // MOMENTS

    // keepLocalTime = true means only change the timezone, without
    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
    // +0200, so we adjust the time as needed, to be valid.
    //
    // Keeping the time actually adds/subtracts (one hour)
    // from the actual represented time. That is why we call updateOffset
    // a second time. In case it wants us to change the offset again
    // _changeInProgress == true case, then we have to adjust, because
    // there is no such time in the given timezone.
    function getSetOffset(input, keepLocalTime, keepMinutes) {
        var offset = this._offset || 0,
            localAdjust;
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        if (input != null) {
            if (typeof input === 'string') {
                input = offsetFromString(matchShortOffset, input);
                if (input === null) {
                    return this;
                }
            } else if (Math.abs(input) < 16 && !keepMinutes) {
                input = input * 60;
            }
            if (!this._isUTC && keepLocalTime) {
                localAdjust = getDateOffset(this);
            }
            this._offset = input;
            this._isUTC = true;
            if (localAdjust != null) {
                this.add(localAdjust, 'm');
            }
            if (offset !== input) {
                if (!keepLocalTime || this._changeInProgress) {
                    addSubtract(
                        this,
                        createDuration(input - offset, 'm'),
                        1,
                        false
                    );
                } else if (!this._changeInProgress) {
                    this._changeInProgress = true;
                    hooks.updateOffset(this, true);
                    this._changeInProgress = null;
                }
            }
            return this;
        } else {
            return this._isUTC ? offset : getDateOffset(this);
        }
    }

    function getSetZone(input, keepLocalTime) {
        if (input != null) {
            if (typeof input !== 'string') {
                input = -input;
            }

            this.utcOffset(input, keepLocalTime);

            return this;
        } else {
            return -this.utcOffset();
        }
    }

    function setOffsetToUTC(keepLocalTime) {
        return this.utcOffset(0, keepLocalTime);
    }

    function setOffsetToLocal(keepLocalTime) {
        if (this._isUTC) {
            this.utcOffset(0, keepLocalTime);
            this._isUTC = false;

            if (keepLocalTime) {
                this.subtract(getDateOffset(this), 'm');
            }
        }
        return this;
    }

    function setOffsetToParsedOffset() {
        if (this._tzm != null) {
            this.utcOffset(this._tzm, false, true);
        } else if (typeof this._i === 'string') {
            var tZone = offsetFromString(matchOffset, this._i);
            if (tZone != null) {
                this.utcOffset(tZone);
            } else {
                this.utcOffset(0, true);
            }
        }
        return this;
    }

    function hasAlignedHourOffset(input) {
        if (!this.isValid()) {
            return false;
        }
        input = input ? createLocal(input).utcOffset() : 0;

        return (this.utcOffset() - input) % 60 === 0;
    }

    function isDaylightSavingTime() {
        return (
            this.utcOffset() > this.clone().month(0).utcOffset() ||
            this.utcOffset() > this.clone().month(5).utcOffset()
        );
    }

    function isDaylightSavingTimeShifted() {
        if (!isUndefined(this._isDSTShifted)) {
            return this._isDSTShifted;
        }

        var c = {},
            other;

        copyConfig(c, this);
        c = prepareConfig(c);

        if (c._a) {
            other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
            this._isDSTShifted =
                this.isValid() && compareArrays(c._a, other.toArray()) > 0;
        } else {
            this._isDSTShifted = false;
        }

        return this._isDSTShifted;
    }

    function isLocal() {
        return this.isValid() ? !this._isUTC : false;
    }

    function isUtcOffset() {
        return this.isValid() ? this._isUTC : false;
    }

    function isUtc() {
        return this.isValid() ? this._isUTC && this._offset === 0 : false;
    }

    // ASP.NET json date format regex
    var aspNetRegex = /^(-|\+)?(?:(\d*)[. ])?(\d+):(\d+)(?::(\d+)(\.\d*)?)?$/,
        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        // and further modified to allow for strings containing both week and day
        isoRegex = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;

    function createDuration(input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            diffRes;

        if (isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months,
            };
        } else if (isNumber(input) || !isNaN(+input)) {
            duration = {};
            if (key) {
                duration[key] = +input;
            } else {
                duration.milliseconds = +input;
            }
        } else if ((match = aspNetRegex.exec(input))) {
            sign = match[1] === '-' ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(absRound(match[MILLISECOND] * 1000)) * sign, // the millisecond decimal point is included in the match
            };
        } else if ((match = isoRegex.exec(input))) {
            sign = match[1] === '-' ? -1 : 1;
            duration = {
                y: parseIso(match[2], sign),
                M: parseIso(match[3], sign),
                w: parseIso(match[4], sign),
                d: parseIso(match[5], sign),
                h: parseIso(match[6], sign),
                m: parseIso(match[7], sign),
                s: parseIso(match[8], sign),
            };
        } else if (duration == null) {
            // checks for null or undefined
            duration = {};
        } else if (
            typeof duration === 'object' &&
            ('from' in duration || 'to' in duration)
        ) {
            diffRes = momentsDifference(
                createLocal(duration.from),
                createLocal(duration.to)
            );

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        if (isDuration(input) && hasOwnProp(input, '_isValid')) {
            ret._isValid = input._isValid;
        }

        return ret;
    }

    createDuration.fn = Duration.prototype;
    createDuration.invalid = createInvalid$1;

    function parseIso(inp, sign) {
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(',', '.'));
        // apply sign while we're at it
        return (isNaN(res) ? 0 : res) * sign;
    }

    function positiveMomentsDifference(base, other) {
        var res = {};

        res.months =
            other.month() - base.month() + (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +base.clone().add(res.months, 'M');

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        if (!(base.isValid() && other.isValid())) {
            return { milliseconds: 0, months: 0 };
        }

        other = cloneWithOffset(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(
                    name,
                    'moment().' +
                        name +
                        '(period, number) is deprecated. Please use moment().' +
                        name +
                        '(number, period). ' +
                        'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.'
                );
                tmp = val;
                val = period;
                period = tmp;
            }

            dur = createDuration(val, period);
            addSubtract(this, dur, direction);
            return this;
        };
    }

    function addSubtract(mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = absRound(duration._days),
            months = absRound(duration._months);

        if (!mom.isValid()) {
            // No op
            return;
        }

        updateOffset = updateOffset == null ? true : updateOffset;

        if (months) {
            setMonth(mom, get(mom, 'Month') + months * isAdding);
        }
        if (days) {
            set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
        }
        if (milliseconds) {
            mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
        }
        if (updateOffset) {
            hooks.updateOffset(mom, days || months);
        }
    }

    var add = createAdder(1, 'add'),
        subtract = createAdder(-1, 'subtract');

    function isString(input) {
        return typeof input === 'string' || input instanceof String;
    }

    // type MomentInput = Moment | Date | string | number | (number | string)[] | MomentInputObject | void; // null | undefined
    function isMomentInput(input) {
        return (
            isMoment(input) ||
            isDate(input) ||
            isString(input) ||
            isNumber(input) ||
            isNumberOrStringArray(input) ||
            isMomentInputObject(input) ||
            input === null ||
            input === undefined
        );
    }

    function isMomentInputObject(input) {
        var objectTest = isObject(input) && !isObjectEmpty(input),
            propertyTest = false,
            properties = [
                'years',
                'year',
                'y',
                'months',
                'month',
                'M',
                'days',
                'day',
                'd',
                'dates',
                'date',
                'D',
                'hours',
                'hour',
                'h',
                'minutes',
                'minute',
                'm',
                'seconds',
                'second',
                's',
                'milliseconds',
                'millisecond',
                'ms',
            ],
            i,
            property;

        for (i = 0; i < properties.length; i += 1) {
            property = properties[i];
            propertyTest = propertyTest || hasOwnProp(input, property);
        }

        return objectTest && propertyTest;
    }

    function isNumberOrStringArray(input) {
        var arrayTest = isArray(input),
            dataTypeTest = false;
        if (arrayTest) {
            dataTypeTest =
                input.filter(function (item) {
                    return !isNumber(item) && isString(input);
                }).length === 0;
        }
        return arrayTest && dataTypeTest;
    }

    function isCalendarSpec(input) {
        var objectTest = isObject(input) && !isObjectEmpty(input),
            propertyTest = false,
            properties = [
                'sameDay',
                'nextDay',
                'lastDay',
                'nextWeek',
                'lastWeek',
                'sameElse',
            ],
            i,
            property;

        for (i = 0; i < properties.length; i += 1) {
            property = properties[i];
            propertyTest = propertyTest || hasOwnProp(input, property);
        }

        return objectTest && propertyTest;
    }

    function getCalendarFormat(myMoment, now) {
        var diff = myMoment.diff(now, 'days', true);
        return diff < -6
            ? 'sameElse'
            : diff < -1
            ? 'lastWeek'
            : diff < 0
            ? 'lastDay'
            : diff < 1
            ? 'sameDay'
            : diff < 2
            ? 'nextDay'
            : diff < 7
            ? 'nextWeek'
            : 'sameElse';
    }

    function calendar$1(time, formats) {
        // Support for single parameter, formats only overload to the calendar function
        if (arguments.length === 1) {
            if (isMomentInput(arguments[0])) {
                time = arguments[0];
                formats = undefined;
            } else if (isCalendarSpec(arguments[0])) {
                formats = arguments[0];
                time = undefined;
            }
        }
        // We want to compare the start of today, vs this.
        // Getting start-of-today depends on whether we're local/utc/offset or not.
        var now = time || createLocal(),
            sod = cloneWithOffset(now, this).startOf('day'),
            format = hooks.calendarFormat(this, sod) || 'sameElse',
            output =
                formats &&
                (isFunction(formats[format])
                    ? formats[format].call(this, now)
                    : formats[format]);

        return this.format(
            output || this.localeData().calendar(format, this, createLocal(now))
        );
    }

    function clone() {
        return new Moment(this);
    }

    function isAfter(input, units) {
        var localInput = isMoment(input) ? input : createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units) || 'millisecond';
        if (units === 'millisecond') {
            return this.valueOf() > localInput.valueOf();
        } else {
            return localInput.valueOf() < this.clone().startOf(units).valueOf();
        }
    }

    function isBefore(input, units) {
        var localInput = isMoment(input) ? input : createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units) || 'millisecond';
        if (units === 'millisecond') {
            return this.valueOf() < localInput.valueOf();
        } else {
            return this.clone().endOf(units).valueOf() < localInput.valueOf();
        }
    }

    function isBetween(from, to, units, inclusivity) {
        var localFrom = isMoment(from) ? from : createLocal(from),
            localTo = isMoment(to) ? to : createLocal(to);
        if (!(this.isValid() && localFrom.isValid() && localTo.isValid())) {
            return false;
        }
        inclusivity = inclusivity || '()';
        return (
            (inclusivity[0] === '('
                ? this.isAfter(localFrom, units)
                : !this.isBefore(localFrom, units)) &&
            (inclusivity[1] === ')'
                ? this.isBefore(localTo, units)
                : !this.isAfter(localTo, units))
        );
    }

    function isSame(input, units) {
        var localInput = isMoment(input) ? input : createLocal(input),
            inputMs;
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units) || 'millisecond';
        if (units === 'millisecond') {
            return this.valueOf() === localInput.valueOf();
        } else {
            inputMs = localInput.valueOf();
            return (
                this.clone().startOf(units).valueOf() <= inputMs &&
                inputMs <= this.clone().endOf(units).valueOf()
            );
        }
    }

    function isSameOrAfter(input, units) {
        return this.isSame(input, units) || this.isAfter(input, units);
    }

    function isSameOrBefore(input, units) {
        return this.isSame(input, units) || this.isBefore(input, units);
    }

    function diff(input, units, asFloat) {
        var that, zoneDelta, output;

        if (!this.isValid()) {
            return NaN;
        }

        that = cloneWithOffset(input, this);

        if (!that.isValid()) {
            return NaN;
        }

        zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

        units = normalizeUnits(units);

        switch (units) {
            case 'year':
                output = monthDiff(this, that) / 12;
                break;
            case 'month':
                output = monthDiff(this, that);
                break;
            case 'quarter':
                output = monthDiff(this, that) / 3;
                break;
            case 'second':
                output = (this - that) / 1e3;
                break; // 1000
            case 'minute':
                output = (this - that) / 6e4;
                break; // 1000 * 60
            case 'hour':
                output = (this - that) / 36e5;
                break; // 1000 * 60 * 60
            case 'day':
                output = (this - that - zoneDelta) / 864e5;
                break; // 1000 * 60 * 60 * 24, negate dst
            case 'week':
                output = (this - that - zoneDelta) / 6048e5;
                break; // 1000 * 60 * 60 * 24 * 7, negate dst
            default:
                output = this - that;
        }

        return asFloat ? output : absFloor(output);
    }

    function monthDiff(a, b) {
        if (a.date() < b.date()) {
            // end-of-month calculations work correct when the start month has more
            // days than the end month.
            return -monthDiff(b, a);
        }
        // difference in months
        var wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2,
            adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        //check for negative zero, return zero if negative zero
        return -(wholeMonthDiff + adjust) || 0;
    }

    hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
    hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

    function toString() {
        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    }

    function toISOString(keepOffset) {
        if (!this.isValid()) {
            return null;
        }
        var utc = keepOffset !== true,
            m = utc ? this.clone().utc() : this;
        if (m.year() < 0 || m.year() > 9999) {
            return formatMoment(
                m,
                utc
                    ? 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]'
                    : 'YYYYYY-MM-DD[T]HH:mm:ss.SSSZ'
            );
        }
        if (isFunction(Date.prototype.toISOString)) {
            // native implementation is ~50x faster, use it when we can
            if (utc) {
                return this.toDate().toISOString();
            } else {
                return new Date(this.valueOf() + this.utcOffset() * 60 * 1000)
                    .toISOString()
                    .replace('Z', formatMoment(m, 'Z'));
            }
        }
        return formatMoment(
            m,
            utc ? 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYY-MM-DD[T]HH:mm:ss.SSSZ'
        );
    }

    /**
     * Return a human readable representation of a moment that can
     * also be evaluated to get a new moment which is the same
     *
     * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
     */
    function inspect() {
        if (!this.isValid()) {
            return 'moment.invalid(/* ' + this._i + ' */)';
        }
        var func = 'moment',
            zone = '',
            prefix,
            year,
            datetime,
            suffix;
        if (!this.isLocal()) {
            func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
            zone = 'Z';
        }
        prefix = '[' + func + '("]';
        year = 0 <= this.year() && this.year() <= 9999 ? 'YYYY' : 'YYYYYY';
        datetime = '-MM-DD[T]HH:mm:ss.SSS';
        suffix = zone + '[")]';

        return this.format(prefix + year + datetime + suffix);
    }

    function format(inputString) {
        if (!inputString) {
            inputString = this.isUtc()
                ? hooks.defaultFormatUtc
                : hooks.defaultFormat;
        }
        var output = formatMoment(this, inputString);
        return this.localeData().postformat(output);
    }

    function from(time, withoutSuffix) {
        if (
            this.isValid() &&
            ((isMoment(time) && time.isValid()) || createLocal(time).isValid())
        ) {
            return createDuration({ to: this, from: time })
                .locale(this.locale())
                .humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function fromNow(withoutSuffix) {
        return this.from(createLocal(), withoutSuffix);
    }

    function to(time, withoutSuffix) {
        if (
            this.isValid() &&
            ((isMoment(time) && time.isValid()) || createLocal(time).isValid())
        ) {
            return createDuration({ from: this, to: time })
                .locale(this.locale())
                .humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function toNow(withoutSuffix) {
        return this.to(createLocal(), withoutSuffix);
    }

    // If passed a locale key, it will set the locale for this
    // instance.  Otherwise, it will return the locale configuration
    // variables for this instance.
    function locale(key) {
        var newLocaleData;

        if (key === undefined) {
            return this._locale._abbr;
        } else {
            newLocaleData = getLocale(key);
            if (newLocaleData != null) {
                this._locale = newLocaleData;
            }
            return this;
        }
    }

    var lang = deprecate(
        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
        function (key) {
            if (key === undefined) {
                return this.localeData();
            } else {
                return this.locale(key);
            }
        }
    );

    function localeData() {
        return this._locale;
    }

    var MS_PER_SECOND = 1000,
        MS_PER_MINUTE = 60 * MS_PER_SECOND,
        MS_PER_HOUR = 60 * MS_PER_MINUTE,
        MS_PER_400_YEARS = (365 * 400 + 97) * 24 * MS_PER_HOUR;

    // actual modulo - handles negative numbers (for dates before 1970):
    function mod$1(dividend, divisor) {
        return ((dividend % divisor) + divisor) % divisor;
    }

    function localStartOfDate(y, m, d) {
        // the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            // preserve leap years using a full 400 year cycle, then reset
            return new Date(y + 400, m, d) - MS_PER_400_YEARS;
        } else {
            return new Date(y, m, d).valueOf();
        }
    }

    function utcStartOfDate(y, m, d) {
        // Date.UTC remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            // preserve leap years using a full 400 year cycle, then reset
            return Date.UTC(y + 400, m, d) - MS_PER_400_YEARS;
        } else {
            return Date.UTC(y, m, d);
        }
    }

    function startOf(units) {
        var time, startOfDate;
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond' || !this.isValid()) {
            return this;
        }

        startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

        switch (units) {
            case 'year':
                time = startOfDate(this.year(), 0, 1);
                break;
            case 'quarter':
                time = startOfDate(
                    this.year(),
                    this.month() - (this.month() % 3),
                    1
                );
                break;
            case 'month':
                time = startOfDate(this.year(), this.month(), 1);
                break;
            case 'week':
                time = startOfDate(
                    this.year(),
                    this.month(),
                    this.date() - this.weekday()
                );
                break;
            case 'isoWeek':
                time = startOfDate(
                    this.year(),
                    this.month(),
                    this.date() - (this.isoWeekday() - 1)
                );
                break;
            case 'day':
            case 'date':
                time = startOfDate(this.year(), this.month(), this.date());
                break;
            case 'hour':
                time = this._d.valueOf();
                time -= mod$1(
                    time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
                    MS_PER_HOUR
                );
                break;
            case 'minute':
                time = this._d.valueOf();
                time -= mod$1(time, MS_PER_MINUTE);
                break;
            case 'second':
                time = this._d.valueOf();
                time -= mod$1(time, MS_PER_SECOND);
                break;
        }

        this._d.setTime(time);
        hooks.updateOffset(this, true);
        return this;
    }

    function endOf(units) {
        var time, startOfDate;
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond' || !this.isValid()) {
            return this;
        }

        startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

        switch (units) {
            case 'year':
                time = startOfDate(this.year() + 1, 0, 1) - 1;
                break;
            case 'quarter':
                time =
                    startOfDate(
                        this.year(),
                        this.month() - (this.month() % 3) + 3,
                        1
                    ) - 1;
                break;
            case 'month':
                time = startOfDate(this.year(), this.month() + 1, 1) - 1;
                break;
            case 'week':
                time =
                    startOfDate(
                        this.year(),
                        this.month(),
                        this.date() - this.weekday() + 7
                    ) - 1;
                break;
            case 'isoWeek':
                time =
                    startOfDate(
                        this.year(),
                        this.month(),
                        this.date() - (this.isoWeekday() - 1) + 7
                    ) - 1;
                break;
            case 'day':
            case 'date':
                time = startOfDate(this.year(), this.month(), this.date() + 1) - 1;
                break;
            case 'hour':
                time = this._d.valueOf();
                time +=
                    MS_PER_HOUR -
                    mod$1(
                        time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
                        MS_PER_HOUR
                    ) -
                    1;
                break;
            case 'minute':
                time = this._d.valueOf();
                time += MS_PER_MINUTE - mod$1(time, MS_PER_MINUTE) - 1;
                break;
            case 'second':
                time = this._d.valueOf();
                time += MS_PER_SECOND - mod$1(time, MS_PER_SECOND) - 1;
                break;
        }

        this._d.setTime(time);
        hooks.updateOffset(this, true);
        return this;
    }

    function valueOf() {
        return this._d.valueOf() - (this._offset || 0) * 60000;
    }

    function unix() {
        return Math.floor(this.valueOf() / 1000);
    }

    function toDate() {
        return new Date(this.valueOf());
    }

    function toArray() {
        var m = this;
        return [
            m.year(),
            m.month(),
            m.date(),
            m.hour(),
            m.minute(),
            m.second(),
            m.millisecond(),
        ];
    }

    function toObject() {
        var m = this;
        return {
            years: m.year(),
            months: m.month(),
            date: m.date(),
            hours: m.hours(),
            minutes: m.minutes(),
            seconds: m.seconds(),
            milliseconds: m.milliseconds(),
        };
    }

    function toJSON() {
        // new Date(NaN).toJSON() === null
        return this.isValid() ? this.toISOString() : null;
    }

    function isValid$2() {
        return isValid(this);
    }

    function parsingFlags() {
        return extend({}, getParsingFlags(this));
    }

    function invalidAt() {
        return getParsingFlags(this).overflow;
    }

    function creationData() {
        return {
            input: this._i,
            format: this._f,
            locale: this._locale,
            isUTC: this._isUTC,
            strict: this._strict,
        };
    }

    addFormatToken('N', 0, 0, 'eraAbbr');
    addFormatToken('NN', 0, 0, 'eraAbbr');
    addFormatToken('NNN', 0, 0, 'eraAbbr');
    addFormatToken('NNNN', 0, 0, 'eraName');
    addFormatToken('NNNNN', 0, 0, 'eraNarrow');

    addFormatToken('y', ['y', 1], 'yo', 'eraYear');
    addFormatToken('y', ['yy', 2], 0, 'eraYear');
    addFormatToken('y', ['yyy', 3], 0, 'eraYear');
    addFormatToken('y', ['yyyy', 4], 0, 'eraYear');

    addRegexToken('N', matchEraAbbr);
    addRegexToken('NN', matchEraAbbr);
    addRegexToken('NNN', matchEraAbbr);
    addRegexToken('NNNN', matchEraName);
    addRegexToken('NNNNN', matchEraNarrow);

    addParseToken(['N', 'NN', 'NNN', 'NNNN', 'NNNNN'], function (
        input,
        array,
        config,
        token
    ) {
        var era = config._locale.erasParse(input, token, config._strict);
        if (era) {
            getParsingFlags(config).era = era;
        } else {
            getParsingFlags(config).invalidEra = input;
        }
    });

    addRegexToken('y', matchUnsigned);
    addRegexToken('yy', matchUnsigned);
    addRegexToken('yyy', matchUnsigned);
    addRegexToken('yyyy', matchUnsigned);
    addRegexToken('yo', matchEraYearOrdinal);

    addParseToken(['y', 'yy', 'yyy', 'yyyy'], YEAR);
    addParseToken(['yo'], function (input, array, config, token) {
        var match;
        if (config._locale._eraYearOrdinalRegex) {
            match = input.match(config._locale._eraYearOrdinalRegex);
        }

        if (config._locale.eraYearOrdinalParse) {
            array[YEAR] = config._locale.eraYearOrdinalParse(input, match);
        } else {
            array[YEAR] = parseInt(input, 10);
        }
    });

    function localeEras(m, format) {
        var i,
            l,
            date,
            eras = this._eras || getLocale('en')._eras;
        for (i = 0, l = eras.length; i < l; ++i) {
            switch (typeof eras[i].since) {
                case 'string':
                    // truncate time
                    date = hooks(eras[i].since).startOf('day');
                    eras[i].since = date.valueOf();
                    break;
            }

            switch (typeof eras[i].until) {
                case 'undefined':
                    eras[i].until = +Infinity;
                    break;
                case 'string':
                    // truncate time
                    date = hooks(eras[i].until).startOf('day').valueOf();
                    eras[i].until = date.valueOf();
                    break;
            }
        }
        return eras;
    }

    function localeErasParse(eraName, format, strict) {
        var i,
            l,
            eras = this.eras(),
            name,
            abbr,
            narrow;
        eraName = eraName.toUpperCase();

        for (i = 0, l = eras.length; i < l; ++i) {
            name = eras[i].name.toUpperCase();
            abbr = eras[i].abbr.toUpperCase();
            narrow = eras[i].narrow.toUpperCase();

            if (strict) {
                switch (format) {
                    case 'N':
                    case 'NN':
                    case 'NNN':
                        if (abbr === eraName) {
                            return eras[i];
                        }
                        break;

                    case 'NNNN':
                        if (name === eraName) {
                            return eras[i];
                        }
                        break;

                    case 'NNNNN':
                        if (narrow === eraName) {
                            return eras[i];
                        }
                        break;
                }
            } else if ([name, abbr, narrow].indexOf(eraName) >= 0) {
                return eras[i];
            }
        }
    }

    function localeErasConvertYear(era, year) {
        var dir = era.since <= era.until ? +1 : -1;
        if (year === undefined) {
            return hooks(era.since).year();
        } else {
            return hooks(era.since).year() + (year - era.offset) * dir;
        }
    }

    function getEraName() {
        var i,
            l,
            val,
            eras = this.localeData().eras();
        for (i = 0, l = eras.length; i < l; ++i) {
            // truncate time
            val = this.startOf('day').valueOf();

            if (eras[i].since <= val && val <= eras[i].until) {
                return eras[i].name;
            }
            if (eras[i].until <= val && val <= eras[i].since) {
                return eras[i].name;
            }
        }

        return '';
    }

    function getEraNarrow() {
        var i,
            l,
            val,
            eras = this.localeData().eras();
        for (i = 0, l = eras.length; i < l; ++i) {
            // truncate time
            val = this.startOf('day').valueOf();

            if (eras[i].since <= val && val <= eras[i].until) {
                return eras[i].narrow;
            }
            if (eras[i].until <= val && val <= eras[i].since) {
                return eras[i].narrow;
            }
        }

        return '';
    }

    function getEraAbbr() {
        var i,
            l,
            val,
            eras = this.localeData().eras();
        for (i = 0, l = eras.length; i < l; ++i) {
            // truncate time
            val = this.startOf('day').valueOf();

            if (eras[i].since <= val && val <= eras[i].until) {
                return eras[i].abbr;
            }
            if (eras[i].until <= val && val <= eras[i].since) {
                return eras[i].abbr;
            }
        }

        return '';
    }

    function getEraYear() {
        var i,
            l,
            dir,
            val,
            eras = this.localeData().eras();
        for (i = 0, l = eras.length; i < l; ++i) {
            dir = eras[i].since <= eras[i].until ? +1 : -1;

            // truncate time
            val = this.startOf('day').valueOf();

            if (
                (eras[i].since <= val && val <= eras[i].until) ||
                (eras[i].until <= val && val <= eras[i].since)
            ) {
                return (
                    (this.year() - hooks(eras[i].since).year()) * dir +
                    eras[i].offset
                );
            }
        }

        return this.year();
    }

    function erasNameRegex(isStrict) {
        if (!hasOwnProp(this, '_erasNameRegex')) {
            computeErasParse.call(this);
        }
        return isStrict ? this._erasNameRegex : this._erasRegex;
    }

    function erasAbbrRegex(isStrict) {
        if (!hasOwnProp(this, '_erasAbbrRegex')) {
            computeErasParse.call(this);
        }
        return isStrict ? this._erasAbbrRegex : this._erasRegex;
    }

    function erasNarrowRegex(isStrict) {
        if (!hasOwnProp(this, '_erasNarrowRegex')) {
            computeErasParse.call(this);
        }
        return isStrict ? this._erasNarrowRegex : this._erasRegex;
    }

    function matchEraAbbr(isStrict, locale) {
        return locale.erasAbbrRegex(isStrict);
    }

    function matchEraName(isStrict, locale) {
        return locale.erasNameRegex(isStrict);
    }

    function matchEraNarrow(isStrict, locale) {
        return locale.erasNarrowRegex(isStrict);
    }

    function matchEraYearOrdinal(isStrict, locale) {
        return locale._eraYearOrdinalRegex || matchUnsigned;
    }

    function computeErasParse() {
        var abbrPieces = [],
            namePieces = [],
            narrowPieces = [],
            mixedPieces = [],
            i,
            l,
            eras = this.eras();

        for (i = 0, l = eras.length; i < l; ++i) {
            namePieces.push(regexEscape(eras[i].name));
            abbrPieces.push(regexEscape(eras[i].abbr));
            narrowPieces.push(regexEscape(eras[i].narrow));

            mixedPieces.push(regexEscape(eras[i].name));
            mixedPieces.push(regexEscape(eras[i].abbr));
            mixedPieces.push(regexEscape(eras[i].narrow));
        }

        this._erasRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._erasNameRegex = new RegExp('^(' + namePieces.join('|') + ')', 'i');
        this._erasAbbrRegex = new RegExp('^(' + abbrPieces.join('|') + ')', 'i');
        this._erasNarrowRegex = new RegExp(
            '^(' + narrowPieces.join('|') + ')',
            'i'
        );
    }

    // FORMATTING

    addFormatToken(0, ['gg', 2], 0, function () {
        return this.weekYear() % 100;
    });

    addFormatToken(0, ['GG', 2], 0, function () {
        return this.isoWeekYear() % 100;
    });

    function addWeekYearFormatToken(token, getter) {
        addFormatToken(0, [token, token.length], 0, getter);
    }

    addWeekYearFormatToken('gggg', 'weekYear');
    addWeekYearFormatToken('ggggg', 'weekYear');
    addWeekYearFormatToken('GGGG', 'isoWeekYear');
    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

    // ALIASES

    addUnitAlias('weekYear', 'gg');
    addUnitAlias('isoWeekYear', 'GG');

    // PRIORITY

    addUnitPriority('weekYear', 1);
    addUnitPriority('isoWeekYear', 1);

    // PARSING

    addRegexToken('G', matchSigned);
    addRegexToken('g', matchSigned);
    addRegexToken('GG', match1to2, match2);
    addRegexToken('gg', match1to2, match2);
    addRegexToken('GGGG', match1to4, match4);
    addRegexToken('gggg', match1to4, match4);
    addRegexToken('GGGGG', match1to6, match6);
    addRegexToken('ggggg', match1to6, match6);

    addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (
        input,
        week,
        config,
        token
    ) {
        week[token.substr(0, 2)] = toInt(input);
    });

    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
        week[token] = hooks.parseTwoDigitYear(input);
    });

    // MOMENTS

    function getSetWeekYear(input) {
        return getSetWeekYearHelper.call(
            this,
            input,
            this.week(),
            this.weekday(),
            this.localeData()._week.dow,
            this.localeData()._week.doy
        );
    }

    function getSetISOWeekYear(input) {
        return getSetWeekYearHelper.call(
            this,
            input,
            this.isoWeek(),
            this.isoWeekday(),
            1,
            4
        );
    }

    function getISOWeeksInYear() {
        return weeksInYear(this.year(), 1, 4);
    }

    function getISOWeeksInISOWeekYear() {
        return weeksInYear(this.isoWeekYear(), 1, 4);
    }

    function getWeeksInYear() {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    }

    function getWeeksInWeekYear() {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.weekYear(), weekInfo.dow, weekInfo.doy);
    }

    function getSetWeekYearHelper(input, week, weekday, dow, doy) {
        var weeksTarget;
        if (input == null) {
            return weekOfYear(this, dow, doy).year;
        } else {
            weeksTarget = weeksInYear(input, dow, doy);
            if (week > weeksTarget) {
                week = weeksTarget;
            }
            return setWeekAll.call(this, input, week, weekday, dow, doy);
        }
    }

    function setWeekAll(weekYear, week, weekday, dow, doy) {
        var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
            date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

        this.year(date.getUTCFullYear());
        this.month(date.getUTCMonth());
        this.date(date.getUTCDate());
        return this;
    }

    // FORMATTING

    addFormatToken('Q', 0, 'Qo', 'quarter');

    // ALIASES

    addUnitAlias('quarter', 'Q');

    // PRIORITY

    addUnitPriority('quarter', 7);

    // PARSING

    addRegexToken('Q', match1);
    addParseToken('Q', function (input, array) {
        array[MONTH] = (toInt(input) - 1) * 3;
    });

    // MOMENTS

    function getSetQuarter(input) {
        return input == null
            ? Math.ceil((this.month() + 1) / 3)
            : this.month((input - 1) * 3 + (this.month() % 3));
    }

    // FORMATTING

    addFormatToken('D', ['DD', 2], 'Do', 'date');

    // ALIASES

    addUnitAlias('date', 'D');

    // PRIORITY
    addUnitPriority('date', 9);

    // PARSING

    addRegexToken('D', match1to2);
    addRegexToken('DD', match1to2, match2);
    addRegexToken('Do', function (isStrict, locale) {
        // TODO: Remove "ordinalParse" fallback in next major release.
        return isStrict
            ? locale._dayOfMonthOrdinalParse || locale._ordinalParse
            : locale._dayOfMonthOrdinalParseLenient;
    });

    addParseToken(['D', 'DD'], DATE);
    addParseToken('Do', function (input, array) {
        array[DATE] = toInt(input.match(match1to2)[0]);
    });

    // MOMENTS

    var getSetDayOfMonth = makeGetSet('Date', true);

    // FORMATTING

    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

    // ALIASES

    addUnitAlias('dayOfYear', 'DDD');

    // PRIORITY
    addUnitPriority('dayOfYear', 4);

    // PARSING

    addRegexToken('DDD', match1to3);
    addRegexToken('DDDD', match3);
    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
        config._dayOfYear = toInt(input);
    });

    // HELPERS

    // MOMENTS

    function getSetDayOfYear(input) {
        var dayOfYear =
            Math.round(
                (this.clone().startOf('day') - this.clone().startOf('year')) / 864e5
            ) + 1;
        return input == null ? dayOfYear : this.add(input - dayOfYear, 'd');
    }

    // FORMATTING

    addFormatToken('m', ['mm', 2], 0, 'minute');

    // ALIASES

    addUnitAlias('minute', 'm');

    // PRIORITY

    addUnitPriority('minute', 14);

    // PARSING

    addRegexToken('m', match1to2);
    addRegexToken('mm', match1to2, match2);
    addParseToken(['m', 'mm'], MINUTE);

    // MOMENTS

    var getSetMinute = makeGetSet('Minutes', false);

    // FORMATTING

    addFormatToken('s', ['ss', 2], 0, 'second');

    // ALIASES

    addUnitAlias('second', 's');

    // PRIORITY

    addUnitPriority('second', 15);

    // PARSING

    addRegexToken('s', match1to2);
    addRegexToken('ss', match1to2, match2);
    addParseToken(['s', 'ss'], SECOND);

    // MOMENTS

    var getSetSecond = makeGetSet('Seconds', false);

    // FORMATTING

    addFormatToken('S', 0, 0, function () {
        return ~~(this.millisecond() / 100);
    });

    addFormatToken(0, ['SS', 2], 0, function () {
        return ~~(this.millisecond() / 10);
    });

    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
    addFormatToken(0, ['SSSS', 4], 0, function () {
        return this.millisecond() * 10;
    });
    addFormatToken(0, ['SSSSS', 5], 0, function () {
        return this.millisecond() * 100;
    });
    addFormatToken(0, ['SSSSSS', 6], 0, function () {
        return this.millisecond() * 1000;
    });
    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
        return this.millisecond() * 10000;
    });
    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
        return this.millisecond() * 100000;
    });
    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
        return this.millisecond() * 1000000;
    });

    // ALIASES

    addUnitAlias('millisecond', 'ms');

    // PRIORITY

    addUnitPriority('millisecond', 16);

    // PARSING

    addRegexToken('S', match1to3, match1);
    addRegexToken('SS', match1to3, match2);
    addRegexToken('SSS', match1to3, match3);

    var token, getSetMillisecond;
    for (token = 'SSSS'; token.length <= 9; token += 'S') {
        addRegexToken(token, matchUnsigned);
    }

    function parseMs(input, array) {
        array[MILLISECOND] = toInt(('0.' + input) * 1000);
    }

    for (token = 'S'; token.length <= 9; token += 'S') {
        addParseToken(token, parseMs);
    }

    getSetMillisecond = makeGetSet('Milliseconds', false);

    // FORMATTING

    addFormatToken('z', 0, 0, 'zoneAbbr');
    addFormatToken('zz', 0, 0, 'zoneName');

    // MOMENTS

    function getZoneAbbr() {
        return this._isUTC ? 'UTC' : '';
    }

    function getZoneName() {
        return this._isUTC ? 'Coordinated Universal Time' : '';
    }

    var proto = Moment.prototype;

    proto.add = add;
    proto.calendar = calendar$1;
    proto.clone = clone;
    proto.diff = diff;
    proto.endOf = endOf;
    proto.format = format;
    proto.from = from;
    proto.fromNow = fromNow;
    proto.to = to;
    proto.toNow = toNow;
    proto.get = stringGet;
    proto.invalidAt = invalidAt;
    proto.isAfter = isAfter;
    proto.isBefore = isBefore;
    proto.isBetween = isBetween;
    proto.isSame = isSame;
    proto.isSameOrAfter = isSameOrAfter;
    proto.isSameOrBefore = isSameOrBefore;
    proto.isValid = isValid$2;
    proto.lang = lang;
    proto.locale = locale;
    proto.localeData = localeData;
    proto.max = prototypeMax;
    proto.min = prototypeMin;
    proto.parsingFlags = parsingFlags;
    proto.set = stringSet;
    proto.startOf = startOf;
    proto.subtract = subtract;
    proto.toArray = toArray;
    proto.toObject = toObject;
    proto.toDate = toDate;
    proto.toISOString = toISOString;
    proto.inspect = inspect;
    if (typeof Symbol !== 'undefined' && Symbol.for != null) {
        proto[Symbol.for('nodejs.util.inspect.custom')] = function () {
            return 'Moment<' + this.format() + '>';
        };
    }
    proto.toJSON = toJSON;
    proto.toString = toString;
    proto.unix = unix;
    proto.valueOf = valueOf;
    proto.creationData = creationData;
    proto.eraName = getEraName;
    proto.eraNarrow = getEraNarrow;
    proto.eraAbbr = getEraAbbr;
    proto.eraYear = getEraYear;
    proto.year = getSetYear;
    proto.isLeapYear = getIsLeapYear;
    proto.weekYear = getSetWeekYear;
    proto.isoWeekYear = getSetISOWeekYear;
    proto.quarter = proto.quarters = getSetQuarter;
    proto.month = getSetMonth;
    proto.daysInMonth = getDaysInMonth;
    proto.week = proto.weeks = getSetWeek;
    proto.isoWeek = proto.isoWeeks = getSetISOWeek;
    proto.weeksInYear = getWeeksInYear;
    proto.weeksInWeekYear = getWeeksInWeekYear;
    proto.isoWeeksInYear = getISOWeeksInYear;
    proto.isoWeeksInISOWeekYear = getISOWeeksInISOWeekYear;
    proto.date = getSetDayOfMonth;
    proto.day = proto.days = getSetDayOfWeek;
    proto.weekday = getSetLocaleDayOfWeek;
    proto.isoWeekday = getSetISODayOfWeek;
    proto.dayOfYear = getSetDayOfYear;
    proto.hour = proto.hours = getSetHour;
    proto.minute = proto.minutes = getSetMinute;
    proto.second = proto.seconds = getSetSecond;
    proto.millisecond = proto.milliseconds = getSetMillisecond;
    proto.utcOffset = getSetOffset;
    proto.utc = setOffsetToUTC;
    proto.local = setOffsetToLocal;
    proto.parseZone = setOffsetToParsedOffset;
    proto.hasAlignedHourOffset = hasAlignedHourOffset;
    proto.isDST = isDaylightSavingTime;
    proto.isLocal = isLocal;
    proto.isUtcOffset = isUtcOffset;
    proto.isUtc = isUtc;
    proto.isUTC = isUtc;
    proto.zoneAbbr = getZoneAbbr;
    proto.zoneName = getZoneName;
    proto.dates = deprecate(
        'dates accessor is deprecated. Use date instead.',
        getSetDayOfMonth
    );
    proto.months = deprecate(
        'months accessor is deprecated. Use month instead',
        getSetMonth
    );
    proto.years = deprecate(
        'years accessor is deprecated. Use year instead',
        getSetYear
    );
    proto.zone = deprecate(
        'moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/',
        getSetZone
    );
    proto.isDSTShifted = deprecate(
        'isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information',
        isDaylightSavingTimeShifted
    );

    function createUnix(input) {
        return createLocal(input * 1000);
    }

    function createInZone() {
        return createLocal.apply(null, arguments).parseZone();
    }

    function preParsePostFormat(string) {
        return string;
    }

    var proto$1 = Locale.prototype;

    proto$1.calendar = calendar;
    proto$1.longDateFormat = longDateFormat;
    proto$1.invalidDate = invalidDate;
    proto$1.ordinal = ordinal;
    proto$1.preparse = preParsePostFormat;
    proto$1.postformat = preParsePostFormat;
    proto$1.relativeTime = relativeTime;
    proto$1.pastFuture = pastFuture;
    proto$1.set = set;
    proto$1.eras = localeEras;
    proto$1.erasParse = localeErasParse;
    proto$1.erasConvertYear = localeErasConvertYear;
    proto$1.erasAbbrRegex = erasAbbrRegex;
    proto$1.erasNameRegex = erasNameRegex;
    proto$1.erasNarrowRegex = erasNarrowRegex;

    proto$1.months = localeMonths;
    proto$1.monthsShort = localeMonthsShort;
    proto$1.monthsParse = localeMonthsParse;
    proto$1.monthsRegex = monthsRegex;
    proto$1.monthsShortRegex = monthsShortRegex;
    proto$1.week = localeWeek;
    proto$1.firstDayOfYear = localeFirstDayOfYear;
    proto$1.firstDayOfWeek = localeFirstDayOfWeek;

    proto$1.weekdays = localeWeekdays;
    proto$1.weekdaysMin = localeWeekdaysMin;
    proto$1.weekdaysShort = localeWeekdaysShort;
    proto$1.weekdaysParse = localeWeekdaysParse;

    proto$1.weekdaysRegex = weekdaysRegex;
    proto$1.weekdaysShortRegex = weekdaysShortRegex;
    proto$1.weekdaysMinRegex = weekdaysMinRegex;

    proto$1.isPM = localeIsPM;
    proto$1.meridiem = localeMeridiem;

    function get$1(format, index, field, setter) {
        var locale = getLocale(),
            utc = createUTC().set(setter, index);
        return locale[field](utc, format);
    }

    function listMonthsImpl(format, index, field) {
        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';

        if (index != null) {
            return get$1(format, index, field, 'month');
        }

        var i,
            out = [];
        for (i = 0; i < 12; i++) {
            out[i] = get$1(format, i, field, 'month');
        }
        return out;
    }

    // ()
    // (5)
    // (fmt, 5)
    // (fmt)
    // (true)
    // (true, 5)
    // (true, fmt, 5)
    // (true, fmt)
    function listWeekdaysImpl(localeSorted, format, index, field) {
        if (typeof localeSorted === 'boolean') {
            if (isNumber(format)) {
                index = format;
                format = undefined;
            }

            format = format || '';
        } else {
            format = localeSorted;
            index = format;
            localeSorted = false;

            if (isNumber(format)) {
                index = format;
                format = undefined;
            }

            format = format || '';
        }

        var locale = getLocale(),
            shift = localeSorted ? locale._week.dow : 0,
            i,
            out = [];

        if (index != null) {
            return get$1(format, (index + shift) % 7, field, 'day');
        }

        for (i = 0; i < 7; i++) {
            out[i] = get$1(format, (i + shift) % 7, field, 'day');
        }
        return out;
    }

    function listMonths(format, index) {
        return listMonthsImpl(format, index, 'months');
    }

    function listMonthsShort(format, index) {
        return listMonthsImpl(format, index, 'monthsShort');
    }

    function listWeekdays(localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
    }

    function listWeekdaysShort(localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
    }

    function listWeekdaysMin(localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
    }

    getSetGlobalLocale('en', {
        eras: [
            {
                since: '0001-01-01',
                until: +Infinity,
                offset: 1,
                name: 'Anno Domini',
                narrow: 'AD',
                abbr: 'AD',
            },
            {
                since: '0000-12-31',
                until: -Infinity,
                offset: 1,
                name: 'Before Christ',
                narrow: 'BC',
                abbr: 'BC',
            },
        ],
        dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal: function (number) {
            var b = number % 10,
                output =
                    toInt((number % 100) / 10) === 1
                        ? 'th'
                        : b === 1
                        ? 'st'
                        : b === 2
                        ? 'nd'
                        : b === 3
                        ? 'rd'
                        : 'th';
            return number + output;
        },
    });

    // Side effect imports

    hooks.lang = deprecate(
        'moment.lang is deprecated. Use moment.locale instead.',
        getSetGlobalLocale
    );
    hooks.langData = deprecate(
        'moment.langData is deprecated. Use moment.localeData instead.',
        getLocale
    );

    var mathAbs = Math.abs;

    function abs() {
        var data = this._data;

        this._milliseconds = mathAbs(this._milliseconds);
        this._days = mathAbs(this._days);
        this._months = mathAbs(this._months);

        data.milliseconds = mathAbs(data.milliseconds);
        data.seconds = mathAbs(data.seconds);
        data.minutes = mathAbs(data.minutes);
        data.hours = mathAbs(data.hours);
        data.months = mathAbs(data.months);
        data.years = mathAbs(data.years);

        return this;
    }

    function addSubtract$1(duration, input, value, direction) {
        var other = createDuration(input, value);

        duration._milliseconds += direction * other._milliseconds;
        duration._days += direction * other._days;
        duration._months += direction * other._months;

        return duration._bubble();
    }

    // supports only 2.0-style add(1, 's') or add(duration)
    function add$1(input, value) {
        return addSubtract$1(this, input, value, 1);
    }

    // supports only 2.0-style subtract(1, 's') or subtract(duration)
    function subtract$1(input, value) {
        return addSubtract$1(this, input, value, -1);
    }

    function absCeil(number) {
        if (number < 0) {
            return Math.floor(number);
        } else {
            return Math.ceil(number);
        }
    }

    function bubble() {
        var milliseconds = this._milliseconds,
            days = this._days,
            months = this._months,
            data = this._data,
            seconds,
            minutes,
            hours,
            years,
            monthsFromDays;

        // if we have a mix of positive and negative values, bubble down first
        // check: https://github.com/moment/moment/issues/2166
        if (
            !(
                (milliseconds >= 0 && days >= 0 && months >= 0) ||
                (milliseconds <= 0 && days <= 0 && months <= 0)
            )
        ) {
            milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
            days = 0;
            months = 0;
        }

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;

        seconds = absFloor(milliseconds / 1000);
        data.seconds = seconds % 60;

        minutes = absFloor(seconds / 60);
        data.minutes = minutes % 60;

        hours = absFloor(minutes / 60);
        data.hours = hours % 24;

        days += absFloor(hours / 24);

        // convert days to months
        monthsFromDays = absFloor(daysToMonths(days));
        months += monthsFromDays;
        days -= absCeil(monthsToDays(monthsFromDays));

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        data.days = days;
        data.months = months;
        data.years = years;

        return this;
    }

    function daysToMonths(days) {
        // 400 years have 146097 days (taking into account leap year rules)
        // 400 years have 12 months === 4800
        return (days * 4800) / 146097;
    }

    function monthsToDays(months) {
        // the reverse of daysToMonths
        return (months * 146097) / 4800;
    }

    function as(units) {
        if (!this.isValid()) {
            return NaN;
        }
        var days,
            months,
            milliseconds = this._milliseconds;

        units = normalizeUnits(units);

        if (units === 'month' || units === 'quarter' || units === 'year') {
            days = this._days + milliseconds / 864e5;
            months = this._months + daysToMonths(days);
            switch (units) {
                case 'month':
                    return months;
                case 'quarter':
                    return months / 3;
                case 'year':
                    return months / 12;
            }
        } else {
            // handle milliseconds separately because of floating point math errors (issue #1867)
            days = this._days + Math.round(monthsToDays(this._months));
            switch (units) {
                case 'week':
                    return days / 7 + milliseconds / 6048e5;
                case 'day':
                    return days + milliseconds / 864e5;
                case 'hour':
                    return days * 24 + milliseconds / 36e5;
                case 'minute':
                    return days * 1440 + milliseconds / 6e4;
                case 'second':
                    return days * 86400 + milliseconds / 1000;
                // Math.floor prevents floating point math errors here
                case 'millisecond':
                    return Math.floor(days * 864e5) + milliseconds;
                default:
                    throw new Error('Unknown unit ' + units);
            }
        }
    }

    // TODO: Use this.as('ms')?
    function valueOf$1() {
        if (!this.isValid()) {
            return NaN;
        }
        return (
            this._milliseconds +
            this._days * 864e5 +
            (this._months % 12) * 2592e6 +
            toInt(this._months / 12) * 31536e6
        );
    }

    function makeAs(alias) {
        return function () {
            return this.as(alias);
        };
    }

    var asMilliseconds = makeAs('ms'),
        asSeconds = makeAs('s'),
        asMinutes = makeAs('m'),
        asHours = makeAs('h'),
        asDays = makeAs('d'),
        asWeeks = makeAs('w'),
        asMonths = makeAs('M'),
        asQuarters = makeAs('Q'),
        asYears = makeAs('y');

    function clone$1() {
        return createDuration(this);
    }

    function get$2(units) {
        units = normalizeUnits(units);
        return this.isValid() ? this[units + 's']() : NaN;
    }

    function makeGetter(name) {
        return function () {
            return this.isValid() ? this._data[name] : NaN;
        };
    }

    var milliseconds = makeGetter('milliseconds'),
        seconds = makeGetter('seconds'),
        minutes = makeGetter('minutes'),
        hours = makeGetter('hours'),
        days = makeGetter('days'),
        months = makeGetter('months'),
        years = makeGetter('years');

    function weeks() {
        return absFloor(this.days() / 7);
    }

    var round = Math.round,
        thresholds = {
            ss: 44, // a few seconds to seconds
            s: 45, // seconds to minute
            m: 45, // minutes to hour
            h: 22, // hours to day
            d: 26, // days to month/week
            w: null, // weeks to month
            M: 11, // months to year
        };

    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime$1(posNegDuration, withoutSuffix, thresholds, locale) {
        var duration = createDuration(posNegDuration).abs(),
            seconds = round(duration.as('s')),
            minutes = round(duration.as('m')),
            hours = round(duration.as('h')),
            days = round(duration.as('d')),
            months = round(duration.as('M')),
            weeks = round(duration.as('w')),
            years = round(duration.as('y')),
            a =
                (seconds <= thresholds.ss && ['s', seconds]) ||
                (seconds < thresholds.s && ['ss', seconds]) ||
                (minutes <= 1 && ['m']) ||
                (minutes < thresholds.m && ['mm', minutes]) ||
                (hours <= 1 && ['h']) ||
                (hours < thresholds.h && ['hh', hours]) ||
                (days <= 1 && ['d']) ||
                (days < thresholds.d && ['dd', days]);

        if (thresholds.w != null) {
            a =
                a ||
                (weeks <= 1 && ['w']) ||
                (weeks < thresholds.w && ['ww', weeks]);
        }
        a = a ||
            (months <= 1 && ['M']) ||
            (months < thresholds.M && ['MM', months]) ||
            (years <= 1 && ['y']) || ['yy', years];

        a[2] = withoutSuffix;
        a[3] = +posNegDuration > 0;
        a[4] = locale;
        return substituteTimeAgo.apply(null, a);
    }

    // This function allows you to set the rounding function for relative time strings
    function getSetRelativeTimeRounding(roundingFunction) {
        if (roundingFunction === undefined) {
            return round;
        }
        if (typeof roundingFunction === 'function') {
            round = roundingFunction;
            return true;
        }
        return false;
    }

    // This function allows you to set a threshold for relative time strings
    function getSetRelativeTimeThreshold(threshold, limit) {
        if (thresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return thresholds[threshold];
        }
        thresholds[threshold] = limit;
        if (threshold === 's') {
            thresholds.ss = limit - 1;
        }
        return true;
    }

    function humanize(argWithSuffix, argThresholds) {
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }

        var withSuffix = false,
            th = thresholds,
            locale,
            output;

        if (typeof argWithSuffix === 'object') {
            argThresholds = argWithSuffix;
            argWithSuffix = false;
        }
        if (typeof argWithSuffix === 'boolean') {
            withSuffix = argWithSuffix;
        }
        if (typeof argThresholds === 'object') {
            th = Object.assign({}, thresholds, argThresholds);
            if (argThresholds.s != null && argThresholds.ss == null) {
                th.ss = argThresholds.s - 1;
            }
        }

        locale = this.localeData();
        output = relativeTime$1(this, !withSuffix, th, locale);

        if (withSuffix) {
            output = locale.pastFuture(+this, output);
        }

        return locale.postformat(output);
    }

    var abs$1 = Math.abs;

    function sign(x) {
        return (x > 0) - (x < 0) || +x;
    }

    function toISOString$1() {
        // for ISO strings we do not use the normal bubbling rules:
        //  * milliseconds bubble up until they become hours
        //  * days do not bubble at all
        //  * months bubble up until they become years
        // This is because there is no context-free conversion between hours and days
        // (think of clock changes)
        // and also not between days and months (28-31 days per month)
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }

        var seconds = abs$1(this._milliseconds) / 1000,
            days = abs$1(this._days),
            months = abs$1(this._months),
            minutes,
            hours,
            years,
            s,
            total = this.asSeconds(),
            totalSign,
            ymSign,
            daysSign,
            hmsSign;

        if (!total) {
            // this is the same as C#'s (Noda) and python (isodate)...
            // but not other JS (goog.date)
            return 'P0D';
        }

        // 3600 seconds -> 60 minutes -> 1 hour
        minutes = absFloor(seconds / 60);
        hours = absFloor(minutes / 60);
        seconds %= 60;
        minutes %= 60;

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
        s = seconds ? seconds.toFixed(3).replace(/\.?0+$/, '') : '';

        totalSign = total < 0 ? '-' : '';
        ymSign = sign(this._months) !== sign(total) ? '-' : '';
        daysSign = sign(this._days) !== sign(total) ? '-' : '';
        hmsSign = sign(this._milliseconds) !== sign(total) ? '-' : '';

        return (
            totalSign +
            'P' +
            (years ? ymSign + years + 'Y' : '') +
            (months ? ymSign + months + 'M' : '') +
            (days ? daysSign + days + 'D' : '') +
            (hours || minutes || seconds ? 'T' : '') +
            (hours ? hmsSign + hours + 'H' : '') +
            (minutes ? hmsSign + minutes + 'M' : '') +
            (seconds ? hmsSign + s + 'S' : '')
        );
    }

    var proto$2 = Duration.prototype;

    proto$2.isValid = isValid$1;
    proto$2.abs = abs;
    proto$2.add = add$1;
    proto$2.subtract = subtract$1;
    proto$2.as = as;
    proto$2.asMilliseconds = asMilliseconds;
    proto$2.asSeconds = asSeconds;
    proto$2.asMinutes = asMinutes;
    proto$2.asHours = asHours;
    proto$2.asDays = asDays;
    proto$2.asWeeks = asWeeks;
    proto$2.asMonths = asMonths;
    proto$2.asQuarters = asQuarters;
    proto$2.asYears = asYears;
    proto$2.valueOf = valueOf$1;
    proto$2._bubble = bubble;
    proto$2.clone = clone$1;
    proto$2.get = get$2;
    proto$2.milliseconds = milliseconds;
    proto$2.seconds = seconds;
    proto$2.minutes = minutes;
    proto$2.hours = hours;
    proto$2.days = days;
    proto$2.weeks = weeks;
    proto$2.months = months;
    proto$2.years = years;
    proto$2.humanize = humanize;
    proto$2.toISOString = toISOString$1;
    proto$2.toString = toISOString$1;
    proto$2.toJSON = toISOString$1;
    proto$2.locale = locale;
    proto$2.localeData = localeData;

    proto$2.toIsoString = deprecate(
        'toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)',
        toISOString$1
    );
    proto$2.lang = lang;

    // FORMATTING

    addFormatToken('X', 0, 0, 'unix');
    addFormatToken('x', 0, 0, 'valueOf');

    // PARSING

    addRegexToken('x', matchSigned);
    addRegexToken('X', matchTimestamp);
    addParseToken('X', function (input, array, config) {
        config._d = new Date(parseFloat(input) * 1000);
    });
    addParseToken('x', function (input, array, config) {
        config._d = new Date(toInt(input));
    });

    //! moment.js

    hooks.version = '2.27.0';

    setHookCallback(createLocal);

    hooks.fn = proto;
    hooks.min = min;
    hooks.max = max;
    hooks.now = now;
    hooks.utc = createUTC;
    hooks.unix = createUnix;
    hooks.months = listMonths;
    hooks.isDate = isDate;
    hooks.locale = getSetGlobalLocale;
    hooks.invalid = createInvalid;
    hooks.duration = createDuration;
    hooks.isMoment = isMoment;
    hooks.weekdays = listWeekdays;
    hooks.parseZone = createInZone;
    hooks.localeData = getLocale;
    hooks.isDuration = isDuration;
    hooks.monthsShort = listMonthsShort;
    hooks.weekdaysMin = listWeekdaysMin;
    hooks.defineLocale = defineLocale;
    hooks.updateLocale = updateLocale;
    hooks.locales = listLocales;
    hooks.weekdaysShort = listWeekdaysShort;
    hooks.normalizeUnits = normalizeUnits;
    hooks.relativeTimeRounding = getSetRelativeTimeRounding;
    hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
    hooks.calendarFormat = getCalendarFormat;
    hooks.prototype = proto;

    // currently HTML5 input type only supports 24-hour formats
    hooks.HTML5_FMT = {
        DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm', // <input type="datetime-local" />
        DATETIME_LOCAL_SECONDS: 'YYYY-MM-DDTHH:mm:ss', // <input type="datetime-local" step="1" />
        DATETIME_LOCAL_MS: 'YYYY-MM-DDTHH:mm:ss.SSS', // <input type="datetime-local" step="0.001" />
        DATE: 'YYYY-MM-DD', // <input type="date" />
        TIME: 'HH:mm', // <input type="time" />
        TIME_SECONDS: 'HH:mm:ss', // <input type="time" step="1" />
        TIME_MS: 'HH:mm:ss.SSS', // <input type="time" step="0.001" />
        WEEK: 'GGGG-[W]WW', // <input type="week" />
        MONTH: 'YYYY-MM', // <input type="month" />
    };

    return hooks;

})));

},{}]},{},[1]);
