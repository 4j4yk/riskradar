'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Bell, ChevronDown, CircleHelp, ExternalLink, FileText, LayoutDashboard, LineChart as LineChartIcon, Menu, MoreHorizontal, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const companies = [
  { ticker: 'MSFT', name: 'Microsoft Corporation', cik: '0000789019', sector: 'Technology' },
  { ticker: 'AAPL', name: 'Apple Inc.', cik: '0000320193', sector: 'Technology' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', cik: '0001045810', sector: 'Semiconductors' },
  { ticker: 'AMZN', name: 'Amazon.com, Inc.', cik: '0001018724', sector: 'Consumer' },
];
const metrics = [
  ['Revenue', '$245.1B', '+16.0%', 'FY 2024'], ['Net income', '$88.1B', '+21.8%', 'FY 2024'],
  ['Total assets', '$512.2B', '+24.3%', 'Jun 30, 2024'], ['Operating margin', '44.6%', '+2.8 pts', 'FY 2024'],
];
const revenueData = [
  { year: '2020', revenue: 143 }, { year: '2021', revenue: 168 }, { year: '2022', revenue: 198 },
  { year: '2023', revenue: 212 }, { year: '2024', revenue: 245 },
];
const filings = [
  ['10-Q', 'Jan 29, 2025', 'Dec 31, 2024', 'Quarterly report', '0000950170-25-010491'],
  ['8-K', 'Jan 29, 2025', 'Jan 29, 2025', 'Results of operations and financial condition', '0000950170-25-010497'],
  ['10-Q', 'Oct 30, 2024', 'Sep 30, 2024', 'Quarterly report', '0000950170-24-118967'],
  ['10-K', 'Jul 30, 2024', 'Jun 30, 2024', 'Annual report', '0000950170-24-087843'],
  ['8-K', 'Jul 30, 2024', 'Jul 30, 2024', 'Results of operations and financial condition', '0000950170-24-087826'],
];
type LiveData = { metrics: { revenue:string; revenueChange:number|null; income:string; incomeChange:number|null; assets:string; assetsChange:number|null }; revenue:{year:string;revenue:number}[]; filings:{form:string;filed:string;period:string;description:string;accession:string;document:string}[] };
declare global { interface Document { modelContext?: { registerTool:(tool:unknown, options?:{signal?:AbortSignal})=>void|Promise<void> } } }

