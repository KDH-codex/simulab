import {buildChristmasCollection} from './festival-christmas.mjs';
import {buildWeekend} from './festival-pages.mjs';
import {buildSeoCollections} from './festival-seo-pages.mjs';
await buildWeekend();
await buildChristmasCollection();
await buildSeoCollections();
