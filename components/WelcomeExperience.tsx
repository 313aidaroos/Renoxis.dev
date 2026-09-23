'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import CixyAvatar, { type Mood } from './CixyAvatar';
import { LoginForm } from './LoginForm';
import { paintedSignatureLook } from '@/lib/renoxis/customization';
import { orderedTour } from '@/lib/renoxis/tour';
import './command-desk.css';
import './welcome.css';

type Screen = 'welcome' | 'questions' | 'tour' | 'finish';
const roles = ['Real estate agent','Real estate developer','Brokerage','Just exploring'];
const focuses = [{label:'People & follow-ups', value:'Leads'}, {label:'Properties & deals', value:'Properties'}, {label:'My day & appointments', value:'Calendar'}];
export default function WelcomeExperience({ startInTour = false, destination = '/dashboard', signedIn = false }: { startInTour?: boolean; destination?: string; signedIn?: boolean }) {
  const [screen, setScreen] = useState<Screen>(startInTour ? 'questions' : 'welcome');
  const [role, setRole] = useState('');
  const [focus, setFocus] = useState('Leads');
  const [team, setTeam] = useState('On my own');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [visited, setVisited] = useState<string[]>([]);
  const [motion, setMotion] = useState(true);
  const [sampleStage, setSampleStage] = useState('New');
  const [sampleDone, setSampleDone] = useState(false);
  const [sampleQuery, setSampleQuery] = useState('');
  const [sampleInput, setSampleInput] = useState('Call Taylor after the showing');
  const [sampleTask, setSampleTask] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const stops = orderedTour(focus);
  const stop = stops[index];
  const answer = answers[stop.id];
  const mood: Mood = screen === 'tour' && stop.id === 'studio' && answer === 1 ? 'Coffee' : 'Wave';
  const next = destination.includes('?') ? destination : '/dashboard?board=' + encodeURIComponent(focus);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    heading.current?.focus();
  }, [screen, index]);
  function begin() { setScreen('questions'); }
  function mark() { setVisited(prev => prev.includes(stop.id) ? prev : [...prev, stop.id]); }
  function advance() { mark(); if (index === stops.length - 1) setScreen('finish'); else setIndex(index + 1); }
  function restart() { setSampleStage('New'); setSampleDone(false); setSampleQuery(''); setSampleTask(''); setSampleInput('Call Taylor after the showing'); setAnswers({}); setVisited([]); setIndex(0); setRole(''); setFocus('Leads'); setTeam('On my own'); begin(); }
  function choose(choice: number) {
    setAnswers(prev => ({...prev, [stop.id]: choice}));
    if (stop.id === 'tasks') setSampleDone(choice === 0);
    if (stop.id === 'leads' && choice === 0) setSampleStage('Contacted');
    if (stop.id === 'search') setSampleQuery(choice === 0 ? 'Cedar' : 'Taylor');
    if (stop.id === 'add' && choice === 0) setSampleTask(sampleInput.trim() || 'Call Taylor after the showing');
    mark();
  }
  function signIn() { dialog.current?.showModal(); }
  const avatar = <CixyAvatar look={{...paintedSignatureLook, motion}} mood={mood} />;
  return <div className="renoxis welcome-shell">
    <a className="skip-link" href="#welcome-main">Skip to content</a>
    <header className="welcome-header">
      <Link href="/" className="welcome-brand" aria-label="Renoxis home"><span className="welcome-monogram">R</span><span>RENOXIS<small>AN APIXIS COMPANY</small></span></Link>
      <nav aria-label="Welcome navigation">
        <Link href="/tour">Explore with Cixy</Link>
        <button className="text-button" onClick={() => setMotion(!motion)} aria-pressed={!motion}>{motion ? 'Pause Cixy motion' : 'Enable Cixy motion'}</button>
        {signedIn ? <Link className="primary welcome-dashboard-link" href={destination}>Open dashboard ↗</Link> : <button className="primary" onClick={signIn}>Sign in <span aria-hidden="true">↗</span></button>}
      </nav>
    </header>
    <main id="welcome-main" className="welcome-main">
      {screen === 'welcome' && <>
        <section className="welcome-hero">
          <div className="welcome-intro">
            <span className="welcome-kicker"><i /> YOUR NEXT CHAPTER IN REAL ESTATE</span>
            <h1 ref={heading} tabIndex={-1}>A place for your people.<br /><em>A plan for what’s next.</em></h1>
            <p>Meet Renoxis. Built for real estate agents, real estate developers and brokerages: your contacts, properties, deals and day in one workspace—with Cixy beside you.</p>
            <div className="welcome-actions"><button className="primary" onClick={begin}>Take a tour with Cixy <span aria-hidden="true">→</span></button><a href="#how-it-works">How it works ↓</a></div>
            <p className="welcome-small">Interactive. At your pace. No account needed to explore.</p>
            <div className="welcome-proof"><span>People & relationships</span><span>Properties & progress</span><span>Your personal desk</span></div>
          </div>
          <div className="welcome-office">
            <div className="welcome-office-title"><span><i /> MEET YOUR GUIDE</span><span>Cixy · Renoxis</span></div>
            {avatar}
            <div className="welcome-speech"><span>CIXY</span><p>“Hi, I’m Cixy. Tell me a little about your work, and I’ll show you around. We’ll try a few things together.”</p><button className="text-button" onClick={begin}>Let’s meet →</button></div>
          </div>
        </section>
        <section className="welcome-how" id="how-it-works" aria-labelledby="how-title">
          <div><span className="welcome-kicker">A LITTLE STRUCTURE. MORE POSSIBILITY.</span><h2 id="how-title">From your first contact<br />to your next chapter.</h2></div>
          {[['01','Bring your work together','Keep contacts, property details, appointments and documents in one place.'],['02','Make your next move','Track conversations, plan follow-ups and see where each deal stands.'],['03','Work alongside Cixy','Get help thinking through next steps and preparing drafts you can review.']].map(([n,title,copy]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{copy}</p></article>)}
        </section>
        <section className="welcome-invitation"><div><span className="welcome-kicker">EVERY BOX, EXPLAINED</span><h2>You don’t have to figure it out alone.</h2><p>Cixy walks through the whole desk, asks what matters to you, and lets you practice with sample records.</p></div><button className="primary" onClick={begin}>Show me around →</button></section>
      </>}
      {screen === 'questions' && <section className="tour-setup">
        <aside className="tour-guide"><div className="tour-portrait">{avatar}</div><span className="welcome-kicker">CIXY · YOUR PERSONAL GUIDE</span><h2>A little about you.</h2><p>I’ll start with what matters to you, then explain every box. You can jump around, go back, or leave whenever you like.</p><span className="tour-note">Guided demo · no account or payment required</span></aside>
        <div className="tour-questions"><span className="welcome-kicker">LET’S MAKE THIS YOURS</span><h1 ref={heading} tabIndex={-1}>What brings you to Renoxis?</h1>
          <fieldset><legend>Which best describes your work?</legend><div className="tour-options">{roles.map(r => <button key={r} aria-pressed={role === r} onClick={() => setRole(r)}>{r}</button>)}</div></fieldset>
          <fieldset><legend>What would you like help with first?</legend><div className="tour-options">{focuses.map(f => <button key={f.value} aria-pressed={focus === f.value} onClick={() => setFocus(f.value)}>{f.label}</button>)}</div></fieldset>
          <fieldset><legend>Are you working independently or with a team?</legend><div className="tour-options">{['On my own','With a team'].map(t => <button key={t} aria-pressed={team === t} onClick={() => setTeam(t)}>{t}</button>)}</div></fieldset>
          <p className="tour-note">Your answers shape this tour. No sample data is saved to a customer account.</p>
          <div className="welcome-actions"><button className="primary" onClick={() => {setIndex(0);setScreen('tour');}}>Let Cixy show me →</button><button className="text-button" onClick={() => setScreen('welcome')}>Back to welcome</button></div>
        </div>
      </section>}
      {screen === 'tour' && <>
        <div className="tour-heading"><div><span className="welcome-kicker">YOUR GUIDED WALKTHROUGH</span><h1>Make yourself at home.</h1></div><div><span>{visited.length} of {stops.length} boxes explored</span><progress aria-label="Tour progress" max={stops.length} value={visited.length}/></div></div>
        <div className="tour-layout">
          <aside className="tour-index"><h2>Inside your desk</h2><p>Choose any box. I’ll explain it.</p><nav aria-label="Tour boxes">{stops.map((s,i) => <button key={s.id} aria-current={index === i ? 'step' : undefined} onClick={() => setIndex(i)}><span>{visited.includes(s.id) ? '✓' : String(i+1).padStart(2,'0')}</span>{s.title}</button>)}</nav></aside>
          <section className="tour-stage" aria-label="Interactive sample workspace">
            <header><span><i /> RENOXIS / {stop.board}</span><span className="tour-sample-label">SAMPLE WORKSPACE</span></header>
            <div className="tour-box"><span className="welcome-kicker">{stop.group}</span><h2 ref={heading} tabIndex={-1}>{stop.title}</h2><p className="tour-example">{stop.example}</p>
              {(stop.id === 'leads' || stop.id === 'pipeline') && <div className="tour-demo"><strong>Taylor Morgan</strong><label>Sample lead stage<select value={sampleStage} onChange={e => {setSampleStage(e.target.value);mark();}}>{['New','Contacted','Showing','Offer','Under contract','Closed'].map(stage => <option key={stage}>{stage}</option>)}</select></label><p role="status">Taylor is in {sampleStage}.</p></div>}
              {stop.id === 'tasks' && <div className="tour-demo"><label className="tour-task-check"><input type="checkbox" checked={sampleDone} onChange={e => {setSampleDone(e.target.checked);setAnswers(prev => ({...prev,tasks:e.target.checked ? 0 : 1}));mark();}}/> Follow up after the property visit</label><p role="status">{sampleDone ? 'Completed · 0 open sample tasks' : 'To do · 1 open sample task'}</p></div>}
              {stop.id === 'search' && <div className="tour-demo"><label>Search sample records<input type="search" value={sampleQuery} placeholder="Try Cedar or Taylor" onChange={e => {setSampleQuery(e.target.value);mark();}}/></label><ul aria-live="polite">{['Cedar House · Property','Taylor Morgan · Lead'].filter(item => item.toLowerCase().includes(sampleQuery.toLowerCase())).map(item => <li key={item}>{item}</li>)}{!['Cedar House','Taylor Morgan'].some(item => item.toLowerCase().includes(sampleQuery.toLowerCase())) && <li>No matching sample records. Try Cedar or Taylor.</li>}</ul></div>}
              {stop.id === 'add' && <form className="tour-demo" onSubmit={e => {e.preventDefault(); if (sampleInput.trim()) choose(0);}}><label>Sample task name<input required maxLength={120} value={sampleInput} onChange={e => setSampleInput(e.target.value)} /></label><button type="submit" disabled={!sampleInput.trim()}>Save sample task</button>{sampleTask && <p role="status">✓ Added: {sampleTask}</p>}</form>}
              <div className="tour-preview-result" aria-live="polite">{answer === undefined ? <span>Choose an answer below to explore this box with Cixy.</span> : <><span className="tour-check">✓</span><strong>{stop.choices[answer]}</strong><p>{stop.replies[answer]}</p></>}</div>
              <span className="tour-note">Practice only · no messages sent, no charges, no customer records changed</span>
            </div>
            <div className="tour-conversation"><div className="tour-mini-avatar">{avatar}</div><div><span className="welcome-kicker">CIXY EXPLAINS</span><p>{stop.explanation}</p><h3>{stop.question}</h3><div className="tour-options">{stop.choices.map((choice,i) => <button key={choice} aria-pressed={answer === i} onClick={() => choose(i)}>{choice}</button>)}</div></div></div>
            <footer className="tour-controls"><button disabled={index === 0} onClick={() => setIndex(index-1)}>← Back</button><span>{index+1} / {stops.length}</span><button className="primary" onClick={advance}>{index === stops.length-1 ? 'Finish tour' : 'Next box'} →</button></footer>
          </section>
        </div>
        <div className="tour-exit"><button className="text-button" onClick={restart}>Restart tour</button><button className="text-button" onClick={() => setScreen('finish')}>Skip to getting started →</button></div>
      </>}
      {screen === 'finish' && <section className="tour-setup tour-finish">
        <aside className="tour-guide"><div className="tour-portrait">{avatar}</div><span className="welcome-kicker">CIXY · HERE WHEN YOU NEED ME</span><h2>Your next chapter is yours.</h2><p>We’ll begin with {focus === 'Leads' ? 'people and follow-ups' : focus === 'Properties' ? 'properties and deals' : 'your day and appointments'}. Your own workspace starts with your real records.</p></aside>
        <div className="tour-questions"><span className="welcome-kicker">FROM EXPLORING TO DOING</span><h1 ref={heading} tabIndex={-1}>Ready to make it yours?</h1><p>You explored {visited.length} of {stops.length} boxes. You can come back for the rest whenever you like.</p><div className="tour-summary"><span>{role || 'Exploring real estate'}</span><span>{team}</span><span>{focuses.find(f => f.value === focus)?.label}</span></div><h2>A clear start.</h2><p>Create or sign in to your account, then activate access through Apixis Wallet. Your tour choices open the board you want to focus on; sample records stay here.</p><div className="tour-price"><div><span>One-time activation</span><strong>$50 <small>· 5,000 Ixis</small></strong></div><div><span>Monthly seat</span><strong>$50/month <small>· 5,000 Ixis</small></strong></div><p>Activation and the first month are separate: $100 / 10,000 Ixis to begin. Some office draft actions cost additional Ixis. Signing in does not charge you.</p></div><div className="welcome-actions"><button className="primary" onClick={signIn}>Create your workspace →</button><button onClick={() => setScreen('tour')}>Keep exploring</button></div><p className="tour-note">Have an account? <Link href={next}>Open your dashboard →</Link> · <Link href="/pricing">Full pricing</Link></p></div>
      </section>}
    </main>
    <footer className="welcome-footer"><span>RENOXIS <b>·</b> People. Properties. A brighter tomorrow.</span><div><Link href="/pricing">Pricing</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/tour">Tour with Cixy</Link><button className="text-button" onClick={() => setMotion(!motion)} aria-pressed={!motion}>{motion ? "Pause motion" : "Enable motion"}</button></div></footer>
    <dialog className="welcome-login" ref={dialog} aria-labelledby="welcome-login-title"><button className="welcome-close" onClick={() => dialog.current?.close()} aria-label="Close sign in">×</button><span className="welcome-kicker">YOUR RENOXIS WORKSPACE</span><h2 id="welcome-login-title">Welcome. Let’s get you settled.</h2><p>We’ll email you a secure sign-in link. New here? The same link starts your account.</p><LoginForm next={next}/><p className="tour-note">Signing in is free. Workspace access requires activation and a monthly seat.</p></dialog>
  </div>;
}
