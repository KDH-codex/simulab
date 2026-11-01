import { FESTIVALS, DATA_REVIEWED_AT, REGION_SOURCES } from './data.js?v=20261023_verified1';
import {filterEvents as filterRecords,monthRange,validateEvent} from './model.js';
export * from './model.js';
export {DATA_REVIEWED_AT,REGION_SOURCES};
export function filterEvents(options,events=FESTIVALS){return filterRecords(options,events);}
export const KidsOutingLogic = {
  FESTIVALS_DATA: FESTIVALS,
  getAllFestivals: () => FESTIVALS.filter(event => !validateEvent(event).length),
  searchFestivals({ year, month, ...options }) { return filterEvents({ ...monthRange(year, month), ...options }); },
  getEventsOnDate(date, options = {}) { return filterEvents({ start: date, end: date, ...options }); }
};
