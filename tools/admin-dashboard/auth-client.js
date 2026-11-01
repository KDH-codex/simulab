// Authentication is checked by Supabase. The RPC also enforces an admin UID allowlist.
export function createAdminClient({getConfig,storage,fetchFn=fetch,now=()=>Date.now()}) {
  const key='simulab_admin_auth_v2'; let session=null;
  try {const saved=JSON.parse(storage.getItem(key));if(saved?.accessToken&&saved.expiresAt>now())session=saved;}catch{}
  function clear(){session=null;try{storage.removeItem(key);storage.removeItem('simulab_admin_session');}catch{}}
  function config(){const cfg=getConfig();if(!cfg?.url||!cfg?.anonKey)throw new Error('Supabase 연결 설정을 확인해 주세요.');return cfg;}
  async function request(path,body,token,method='POST') {
    const cfg=config(),headers={apikey:cfg.anonKey,'Content-Type':'application/json'};
    if(token)headers.Authorization='Bearer '+token;
    const response=await fetchFn(cfg.url+path,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})});
    if(!response.ok){if(response.status===401)clear();const error=new Error(response.status===401?'이메일·비밀번호 또는 로그인 유효기간을 확인해 주세요.':response.status===403?'관리자 권한을 확인할 수 없습니다. 운영 설정을 확인해 주세요.':'서버 응답을 확인할 수 없습니다. 연결과 보안 설정을 확인해 주세요.');error.status=response.status;throw error;}
    return response.status===204?null:response.json();
  }
  async function summary(days=7){
    if(!session||session.expiresAt<=now()){clear();throw new Error('로그인이 필요합니다.');}
    const data=await request('/rest/v1/rpc/get_admin_dashboard_summary',{days_count:Math.min(90,Math.max(1,Math.trunc(Number(days)||7)))},session.accessToken);
    if(data?.securityVersion!==2)throw new Error('관리자 보안 설정 적용이 필요합니다. 운영 안내의 SQL 적용 상태를 확인해 주세요.');
    return data;
  }
  return {
    async signIn(email,password){
      clear();
      const result=await request('/auth/v1/token?grant_type=password',{email:String(email).trim(),password:String(password)});
      if(!result?.access_token||!result?.expires_in||!result?.user?.id)throw new Error('로그인 응답을 확인할 수 없습니다.');
      session={accessToken:result.access_token,expiresAt:now()+Number(result.expires_in)*1000-30000};
      try {const data=await summary();storage.setItem(key,JSON.stringify(session));return data;}catch(error){clear();throw error;}
    },
    async restore(){if(!session)return null;try{await request('/auth/v1/user',undefined,session.accessToken,'GET');return await summary();}catch(error){clear();throw error;}},
    summary,
    async signOut(){const token=session?.accessToken;clear();if(token)try{await request('/auth/v1/logout',{},token);}catch{}},
    clear
  };
}
