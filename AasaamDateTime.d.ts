import { Moment as MomentGeorgian } from 'moment';
import { Moment as MomentHijri } from 'moment-hijri';
import { Moment as MomentJalaali } from 'moment-jalaali';

// Calendar supported types
type Calendar = 'i' | 'p' | 'g';

// ISO 639-1 language code
type Language = 'ar' | 'az' | 'bn' | 'de' | 'en' | 'es' | 'fa' | 'fr' | 'hi' | 'id' | 'it' | 'ja' | 'ko' | 'ku' | 'nl' | 'pl' | 'ps' | 'pt' | 'ru' | 'sw' | 'tr' | 'ur' | 'zh';

// ISO 8601 Date time format
type ISOFormatObject = {
  c: string,
  H: string,
  HH: string,
  m: string,
  mm: string,
  s: string,
  ss: string,
  YYYY: string,
  YY: string,
  MMMM: string,
  MM: string,
  M: string,
  d: string,
  dd: string,
  E: string,
  EE: string,
  EEEE: string,
  e: string,
  G: string,
  GGGG: string,
  zzzz: string,
};

type YearItem = {
  i: number,
  native: string,
  locale: string,
  selected: boolean,
  date: Date,
};

type MonthItem = {
  i: number,
  native: string,
  locale: string,
  selected: boolean,
  date: Date,
};

type EventItem = {
  title: {
    [key: Language]: string;
  },
  holiday: {
    [key: string]: boolean,
  },
  year: number,
};

type Events = {
  [key: string]: EventItem[]
};

type EventKey = {
  key: string,
  yearNumber: number,
};

type SpecialDay = {
  calendar: string,
  eventKeys: EventKey[],
  dayLocale: string,
  dayNative: string,
  monthName: string,
  monthNumber: number,
  monthNameNative: string
};

type PreferredCalendars = {
  [key: string]: Calendar[]
};

type DateAlternate = {
  calendar: Calendar,
  dayNative: string,
  dayLocale: string,
  monthName: string,
  monthNameNative: string,
};

type DayEvent = {
  th: number,
  thLocale: string,
  title: string,
};

type DayInMonth = {
  date: Date,
  dateOnly: Date,
  dateStart: Date,
  dateEnd: Date,
  dayNative: string,
  dayLocale: string,
  localeDate: string,
  alt: DateAlternate[],
  weekSeq: number,
  weekend: boolean,
  selected: boolean,
  events: DayEvent[],
};

type MonthWeekDays = {
  calendar: string,
  calendarName: string,
  calendarNameAbbr: string,
  days: DayInMonth[],
};

type WeekHead = {
  name: string,
  narrow: string,
  weekend: false
};

type MonthWeeksTable = {
  calendar: string,
  calendarName: string,
  calendarNameAbbr: string,
  head: WeekHead[],
  weeks: DayInMonth[] | boolean[],
};

declare class AasaamDateTime {
  /**
   * Get event key base on calendar, month and day
   *
   * @param {Calendar} calendar Calendar type
   * @param {number|string} month Month number between 1 to 12
   * @param {number|string} day Day number between 1 to 31
   * @return {string}
   */
  static public getEventKey(calendar: Calendar, month: number | string, day: number | string): string;

  /**
   * IANA timezone
   *
   * @returns {string}
   */
  static public getTimeZone(): string

  /**
   * Create AasaamDateTime
   *
   * @param {Date|Number} date Standard JavaScript Date object or integer unix time
   * @param {('ar'|'az'|'bn'|'de'|'en'|'es'|'fa'|'fr'|'hi'|'id'|'it'|'ja'|'ko'|'ku'|'nl'|'pl'|'ps'|'pt'|'ru'|'sw'|'tr'|'ur'|'zh')} language ISO 639-1 language code
   * @param {Language} language ISO 639-1 language code

   */
  constructor(date?: Date | number = new Date(), language?: Language = 'fa');

  /**
   * @param {Language} language ISO 639-1 language code
   * @throws {Error}
   * @return {AasaamDateTime}
   */
  public setLanguage(language: Language): AasaamDateTime

  /**
   * @param {Date} date Standard JavaScript Date object
   * @throws {Error}
   * @return {AasaamDateTime}
   */
  public setDate(date: Date): AasaamDateTime

  /**
   * @param {number} unixTime Unix time integer in milliseconds
   * @return {AasaamDateTime}
   */
  public setUnixTime(unixTime: number): AasaamDateTime

  /**
   * @return {number}
   */
  public getUnixTime(): number

  /**
   * @returns {Date}
   */
  public getDate(): Date

