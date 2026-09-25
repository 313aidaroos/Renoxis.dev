import { Client } from 'pg';
import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
// This runner is intentionally unable to connect to a production host.
const host=process.env.PGHOST || '127.0.0.1';
if (!['localhost','127.0.0.1','::1'].includes(host) || process.env.DATABASE_URL || process.env.PGSERVICE) throw new Error('Seat tests require isolated local PostgreSQL; production URLs are forbidden.');
const config={host,port:Number(process.env.PGPORT||5432),user:process.env.PGUSER||'postgres',password:process.env.PGPASSWORD||'postgres'};
const root=new Client({...config,database:'postgres'}); await root.connect();
const name='renoxis_seat_test_'+process.pid;
await root.query(`create database ${name}`);
const db=new Client({...config,database:name}); await db.connect();
try {
 await db.query(`do $$ begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if; if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if; if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role bypassrls; end if; end $$;
 create schema auth; create table auth.users(id uuid primary key);
 create table public.renoxis_records(user_id uuid,kind text,data jsonb);`);
 await db.query(await readFile(new URL('../supabase/entitlements_protected.sql',import.meta.url),'utf8'));
 for(const file of (await readdir(new URL('../supabase/migrations/',import.meta.url))).sort()) if(file.endsWith('_seat_payment_attempts.sql')) await db.query(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
 const user='12345678-1111-4111-8111-111111111111';
 await db.query('insert into auth.users values($1)',[user]);
 const stage=async(intent,id,res,client=db)=>(await client.query('select renoxis_stage_seat($1,$2,$3,$4) as r',[user,intent,id,res])).rows[0].r;
 const settle=async(intent,id,res,captured,receipt=null)=>(await db.query('select renoxis_settle_seat($1,$2,$3,$4,$5,$6) as r',[user,intent,id,res,captured,receipt])).rows[0].r;
 const seat=async()=>(await db.query('select * from renoxis_entitlements where user_id=$1',[user])).rows[0];
 const activation=await stage('activate','activate1','hold-activation');
 assert.equal((await seat()).activated_at,null,'staged activation grants no access');
 await settle('activate','activate1','hold-activation',false);
 assert.equal((await seat()).activated_at,null,'release grants no access');
 await stage('activate','activate2','hold-activation2');
 await settle('activate','activate2','hold-activation2',true,'receipt-activate');
 assert.ok((await seat()).activated_at);
 assert.equal((await stage('activate','activate3','hold-activation3')).error,'ALREADY_ACTIVATED');
 const month=await stage('monthly','monthly01','hold-month1');
 assert.equal((await seat()).seat_period_end,null,'pending monthly grants no paid days');
 assert.deepEqual(await stage('monthly','monthly01','hold-month1'),month,'same attempt resumes the same dates');
 await settle('monthly','monthly01','hold-month1',true,'receipt-month1');
 const first=(await seat()).seat_period_end.getTime();
 await stage('monthly','monthly01','hold-month1');
 await settle('monthly','monthly01','hold-month1',true,'receipt-month1');
 assert.equal((await seat()).seat_period_end.getTime(),first,'replaying paid attempt never extends twice');
 // Real independent database connections race to stage a renewal.
 const racers=await Promise.all(Array.from({length:12},async()=>{const c=new Client({...config,database:name});await c.connect();return c}));
 let race;
 try {race=await Promise.all(racers.map((c,i)=>stage('monthly','race-key-'+i,'race-hold-'+i,c)));} finally {await Promise.all(racers.map(c=>c.end()));}
 const winners=race.map((r,i)=>r.status==='pending'?i:-1).filter(i=>i>=0);
 assert.equal(winners.length,1,'only one concurrent different attempt stages');
 const winner=winners[0];
 await settle('monthly','race-key-'+winner,'race-hold-'+winner,false);
 assert.equal((await seat()).seat_period_end.getTime(),first,'failed renewal preserves paid month');
 await stage('monthly','monthly02','hold-month2');
 await settle('monthly','monthly02','hold-month2',true,'receipt-month2');
 assert.equal((await seat()).seat_period_end.getTime(),first+30*86400000,'renewal adds exactly 30 days');
 // Delayed release of an earlier failed or completed attempt cannot clobber the new seat.
 await settle('monthly','race-key-'+winner,'race-hold-'+winner,false);
 await settle('monthly','monthly01','hold-month1',false);
 assert.equal((await seat()).seat_period_end.getTime(),first+30*86400000);
 assert.equal((await seat()).last_receipt_id,'receipt-month2');
 await assert.rejects(settle('monthly','monthly02','wrong-hold',false),/Unknown seat attempt/);
 const privileges=(await db.query(`select has_table_privilege('authenticated','renoxis_seat_attempts','INSERT') as customer_write,has_function_privilege('anon','renoxis_stage_seat(uuid,text,text,text)','EXECUTE') as anon_rpc,has_function_privilege('authenticated','renoxis_settle_seat(uuid,text,text,text,boolean,text)','EXECUTE') as customer_rpc`)).rows[0];
 assert.deepEqual(privileges,{customer_write:false,anon_rpc:false,customer_rpc:false});
 assert.ok(activation.activatedAt);
 // Exercise the actual shared SDK and purchase orchestration with this real database.
 // Wallet HTTP is simulated; this is not a Stripe checkout rehearsal.
 process.env.WALLET_API_KEY='isolated-test-key-not-a-secret';
 process.env.APIXIS_WALLET_API_URL='https://wallet.test';
 const {purchaseSeat}=await import('../lib/renoxis/seat-purchase.ts');
 const originalFetch=globalThis.fetch;
 const holds=new Map(); let mode='normal'; let captures=0; let failCommit=false;
 const store={
  stage:async i=>{const r=await stage(i.intent,i.attemptId,i.reservationId);if(r.error)throw new Error(r.error);return r;},
  settle:async i=>{if(i.captured&&failCommit){failCommit=false;throw new Error('local commit unavailable');}await settle(i.intent,i.attemptId,i.reservationId,i.captured,i.receiptId);},
 };
 globalThis.fetch=async (url,init)=>{
  const path=new URL(url).pathname;
  const json=(status,data)=>new Response(JSON.stringify(data),{status});
  if(path.endsWith('/quotes'))return json(200,{xp:5000});
  if(path.endsWith('/reservations')){
   if(mode==='insufficient')return json(402,{error:'insufficient_balance'});
   const key=JSON.parse(init.body).idempotencyKey;
   if(!holds.has(key))holds.set(key,{id:'sdk-'+holds.size,status:'held'});
   return json(201,{reservationId:holds.get(key).id,ixis:5000,status:'held'});
  }
  const hold=[...holds.values()].find(h=>path.includes('/'+h.id));
  assert.ok(hold);
  if(path.endsWith('/capture')){
   if(mode==='offline')throw new Error('network unavailable');
   if(hold.status==='released')return json(409,{code:'already_released'});
   if(hold.status!=='captured'){hold.status='captured';captures++;}
   if(mode==='lost')throw new Error('capture response lost');
   return json(200,{receiptId:'receipt-'+hold.id});
  }
  if(path.endsWith('/release')){
   if(mode==='offline')throw new Error('network unavailable');
   if(hold.status==='captured')return json(409,{code:'already_captured'});
   hold.status='released';return json(200,{released:true});
  }
  return json(200,{status:hold.status,receiptId:hold.status==='captured'?'receipt-'+hold.id:null});
 };
 const run=id=>purchaseSeat({userId:user,owner:'test@example.com',intent:'monthly',attemptId:id},store);
 try{
  const before=(await seat()).seat_period_end.getTime();
  mode='insufficient';assert.equal((await run('sdk-short')).ok,false);assert.equal((await seat()).seat_period_end.getTime(),before);
  mode='lost';assert.equal((await run('sdk-lost1')).ok,true);assert.equal(captures,1);
  assert.equal((await seat()).seat_period_end.getTime(),before+30*86400000);
  mode='normal';await run('sdk-lost1');assert.equal(captures,1);assert.equal((await seat()).seat_period_end.getTime(),before+30*86400000);
  failCommit=true;await assert.rejects(run('sdk-commit'),/local commit unavailable/);assert.equal(captures,2);
  await run('sdk-commit');assert.equal(captures,2);assert.equal((await seat()).seat_period_end.getTime(),before+60*86400000);
  mode='offline';await assert.rejects(run('sdk-offline'),/network unavailable/);assert.equal((await seat()).seat_period_end.getTime(),before+60*86400000);
  mode='normal';await run('sdk-offline');assert.equal(captures,3);assert.equal((await seat()).seat_period_end.getTime(),before+90*86400000);
 }finally{globalThis.fetch=originalFetch;}
 console.log('PASS: SQL staging, release, activation, first month, 12-way race, renewal, late rollback, privileges; SDK insufficient funds, lost capture response, duplicate retry, failed local commit and unknown-payment recovery');
} finally {await db.end();await root.query(`drop database ${name} with (force)`);await root.end();}