export default function Home() {
  const [query, setQuery] = useState('');
  const [activeCompany, setActiveCompany] = useState(companies[0]);
  const [showResults, setShowResults] = useState(false);
  const [period, setPeriod] = useState<'Annual' | 'Quarterly'>('Annual');
  const [watching, setWatching] = useState(false);
  const [liveData, setLiveData] = useState<LiveData|null>(null);
  const [dataStatus, setDataStatus] = useState<'loading'|'live'|'fallback'>('loading');
  const matches = useMemo(() => companies.filter((c) => `${c.ticker} ${c.name}`.toLowerCase().includes(query.toLowerCase().trim())), [query]);
  useEffect(()=>{ const controller=new AbortController(); const apiBase=process.env.NEXT_PUBLIC_SEC_API_URL; if(!apiBase){setDataStatus('fallback');return()=>controller.abort()} fetch(`${apiBase.replace(/\/$/,'')}/company/${activeCompany.cik}`,{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error();return r.json() as Promise<LiveData>}).then(d=>{setLiveData(d);setDataStatus('live')}).catch(e=>{if(e.name!=='AbortError'){setLiveData(null);setDataStatus('fallback')}}); return()=>controller.abort() },[activeCompany]);
  useEffect(()=>{ if(!document.modelContext?.registerTool)return; const lifecycle=new AbortController(); void Promise.resolve(document.modelContext.registerTool({name:'open_company_overview',title:'Open company overview',description:'Select a supported public company by ticker and display its SEC filing overview.',inputSchema:{type:'object',properties:{ticker:{type:'string',enum:companies.map(c=>c.ticker)}},required:['ticker'],additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input:unknown){const ticker=(input as {ticker?:string})?.ticker;const company=companies.find(c=>c.ticker===ticker?.toUpperCase());if(!company)throw new Error('Unknown ticker');setActiveCompany(company);return{ticker:company.ticker,name:company.name,cik:company.cik}}},{signal:lifecycle.signal})).catch(()=>undefined); return()=>lifecycle.abort() },[]);
  const displayMetrics = liveData ? [['Revenue',liveData.metrics.revenue,liveData.metrics.revenueChange==null?'—':`${liveData.metrics.revenueChange>=0?'+':''}${liveData.metrics.revenueChange.toFixed(1)}%`,'Latest FY'],['Net income',liveData.metrics.income,liveData.metrics.incomeChange==null?'—':`${liveData.metrics.incomeChange>=0?'+':''}${liveData.metrics.incomeChange.toFixed(1)}%`,'Latest FY'],['Total assets',liveData.metrics.assets,liveData.metrics.assetsChange==null?'—':`${liveData.metrics.assetsChange>=0?'+':''}${liveData.metrics.assetsChange.toFixed(1)}%`,'Latest FY'],metrics[3]] : metrics;
  const displayRevenue=liveData?.revenue.length?liveData.revenue:revenueData;
  const displayFilings: string[][]=liveData?.filings.length?liveData.filings.map(f=>[f.form,f.filed,f.period,f.description,f.accession,f.document]):filings;

  return <main className="min-h-screen bg-background text-foreground">
    <header className="topbar">
      <a className="brand" href="#top"><span className="brand-mark"><span /></span><span>OpenFilings</span></a>
      <nav className="topnav"><a className="active" href="#overview">Overview</a><a href="#financials">Financials</a><a href="#filings">Filings</a></nav>
      <div className="header-actions"><Button variant="ghost" size="icon" aria-label="Help"><CircleHelp /></Button><Button variant="ghost" size="icon" aria-label="Notifications"><Bell /></Button><span className="avatar">AK</span></div>
    </header>
    <div className="app-shell" id="top">
      <aside className="sidebar">
        <div className="sidebar-section"><span className="sidebar-label">Workspace</span><a className="sidebar-link active" href="#overview"><LayoutDashboard />Overview</a><a className="sidebar-link" href="#financials"><LineChartIcon />Financials</a><a className="sidebar-link" href="#filings"><FileText />Filings</a></div>
        <div className="sidebar-section watchlist"><div className="sidebar-label-row"><span>Watchlist</span><button aria-label="Watchlist options"><MoreHorizontal /></button></div>
          {companies.slice(0,3).map((c,i)=><button className="watch-item" key={c.ticker} onClick={()=>setActiveCompany(c)}><span className={`ticker-icon tone-${i}`}>{c.ticker[0]}</span><span><strong>{c.ticker}</strong><small>{c.name.split(' ')[0]}</small></span><span className="watch-price">{i===0?'$415.26':i===1?'$229.00':'$134.29'}<small className={i===1?'down':'up'}>{i===1?'−0.52%':i===0?'+0.96%':'+1.74%'}</small></span></button>)}
        </div>
        <div className="source-note"><ShieldCheck /><div><strong>Official source</strong><span>Financial data from SEC EDGAR</span></div></div>
      </aside>
      <section className="workspace"><div className="workspace-inner">
        <div className="mobile-brand"><Menu /><span>OpenFilings</span></div>
        <div className="search-wrap"><Search /><Input value={query} onChange={(e)=>{setQuery(e.target.value);setShowResults(true)}} onFocus={()=>setShowResults(true)} placeholder="Search by company or ticker…" aria-label="Search companies"/><kbd>⌘ K</kbd>{query&&<button className="clear-search" onClick={()=>setQuery('')}><X /></button>}
          {showResults&&query&&<div className="search-results">{matches.length?matches.map(c=><button key={c.ticker} onClick={()=>{setActiveCompany(c);setQuery('');setShowResults(false)}}><span className="result-symbol">{c.ticker[0]}</span><span><strong>{c.name}</strong><small>{c.ticker} · NASDAQ</small></span><span className="result-sector">{c.sector}</span></button>):<p>No matching companies</p>}</div>}
        </div>
        <section className="company-heading" id="overview"><div className="company-identity"><span className="company-logo">{activeCompany.ticker[0]}</span><div><div className="eyebrow"><span>NASDAQ</span><span>CIK {activeCompany.cik}</span></div><h1>{activeCompany.name}</h1><p>{activeCompany.ticker} · {activeCompany.sector}</p></div></div><div className="company-actions"><Button variant="outline" size="lg" onClick={()=>setWatching(!watching)}>{watching?'Watching':'Add to watchlist'}</Button><a className="sec-button" href={`https://www.sec.gov/edgar/browse/?CIK=${activeCompany.cik}`} target="_blank" rel="noreferrer">View on SEC <ExternalLink /></a></div></section>
        <section className="metric-grid">{displayMetrics.map(([label,value,change,note])=><article className="metric-card" key={label}><div><span>{label}</span><Badge variant="outline">{note}</Badge></div><strong>{value}</strong><p className={String(change).startsWith('-')?'negative':'positive'}><ArrowUpRight />{change}<span>year over year</span></p></article>)}</section>
        <section className="panel financial-panel" id="financials">
          <div className="panel-heading"><div><div className="title-row"><h2>Financial performance</h2><Badge className="verified"><ShieldCheck /> SEC verified</Badge></div><p>Revenue reported in annual filings</p></div><div className="period-toggle">{(['Annual','Quarterly'] as const).map(p=><button key={p} className={period===p?'active':''} onClick={()=>setPeriod(p)}>{p}</button>)}</div></div>
          <div className="chart-summary"><div><span>Revenue</span><strong>$245.1B</strong><small className="positive">+16.0%</small></div><div><span>Net income</span><strong>$88.1B</strong><small className="positive">+21.8%</small></div></div>
          <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={displayRevenue} margin={{top:12,right:12,left:-20,bottom:0}}><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#17745b" stopOpacity={.22}/><stop offset="100%" stopColor="#17745b" stopOpacity={.01}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#e5e8e6" strokeDasharray="3 3"/><XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill:'#748078',fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#748078',fontSize:12}} tickFormatter={v=>`$${Number(v)}B`}/><Tooltip contentStyle={{borderRadius:8,borderColor:'#dfe4e1'}} formatter={v=>[`$${Number(v)}B`,'Revenue']}/><Area type="monotone" dataKey="revenue" stroke="#17745b" strokeWidth={2.5} fill="url(#revenueFill)"/></AreaChart></ResponsiveContainer></div>
          <p className="chart-caption"><Sparkles />Five-year compound annual growth: <strong>14.4%</strong></p>
        </section>
        <section className="panel filings-panel" id="filings"><div className="panel-heading filings-heading"><div><h2>Recent filings</h2><p>Latest disclosures filed with the U.S. Securities and Exchange Commission</p></div><Button variant="outline">All filings <ChevronDown /></Button></div>
          <Table><TableHeader><TableRow><TableHead>Form</TableHead><TableHead>Filed</TableHead><TableHead>Reporting period</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Source</TableHead></TableRow></TableHeader><TableBody>{displayFilings.map(([form,filed,report,description,accession,document])=><TableRow key={accession}><TableCell><Badge className={`form-badge form-${form.replace('-','')}`}>{form}</Badge></TableCell><TableCell>{filed}</TableCell><TableCell className="muted-cell">{report}</TableCell><TableCell className="description-cell">{description}</TableCell><TableCell className="text-right"><a className="source-link" href={document?`https://www.sec.gov/Archives/edgar/data/${Number(activeCompany.cik)}/${accession.replaceAll('-','')}/${document}`:`https://www.sec.gov/Archives/edgar/data/789019/${accession.replaceAll('-','')}/${accession}-index.htm`} target="_blank" rel="noreferrer"><ExternalLink /></a></TableCell></TableRow>)}</TableBody></Table>
        </section>
        <footer><span>OpenFilings is an independent project. Data sourced from SEC EDGAR.</span><span>{dataStatus==='live'?'Live SEC data':dataStatus==='loading'?'Refreshing SEC data…':'Demo data · SEC temporarily unavailable'}</span></footer>
      </div></section>
    </div>
  </main>;
}
