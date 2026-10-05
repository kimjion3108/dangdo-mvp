import http from 'node:http';
import {bicycleService} from './bicycle.js';
import {randomBytes,createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mobilityData,cityAreaForPoint} from './mobility.js';
const hash=v=>createHash('sha256').update(v).digest('hex');
const token=()=>randomBytes(32).toString('base64url');
export function createApp({env=process.env,fetcher=fetch,db=new DatabaseSync(env.DATABASE_PATH||'dangdo.sqlite')}={}){
 const frontend=env.FRONTEND_URL||'http://localhost:5173/',origin=new URL(frontend).origin;
 const callback=env.KAKAO_REDIRECT_URI,ready=!!(env.KAKAO_REST_API_KEY&&env.KAKAO_CLIENT_SECRET&&callback);
 db.exec('CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY,user TEXT NOT NULL,expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS oauth (state TEXT PRIMARY KEY,expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS tickets (hash TEXT PRIMARY KEY,user TEXT NOT NULL,expires INTEGER NOT NULL)');
 const bicycle=bicycleService({env,fetcher});
 const cache=new Map();let cityAreas=[];try{cityAreas=JSON.parse(env.SEOUL_CITY_AREAS_JSON||'[]');if(!Array.isArray(cityAreas))cityAreas=[];}catch{}
 const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 const redirect=(res,url)=>{res.writeHead(302,{Location:url,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});res.end();};
 const returnTo=(res,error)=>{const u=new URL(frontend);u.hash=new URLSearchParams({authError:error}).toString();redirect(res,u.href);};
 const json=async req=>{let s='';for await(const chunk of req){s+=chunk;if(s.length>4096)throw new Error('body too large');}return JSON.parse(s||'{}');};
 return async(req,res)=>{try{
  const u=new URL(req.url,'http://localhost'),now=Date.now();
  db.prepare('DELETE FROM oauth WHERE expires < ?').run(now);db.prepare('DELETE FROM tickets WHERE expires < ?').run(now);db.prepare('DELETE FROM sessions WHERE expires < ?').run(now);
  if(req.headers.origin&&req.headers.origin!==origin)return send(res,403,{error:'허용되지 않은 요청입니다.'});
  if(req.headers.origin===origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');}
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
  if(['/api/routing/bicycle','/api/orbit/hotspots'].includes(u.pathname)){if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});try{return send(res,200,await (u.pathname.endsWith('bicycle')?bicycle.route(u.searchParams):bicycle.hotspots(u.searchParams)));}catch(e){return send(res,e.status||503,{error:e.status?e.message:'경로 데이터를 처리하지 못했어요.'});}}
  if(u.pathname==='/api/config')return send(res,200,{login:ready,subway:!!env.SEOUL_SUBWAY_KEY,crowd:!!env.SEOUL_CITY_KEY});
  if(u.pathname==='/api/auth/start'&&req.method==='GET'){
   if(!ready)return send(res,503,{error:'로그인 서버 설정이 아직 완료되지 않았어요.'});
   const state=token();db.prepare('INSERT INTO oauth VALUES (?,?)').run(hash(state),now+600000);
   res.setHeader('Set-Cookie',`dangdo_oauth=${state}; HttpOnly; Path=/api/auth; SameSite=Lax; Max-Age=600${env.NODE_ENV==='production'?'; Secure':''}`);
   const target=new URL('https://kauth.kakao.com/oauth/authorize');target.search=new URLSearchParams({client_id:env.KAKAO_REST_API_KEY,redirect_uri:callback,response_type:'code',state}).toString();return redirect(res,target.href);
  }
  if(u.pathname==='/api/auth/callback'&&req.method==='GET'){
   const state=u.searchParams.get('state'),cookie=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('dangdo_oauth='))?.slice(13);
   if(!ready||!state||cookie!==state)return returnTo(res,'state');
   const pending=db.prepare('DELETE FROM oauth WHERE state=? AND expires>=? RETURNING state').get(hash(state),now);if(!pending)return returnTo(res,'state');
   res.setHeader('Set-Cookie',`dangdo_oauth=; HttpOnly; Path=/api/auth; SameSite=Lax; Max-Age=0${env.NODE_ENV==='production'?'; Secure':''}`);
   if(u.searchParams.has('error'))return returnTo(res,'cancelled');const code=u.searchParams.get('code');if(!code)return returnTo(res,'failed');
   try{
    const response=await fetcher('https://kauth.kakao.com/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',client_id:env.KAKAO_REST_API_KEY,client_secret:env.KAKAO_CLIENT_SECRET,redirect_uri:callback,code}),signal:AbortSignal.timeout(10000)});
    const oauth=await response.json();if(!response.ok||!oauth.access_token)throw new Error('token');
    const profileResponse=await fetcher('https://kapi.kakao.com/v2/user/me',{headers:{Authorization:`Bearer ${oauth.access_token}`},signal:AbortSignal.timeout(10000)});const profile=await profileResponse.json();if(!profileResponse.ok||!profile.id)throw new Error('profile');
    const p=profile.kakao_account?.profile||{},picture=p.is_default_image?null:p.profile_image_url;
    const user={id:String(profile.id),nickname:p.nickname||'당도 사용자',picture:typeof picture==='string'&&picture.startsWith('https://')?picture:null};
    const ticket=token();db.prepare('INSERT INTO tickets VALUES (?,?,?)').run(hash(ticket),JSON.stringify(user),now+60000);const target=new URL(frontend);target.hash=new URLSearchParams({authTicket:ticket}).toString();return redirect(res,target.href);
   }catch{return returnTo(res,'failed');}
  }
  if(u.pathname==='/api/auth/exchange'&&req.method==='POST'){
   const {ticket}=await json(req);if(typeof ticket!=='string'||ticket.length>100)return send(res,400,{error:'로그인을 다시 시도해 주세요.'});
   const row=db.prepare('DELETE FROM tickets WHERE hash=? AND expires>=? RETURNING user').get(hash(ticket),now);if(!row)return send(res,401,{error:'로그인 요청이 만료됐어요.'});
   const session=token();db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(hash(session),row.user,now+86400000);return send(res,200,{session,user:JSON.parse(row.user)});
  }
  if(u.pathname==='/api/me'||u.pathname==='/api/auth/logout'){
   const raw=req.headers.authorization?.replace(/^Bearer /,'');const row=raw&&db.prepare('SELECT user FROM sessions WHERE hash=? AND expires>=?').get(hash(raw),now);if(!row)return send(res,401,{error:'다시 로그인해 주세요.'});
   if(u.pathname==='/api/auth/logout'){if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});db.prepare('DELETE FROM sessions WHERE hash=?').run(hash(raw));return send(res,200,{ok:true});}
   if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});return send(res,200,{user:JSON.parse(row.user)});
  }
  if(u.pathname==='/api/mobility'&&req.method==='GET'){
   const station=u.searchParams.get('station')||'',area=cityAreaForPoint(Number(u.searchParams.get('lat')),Number(u.searchParams.get('lng')),cityAreas);if(station.length>80||area.length>80)return send(res,400,{error:'장소를 다시 확인해 주세요.'});
   const key=station+'|'+area,hit=cache.get(key);if(hit&&now-hit.time<30000)return send(res,200,hit.data);
   const data=await mobilityData({station,area},{subwayKey:env.SEOUL_SUBWAY_KEY,cityKey:env.SEOUL_CITY_KEY,fetcher});if(cache.size>100)cache.clear();cache.set(key,{time:now,data});return send(res,200,data);
  }
  if(u.pathname.startsWith('/api/'))return send(res,404,{error:'Not found'});
  if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
  const base=resolve(env.STATIC_DIR||'dist'),path=resolve(base,'.'+decodeURIComponent(u.pathname));if(!path.startsWith(base+'/')&&path!==base)return send(res,403,{error:'Not allowed'});
  const file=u.pathname==='/'?resolve(base,'index.html'):path;try{const bytes=await readFile(file);const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.wasm':'application/wasm','.mjs':'text/javascript','.wav':'audio/wav'}[extname(file)]||'application/octet-stream';res.writeHead(200,{'Content-Type':type});res.end(bytes);}catch{send(res,404,{error:'Not found'});}
 }catch{send(res,500,{error:'요청을 처리하지 못했어요. 다시 시도해 주세요.'});}};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){await mkdir('data',{recursive:true});const server=http.createServer(createApp());server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('DANGDO server ready'));}
