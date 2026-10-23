import {calculate} from './logic.js';
import {boot,value,details} from '../../assets/js/reference-ui.js';
boot(f=>({sex:f.elements.sex.value,age:value(f,'age'),heightCm:value(f,'heightCm'),weightKg:value(f,'weightKg'),activity:f.elements.activity.value}),calculate,(r,el)=>{
 el.innerHTML='<h2>하루 에너지 소비 참고치</h2>'+details([['휴식 에너지 소비 (REE)',Math.round(r.restingEnergy).toLocaleString('ko-KR')+' kcal/일'],['활동계수 가정',r.activityFactor],['총 에너지 소비 가정 (TDEE)',Math.round(r.totalEnergy).toLocaleString('ko-KR')+' kcal/일']])+'<p class="ref-note">개인 측정값이나 권장 섭취량이 아닙니다. 체중·체지방·근육량의 변화를 보장하지 않습니다.</p>';
});
