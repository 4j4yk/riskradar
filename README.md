# RiskRadar

RiskRadar is a vulnerability-intelligence dashboard that turns the public
[CISA Known Exploited Vulnerabilities catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
into a practical remediation queue.

## What it demonstrates

- Live public-data integration through a server-side API route
- Transparent prioritization of actively exploited vulnerabilities
- Search, severity, ransomware, and remediation-deadline workflows
- Responsive security-operations interface
- CDN caching without a database or committed data snapshots

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Import this repository into Vercel. No environment variables or external
database are required.

## Data source

RiskRadar uses the official CISA KEV JSON feed and links individual records to
the National Vulnerability Database. Risk scores are prioritization aids, not
CVSS scores and not evidence that a specific environment is exposed.
