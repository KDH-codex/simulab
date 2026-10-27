import {number} from '../../assets/js/date-only.js';
export function calculate({total=100000,people=3}={}){number(total,0,1e12,true);number(people,1,1000,true);return {total,people,base:Math.floor(total/people),extra:total%people};}
