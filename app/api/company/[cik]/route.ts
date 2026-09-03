import { NextResponse } from 'next/server';

const SEC_HEADERS = {
  'User-Agent': 'OpenFilings portfolio project contact@example.com',
  'Accept-Encoding': 'gzip, deflate',
};

type FactUnit = { val: number; fy?: number; fp?: string; form?: string; filed?: string; end?: string; accn?: string };
type CompanyFacts = { entityName: string; facts?: { 'us-gaap'?: Record<string, { units?: Record<string, FactUnit[]> }> } };

function annualFacts(data: CompanyFacts, concepts: string[]) {
  for (const concept of concepts) {
    const units = data.facts?.['us-gaap']?.[concept]?.units?.USD;
    if (!units) continue;
    const byYear = new Map<number, FactUnit>();
    units.filter((u) => u.form === '10-K' && u.fp === 'FY' && u.end && u.val != null).forEach((u) => {
      const year = Number(u.end!.slice(0, 4));
      const current = byYear.get(year);
      if (!current || (u.filed ?? '') > (current.filed ?? '')) byYear.set(year, u);
    });
    const values = [...byYear.entries()].sort((a, b) => a[0] - b[0]).slice(-5).map(([year, fact]) => ({ year: String(year), value: fact.val, accession: fact.accn }));
    if (values.length) return values;
  }
  return [];
}

function formatMoney(value?: number) {
  if (value == null) return '—';
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toLocaleString('en-US')}`;
}

export async function GET(_request: Request, context: { params: Promise<{ cik: string }> }) {
  const { cik } = await context.params;
  if (!/^\d{10}$/.test(cik)) return NextResponse.json({ error: 'Invalid CIK' }, { status: 400 });
  try {
    const [factsResponse, submissionsResponse] = await Promise.all([
      fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, { headers: SEC_HEADERS, next: { revalidate: 3600 } }),
      fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, { headers: SEC_HEADERS, next: { revalidate: 900 } }),
    ]);
    if (!factsResponse.ok || !submissionsResponse.ok) throw new Error('SEC upstream unavailable');
    const facts = await factsResponse.json() as CompanyFacts;
    const submissions = await submissionsResponse.json() as { name?: string; sicDescription?: string; tickers?: string[]; exchanges?: string[]; filings?: { recent?: Record<string, string[]> } };
    const revenue = annualFacts(facts, ['RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues', 'SalesRevenueNet']);
    const income = annualFacts(facts, ['NetIncomeLoss', 'ProfitLoss']);
    const assets = annualFacts(facts, ['Assets']);
    const recent = submissions.filings?.recent;
    const allowed = new Set(['10-K', '10-Q', '8-K']);
    const filings = (recent?.form ?? []).map((form, i) => ({ form, filed: recent?.filingDate?.[i], period: recent?.reportDate?.[i], accession: recent?.accessionNumber?.[i], document: recent?.primaryDocument?.[i], description: recent?.primaryDocDescription?.[i] || (form === '10-K' ? 'Annual report' : form === '10-Q' ? 'Quarterly report' : 'Current report') })).filter((f) => allowed.has(f.form)).slice(0, 8);
    const latest = (series: { value: number }[]) => series.at(-1)?.value;
    const prior = (series: { value: number }[]) => series.at(-2)?.value;
    const change = (series: { value: number }[]) => latest(series) != null && prior(series) ? ((latest(series)! / prior(series)! - 1) * 100) : null;
    return NextResponse.json({
      company: { name: submissions.name || facts.entityName, sector: submissions.sicDescription, ticker: submissions.tickers?.[0], exchange: submissions.exchanges?.[0] },
      metrics: { revenue: formatMoney(latest(revenue)), revenueChange: change(revenue), income: formatMoney(latest(income)), incomeChange: change(income), assets: formatMoney(latest(assets)), assetsChange: change(assets) },
      revenue: revenue.map((point) => ({ year: point.year, revenue: Math.round(point.value / 1e9) })), filings,
    }, { headers: { 'Cache-Control': 'public, max-age=900, s-maxage=3600' } });
  } catch {
    return NextResponse.json({ error: 'Unable to retrieve SEC data right now.' }, { status: 502 });
  }
}
