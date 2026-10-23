import './logic.js';
import {boot,value,details,escape} from '../../assets/js/reference-ui.js';
const engine=window.SimuLab.SajuTheme;
boot(f=>{const [birthYear,birthMonth,birthDay]=f.elements.birthDate.value.split('-').map(Number);return {birthYear,birthMonth,birthDay,birthHour:value(f,'birthHour')};},engine.calculateSajuTheme,(r,el)=>{
 el.innerHTML='<h2>간이 오행 테마</h2>'+details([['표시 테마',r.dominant.name],['규칙상 글자 비율',r.summary.dominantScore+'%'],['테마 키워드',r.dominant.traits],['색상 테마',r.dominant.colorName]])+'<p>'+escape(r.dominant.themeNarrative)+'</p><h3>테마에 어울리는 일상 활동</h3><p>'+r.dominant.activities.map(escape).join(' · ')+'</p><p class="ref-note">오락용 설명입니다. 실제 성격·운세·투자 적합성의 측정 결과가 아닙니다.</p>';
});
