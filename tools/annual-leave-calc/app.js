import {calculate} from './logic.js';
import {boot,value,money,details} from '../../assets/js/reference-ui.js';
boot(f=>({hireDate:f.elements.namedItem('hireDate').value,asOfDate:f.elements.namedItem('asOfDate').value,usedDays:value(f,'usedDays')}),calculate,(r,el)=>{el.innerHTML='<h2>현재 발생 기간의 연차</h2><p class="ref-value">잔여 '+r.remaining+'일</p>'+details([['발생일수',r.grant+'일'],['완료 근속연수',r.years+'년'],['발생 기간',r.periodStart+' ~ '+r.periodEnd+' 전날']])+'<p>첫해 월별 연차 11일과 다음 해 15일을 합산하지 않습니다. 발생일 이후에도 재직하는 일반적인 경우입니다. 하루 단위 미만 연차는 회사의 사용 기록을 확인하세요.</p>';});
