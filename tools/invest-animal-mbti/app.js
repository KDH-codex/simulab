import {QUESTIONS,calculate} from './logic.js';
import {boot,details,escape} from '../../assets/js/reference-ui.js';
document.getElementById('questions').innerHTML=QUESTIONS.map((q,i)=>'<fieldset><legend>'+(i+1)+'. '+escape(q[0])+'</legend><label class="ref-choice"><input type="radio" name="q'+i+'" value="1" required>'+escape(q[1])+'</label><label class="ref-choice"><input type="radio" name="q'+i+'" value="0" required>'+escape(q[2])+'</label></fieldset>').join('');
boot(f=>({answers:QUESTIONS.map((_,i)=>Number(f.elements.namedItem('q'+i).value))}),calculate,(r,el)=>{
 el.innerHTML='<h2>놀이 결과: '+escape(r.profile.name)+'</h2>'+details([['테마',r.profile.theme],['왼쪽 응답 수',r.exploration+' / '+r.total]])+'<p>'+escape(r.profile.text)+'</p><p class="ref-note">임의 규칙에 따른 오락용 테마이며 투자 적합성이나 성격의 진단 결과가 아닙니다.</p>';
},{deferInitial:true});
