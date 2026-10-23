import {calculate} from './logic.js';
import {boot,value,details} from '../../assets/js/reference-ui.js';
boot(f=>({doseMg:value(f,'doseMg'),intakeTime:f.elements.intakeTime.value,checkTime:f.elements.checkTime.value,dayOffset:value(f,'dayOffset'),halfLife:value(f,'halfLife')}),calculate,(r,el)=>{
 el.innerHTML='<h2>입력 가정에 따른 잔여량</h2>'+details([['섭취 후 경과',r.elapsedHours.toFixed(2)+'시간'],['가정한 반감기',r.halfLife+'시간'],['추정 잔여량',r.remainingMg.toFixed(1)+'mg'],['처음 양 대비',r.remainingPct.toFixed(1)+'%']])+'<p class="ref-note">신체 측정값이 아닙니다. 잔여량의 크기로 안전 여부나 수면의 질을 판정할 수 없습니다.</p>';
});
