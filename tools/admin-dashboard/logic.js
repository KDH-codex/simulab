import '../../assets/js/supabase-config.js';
import {createAdminClient} from './auth-client.js';
export {calculateKpis,exportToCsv} from './metrics.js';
const client=createAdminClient({getConfig:()=>window.SIMULAB_SUPABASE_CONFIG,storage:sessionStorage});
export const signInAdmin=(email,password)=>client.signIn(email,password);
export const restoreAdminSession=()=>client.restore();
export const getAnalyticsData=days=>client.summary(days);
export const adminLogout=()=>client.signOut();