  /**
   * @param {number} hours Hour number between 0-23
   * @return {AasaamDateTime}
   */
  public setHours(hours: number): AasaamDateTime

  /**
   * @param {number} minutes Minute number between 0-59
   * @return {AasaamDateTime}
   */
  public setMinutes(minutes: number): AasaamDateTime

  /**
   * @param {number} seconds Second number between 0-59
   * @return {AasaamDateTime}
   */
  public setSeconds(seconds: number): AasaamDateTime

  /**
   * @param {number} country ISO 3166-2 country code
   * @return {AasaamDateTime}
   */
  public changeCountry(country: string): AasaamDateTime

  /**
   * @param {Calendar} calendar Calendar type
   * @return {MomentGeorgian|MomentHijri|MomentJalaali}
   */
  public getMoment(calendar?: Calendar = undefined): MomentGeorgian | MomentHijri | MomentJalaali;

  /**
   * @param {number} offset Could be negative or positive number
   * @param {Calendar} calendar Calendar type
   * @return {AasaamDateTime}
   */
  public yearOffset(offset: number, calendar?: Calendar = undefined): AasaamDateTime;

  /**
   * @param {number} offset Could be negative or positive number
   * @param {Calendar} calendar Calendar type
   * @return {AasaamDateTime}
   */
  public monthOffset(offset: number, calendar?: Calendar = undefined): AasaamDateTime;

  /**
   * @param {number} offset Could be negative or positive number
   * @param {Calendar} calendar Calendar type
   * @return {AasaamDateTime}
   */
  public dayOffset(offset: number, calendar?: Calendar = undefined): AasaamDateTime;

  /**
   * ISO format object
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
   * - `c` _Calendar type_ (**p**)
   *
   * @param {Language} language ISO 639-1 language code
   * @param {Calendar} calendar Calendar type
   * @return {ISOFormatObject}
   */
  public isoFormatObject(language?: Language = undefined, calendar?: Calendar = undefined): ISOFormatObject;

  /**
   * ISO format
   *
   * Return string base of format of ISO 8601 Date
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
   * @param {string} format ISO format
   * @param {Language} language ISO 639-1 language code
   * @param {Calendar} calendar Calendar type
   * @return {string}
   */
  public isoFormat(format: string, language?: Language = undefined, calendar?: Calendar = undefined): string;

  /**
   * Moment format
   *
   * @param {string} format Strong contain ISO 8601 formats
   * @param {Language} language ISO 639-1 language code
   * @return {string}
   */
  public momentFormat(format: string, language?: Language = undefined): string;

  /**
   * Moment parse
   *
   * @param {string} string String want to parse
   * @param {string} format String contain ISO 8601 formats
   * @param {Calendar} calendar Calendar type
   * @return {AasaamDateTime}
   */
  public momentParse(string: string, format: string, calendar?: Calendar = undefined): AasaamDateTime;

  /**
   * @param {Calendar} calendar Calendar type
   * @param {number} offset Offset of before and after
   * @return {YearItem[]}
   */
  public generateYearList(calendar?: Calendar = undefined, offset?: number = 60): YearItem[]

  /**
   * @param {Calendar} calendar Calendar type
   * @return {MonthItem[]}
   */
  public generateMonthList(calendar?: Calendar = undefined): MonthItem[]

  /**
   * @param {Date} date Standard JavaScript Date object
   * @param {Calendar} calendar Calendar type
   * @return {SpecialDay}
   */
  public getAlternateCalendarData(date: Date, calendar: Calendar): SpecialDay

  /**
   * @param {Calendar[]} calendarList Calendar type
   * @param {boolean} addEvents Add
   * @return {MonthWeekDays}
   */
  public generateMonthWeekDays(calendarList: Calendar[] = [], addEvents: boolean = false): MonthWeekDays

  /**
   * @param {Calendar[]} calendarList Calendar type
   * @param {boolean} addEvents Add
   * @return {MonthWeeksTable}
   */
  public generateMonthWeekTable(calendarList: Calendar[] = [], addEvents: boolean = false): MonthWeeksTable
}

export const momentG: MomentGeorgian;
export const momentH: MomentHijri;
export const momentJ: MomentJalaali;
export const events: Events;
export const languages: Language[];
export const preferredCalendars: PreferredCalendars;
export const CALENDAR_TYPE_GREGORIAN: string = 'g';
export const CALENDAR_TYPE_ISLAMIC: string = 'i';
export const CALENDAR_TYPE_PERSIAN: string = 'p';
export const AasaamDateTime: AasaamDateTime;
