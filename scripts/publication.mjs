import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

export async function publicationCatalog(){
 const scope={};
 vm.runInNewContext(await readFile(new URL('../assets/js/core-ui.js',import.meta.url),'utf8'),scope);
 const groups=scope.SimuLab.SITE_MENU;
 return {groups,tools:groups.flatMap(g=>g.items),ids:new Set(groups.flatMap(g=>g.items.map(t=>t.tool)))};
}
