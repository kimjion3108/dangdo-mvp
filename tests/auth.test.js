import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {createApp} from '../server/index.js';
async function run(callback,{profile={id:12345,kakao_account:{profile:{nickname:'지온',profile_image_url:'https://example.com/avatar.png'}}},configured=true}={}){
 const db=new DatabaseSync(':memory:');let calls=0;
 const env={FRONTEND_URL:'https://kimjion3108.github.io/dangdo-mvp/',...(configured?{KAKAO_REST_API_KEY:'test-key',KAKAO_CLIENT_SECRET:'test-secret',KAKAO_REDIRECT_URI:'https://api.example.com/api/auth/callback'}:{})};
 const fetcher=async(url,options)=>{calls++;if(url.includes('/oauth/token')){assert.equal(options.body.get('client_secret'),'test-secret');return Response.json({access_token:'provider-token'});}assert.equal(options.headers.Authorization,'Bearer provider-token');return Response.json(profile);};
 const server=http.createServer(createApp({env,db,fetcher}));await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 try{await callback({base,db,getCalls:()=>calls});}finally{await new Promise(r=>server.close(r));db.close();}
}
const origin='https://kimjion3108.github.io';
async function authorize(base){const r=await fetch(base+'/api/auth/start',{redirect:'manual'});assert.equal(r.status,302);const u=new URL(r.headers.get('location')),cookie=r.headers.get('set-cookie').split(';')[0];assert.equal(u.searchParams.get('scope'),null);return {state:u.searchParams.get('state'),cookie};}
test('로그인은 프로필 선택 동의와 1회용 교환, 세션 조회, 로그아웃으로 연결된다',()=>run(async({base})=>{
 const a=await authorize(base);const callback=await fetch(base+'/api/auth/callback?'+new URLSearchParams({state:a.state,code:'test-code'}),{headers:{Cookie:a.cookie},redirect:'manual'});assert.equal(callback.status,302);const redirect=new URL(callback.headers.get('location'));assert.equal(redirect.origin,origin);const ticket=new URLSearchParams(redirect.hash.slice(1)).get('authTicket');assert.ok(ticket);
 const exchange=await fetch(base+'/api/auth/exchange',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({ticket})});const data=await exchange.json();assert.equal(exchange.status,200);assert.equal(data.user.nickname,'지온');assert.equal(data.user.picture,'https://example.com/avatar.png');assert.equal(JSON.stringify(data).includes('provider-token'),false);
 assert.equal((await fetch(base+'/api/auth/exchange',{method:'POST',body:JSON.stringify({ticket})})).status,401);
 const headers={Authorization:`Bearer ${data.session}`,Origin:origin};assert.equal((await fetch(base+'/api/me',{headers})).status,200);assert.equal((await fetch(base+'/api/auth/logout',{method:'POST',headers})).status,200);assert.equal((await fetch(base+'/api/me',{headers})).status,401);
}));
test('프로필 미동의에도 로그인이 가능하고 기본 닉네임을 쓴다',()=>run(async({base})=>{const a=await authorize(base);const r=await fetch(base+'/api/auth/callback?'+new URLSearchParams({state:a.state,code:'x'}),{headers:{Cookie:a.cookie},redirect:'manual'});const ticket=new URLSearchParams(new URL(r.headers.get('location')).hash.slice(1)).get('authTicket');const result=await (await fetch(base+'/api/auth/exchange',{method:'POST',body:JSON.stringify({ticket})})).json();assert.equal(result.user.nickname,'당도 사용자');assert.equal(result.user.picture,null);},{profile:{id:123}}));
test('위조한 state, 외부 Origin, 만료된 요청은 인증을 통과하지 못한다',()=>run(async({base,db,getCalls})=>{const a=await authorize(base);let r=await fetch(base+'/api/auth/callback?state=forged&code=x',{headers:{Cookie:a.cookie},redirect:'manual'});assert.ok(r.headers.get('location').includes('authError=state'));assert.equal(getCalls(),0);db.exec('UPDATE oauth SET expires=0');r=await fetch(base+'/api/auth/callback?'+new URLSearchParams({state:a.state,code:'x'}),{headers:{Cookie:a.cookie},redirect:'manual'});assert.ok(r.headers.get('location').includes('authError=state'));assert.equal((await fetch(base+'/api/config',{headers:{Origin:'https://attacker.example'}})).status,403);}));
test('서버 키가 없으면 로그인 준비 완료라고 표시하지 않는다',()=>run(async({base})=>{assert.equal((await (await fetch(base+'/api/config')).json()).login,false);assert.equal((await fetch(base+'/api/auth/start')).status,503);},{configured:false}));
