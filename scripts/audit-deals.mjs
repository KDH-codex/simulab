import {readFile} from 'node:fs/promises';
import {validateShop,reviewState} from '../tools/parenting-deals/model.js';
const {shops}=JSON.parse(await readFile(new URL('../data/deals/shops.json',import.meta.url),'utf8'));
let invalid=0;
for(const shop of shops){const errors=validateShop(shop);if(errors.length){invalid++;console.error(shop.id+': '+errors.join(', '));}console.log(shop.name+' — '+reviewState(shop).label+' — '+shop.checkedAt);}
if(invalid)process.exitCode=1;
else console.log('Validated '+shops.length+' official sources. Timestamps were not changed; no external collection or automatic publication performed.');
