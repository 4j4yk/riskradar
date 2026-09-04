"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronRight, Clock3, ExternalLink, Filter, Radar, RefreshCw, Search, ShieldAlert, ShieldCheck, Siren } from "lucide-react";

type Priority = "Critical" | "High" | "Elevated";
type Vulnerability = { cve:string; vendor:string; product:string; name:string; description:string; added:string; due:string; ransomware:boolean; action:string; cwes:string[]; riskScore:number; priority:Priority };
type Feed = { catalogVersion:string; count:number; vulnerabilities:Vulnerability[] };
const fmt=(d:string)=>new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(new Date(d+"T00:00:00"));

export default function Home() {
  const [data,setData]=useState<Feed|null>(null), [loading,setLoading]=useState(true), [error,setError]=useState("");
  const [query,setQuery]=useState(""), [priority,setPriority]=useState("All priorities"), [ransomwareOnly,setRansomwareOnly]=useState(false);
  const [selected,setSelected]=useState<Vulnerability|null>(null);
  const load=async()=>{ setLoading(true); setError(""); try { const r=await fetch("/api/kev"); if(!r.ok) throw new Error("The intelligence feed is temporarily unavailable."); const f:Feed=await r.json(); setData(f); setSelected(v=>v??f.vulnerabilities[0]??null); } catch(e){setError(e instanceof Error?e.message:"Unable to load intelligence.");} finally{setLoading(false);} };
  useEffect(()=>{void load()},[]);
  const filtered=useMemo(()=>{const q=query.trim().toLowerCase();return(data?.vulnerabilities??[]).filter(v=>(!q||[v.cve,v.vendor,v.product,v.name].some(x=>x.toLowerCase().includes(q)))&&(priority==="All priorities"||v.priority===priority)&&(!ransomwareOnly||v.ransomware));},[data,query,priority,ransomwareOnly]);
  const today=new Date().toISOString().slice(0,10), all=data?.vulnerabilities??[];

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Radar size={22}/></span>RiskRadar</div>
      <nav className="side-nav"><button className="active"><ShieldAlert/>Exposure queue</button><button disabled><Siren/>Threat signals</button><button disabled><ShieldCheck/>Remediation</button></nav>
      <div className="source-card"><span><i/> Live source</span><strong>CISA KEV</strong><small>Official exploited-vulnerability catalog</small></div>
    </aside>
    <section className="workspace">
      <header className="topbar"><div><p className="kicker">VULNERABILITY OPERATIONS</p><h1>Exposure intelligence</h1><p>Prioritize vulnerabilities attackers are already exploiting.</p></div><button className="refresh-button" onClick={()=>void load()} disabled={loading}><RefreshCw className={loading?"spin":""}/>Refresh feed</button></header>
      <div className="content">
        <div className="status-strip"><ShieldCheck/>Official CISA catalog <span>Version {data?.catalogVersion??"—"}</span><span>{data?data.count.toLocaleString()+" records":"Connecting…"}</span></div>
        <section className="metric-grid">
          <Metric tone="red" icon={<AlertTriangle/>} label="Critical queue" value={all.filter(v=>v.priority==="Critical").length} note="Immediate review"/>
          <Metric tone="amber" icon={<Clock3/>} label="Past due" value={all.filter(v=>v.due<today).length} note="CISA due date passed"/>
          <Metric tone="violet" icon={<Siren/>} label="Ransomware-linked" value={all.filter(v=>v.ransomware).length} note="Known campaign use"/>
          <Metric tone="green" icon={<ShieldCheck/>} label="Catalog coverage" value={data?.count??0} note="Actively exploited CVEs"/>
        </section>
        <section className="intel-panel">
          <div className="panel-heading"><div><p className="kicker">PRIORITIZED ACTION</p><h2>Remediation queue</h2></div><span>{filtered.length.toLocaleString()} matches</span></div>
          <div className="filters"><label className="search-field"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search CVE, vendor, or product"/></label><label className="select-field"><Filter/><select value={priority} onChange={e=>setPriority(e.target.value)}><option>All priorities</option><option>Critical</option><option>High</option><option>Elevated</option></select></label><button className={"toggle "+(ransomwareOnly?"on":"")} onClick={()=>setRansomwareOnly(v=>!v)}><Siren/>Ransomware only</button></div>
          {error&&<div className="message"><AlertTriangle/>{error}<button onClick={()=>void load()}>Try again</button></div>}
          {loading&&!data&&<div className="loading-list"><span/><span/><span/><span/></div>}
          {data&&<div className="queue-layout"><div className="table-wrap"><table><thead><tr><th>Risk</th><th>Vulnerability</th><th>Vendor / product</th><th>Due</th><th/></tr></thead><tbody>{filtered.slice(0,100).map(v=><tr key={v.cve} className={selected?.cve===v.cve?"selected":""} onClick={()=>setSelected(v)}><td><Pill item={v}/></td><td><strong className="cve">{v.cve}</strong><small>{v.name}</small></td><td><strong>{v.vendor}</strong><small>{v.product}</small></td><td className={v.due<today?"overdue":""}>{fmt(v.due)}</td><td><ChevronRight/></td></tr>)}</tbody></table>{!filtered.length&&<div className="empty">No vulnerabilities match these filters.</div>}</div>
            <aside className="detail-panel">{selected&&<><div className="detail-top"><Pill item={selected}/>{selected.ransomware&&<span className="ransomware"><Siren/>Ransomware</span>}</div><p className="kicker">{selected.vendor} / {selected.product}</p><h3>{selected.cve}</h3><p className="description">{selected.description}</p><dl><div><dt>Added to KEV</dt><dd>{fmt(selected.added)}</dd></div><div><dt>Remediation due</dt><dd className={selected.due<today?"overdue":""}>{fmt(selected.due)}</dd></div></dl><div className="action-box"><span>Required action</span><p>{selected.action}</p></div><div className="cwe-list">{selected.cwes.map(c=><span key={c}>{c}</span>)}</div><a className="detail-link" href={"https://nvd.nist.gov/vuln/detail/"+selected.cve} target="_blank">Open NVD record <ExternalLink/></a></>}</aside>
          </div>}
        </section>
        <footer>RiskRadar prioritizes public vulnerability intelligence; it does not scan your environment.</footer>
      </div>
    </section>
  </main>;
}
function Metric({icon,label,value,note,tone}:{icon:React.ReactNode;label:string;value:number;note:string;tone:string}){return <article className={"metric-card "+tone}><div className="metric-label"><span>{icon}</span>{label}</div><strong>{value.toLocaleString()}</strong><small>{note}</small></article>}
function Pill({item}:{item:Vulnerability}){return <span className={"priority-pill "+item.priority.toLowerCase()}>{item.riskScore} · {item.priority}</span>}
