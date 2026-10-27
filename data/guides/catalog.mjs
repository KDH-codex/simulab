import {workGuides} from './work.mjs';
import {familySupportGuides} from './family.mjs';
import {lifeGuides} from './life.mjs';
export const editorialGuides=[...familySupportGuides,...workGuides,...lifeGuides];
export const GUIDE_DATE='2026-10-27';
export const guidePillars=[
 {id:'family',title:'가족·육아 지원',description:'출생·휴직·복직의 신청 시기와 준비 서류를 확인합니다.',analytics:'family-info-calendar'},
 {id:'work',title:'월급·퇴직',description:'명세서·실수령액·퇴직·연말정산을 숫자 사례로 살펴봅니다.',analytics:'pay-work-guide'},
 {id:'life',title:'생활비·나들이',description:'예약 오픈과 체험 접수일, 실제 지출의 비교 기준을 정리합니다.',analytics:'living-cost-guide'}
];
