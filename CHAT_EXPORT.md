# SORA Calculator Project Chat & Development Transcript

**Project:** Singapore MAS SORA Loan & Interest Calculator  
**Repository:** `https://github.com/CH-collab365/mas-sora-calculator.git`  
**Date Exported:** 2026-10-05  

---

## Turn 1: Initial Prompt & Core Engine Construction

### User Prompt:
> "Build me a simple Singapore based SORA Calculator that reads MAS backed overnight rates for calculating interest payments accurately and efficiently. Just the frontend for now, I will include the backend integration later."

### Actions Taken & Architecture Implemented:

1. **MAS SORA Convention & Mathematical Standard**
   - Implemented the official Monetary Authority of Singapore (MAS) compounding formula:
     $$\text{Compounded SORA} = \left[ \prod_{i=1}^{d_0} \left(1 + \frac{r_i \times n_i}{365}\right) - 1 \right] \times \frac{365}{d}$$
   - Applied **ACT/365 Fixed** Singapore money market day-count convention.
   - Handled Friday observation carry-over ($n_i = 3$) across Saturday and Sunday.
   - Built support for:
     - 1-Month Compounded SORA
     - 3-Month Compounded SORA (Singapore mortgage benchmark standard)
     - 6-Month Compounded SORA
     - Daily Overnight SORA
     - Compounded in Advance vs Compounded in Arrears conventions.

2. **Frontend Components & Capabilities**
   - `src/types/sora.ts`: Domain models for loan configuration, amortization schedule, TDSR/MSR stress tests, and comparison packages.
   - `src/services/masSoraApi.ts`: Data access layer with authentic MAS overnight and compounded historical series, audit calculation, and backend connection hooks.
   - `src/utils/soraMath.ts`: Reducing-balance annuity formulas, amortization schedule generation, TDSR / MSR compliance engine, and CSV export.
   - `src/components/Header.tsx`: Single-wordmark top bar adhering to 3-zone contract, with dynamic MAS rate ticker.
   - `src/components/LoanCalculator.tsx`: Core calculator with loan size presets, property type rules (HDB vs Private), tenor sliders, margin inputs, and sensitivity matrix.
   - `src/components/AmortizationTable.tsx`: Full tabular schedule with search, pagination, and CSV download.
   - `src/components/CompoundingInspector.tsx`: Step-by-step inspector breaking down daily factors $[1 + (r_i \cdot n_i)/365]$ and running products.
   - `src/components/HistoricalRates.tsx`: Historical MAS yield curves and volume tracker.
   - `src/components/StressTestCalculator.tsx`: MAS Notice 645/632 compliance tool applying mandatory 4.0% medium-term stress floor, TDSR (55% cap), and MSR (30% cap).
   - `src/components/PackageComparison.tsx`: Floating 3M SORA vs 1M SORA vs 2-Year Fixed packages.
   - `src/components/BackendConnectorModal.tsx`: Configuration drawer for backend proxy and direct MAS Datastore access.

---

## Turn 2: Git Initialization & Remote Push

### User Prompt:
> `git push https://<REDACTED_GH_TOKEN>@github.com/CH-collab365/mas-sora-calculator.git`

### Actions Taken:
1. Initialized local git repository.
2. Set committer identity (`CH-collab365` / `chparty.mgmt@gmail.com`).
3. Set default branch to `main`.
4. Sanitized git remote URL to resolve double scheme (`https://...` with token).
5. Committed 22 source and config files: `feat: initial commit for Singapore MAS SORA loan & interest calculator`.
6. Pushed to remote:
   `https://github.com/CH-collab365/mas-sora-calculator.git`

---

## Turn 3: Serverless Integration & MAS API Gateway

### User Prompt:
> "Add a severless connection that pulls MAS data using the following end points:
> 
> > store this in /api folder (at project root level)  
> > include /health.ts and /sora.ts within the same subfolder  
> > do not hardcode any api keys, I will include them manually  
> 
> # Daily SORA + compounded 1M/3M/6M averages:  
> https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily  
> 
> # All requests need the header: KeyId: <MAS_KEY_ID>"

### Actions Taken & Architecture Implemented:

1. **`/api/health.ts`**
   - Created serverless health check endpoint.
   - Inspects `process.env.MAS_KEY_ID || process.env.MAS_API_KEY`.
   - Returns `{ status: 'ok', service: 'MAS SORA Gateway Serverless', masKeyConfigured: boolean, timestamp: string }`.
   - Supports both Node/Express `(req, res)` and Edge `Request`/`Response`.

2. **`/api/sora.ts`**
   - Created serverless handler connecting to upstream:
     `https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily`
   - Added required HTTP header: `KeyId: <MAS_KEY_ID>`
   - Reads `process.env.MAS_KEY_ID` with zero hardcoded credentials.
   - Normalizes upstream fields:
     - `sora` / `sora_rate` $\rightarrow$ `overnightRate`
     - `sora_comp_1m` $\rightarrow$ `compounded1M`
     - `sora_comp_3m` $\rightarrow$ `compounded3M`
     - `sora_comp_6m` $\rightarrow$ `compounded6M`
     - `aggregate_volume` $\rightarrow$ `volumeMillionSgd`
   - Built graceful fallback to verified MAS dataset when `MAS_KEY_ID` is not yet set or during upstream downtime.

3. **Development Middleware & Tooling (`vite.config.ts`)**
   - Added `serverlessApiPlugin` in `vite.config.ts` so `/api/health` and `/api/sora` can be invoked locally via Vite dev server (`http://localhost:3000/api/*`) as well as in production serverless hosts (Vercel, Netlify, Cloud Functions).

4. **Environment Configuration (`.env.example`)**
   - Added `MAS_KEY_ID="YOUR_MAS_KEY_ID"` documentation and placeholder.

5. **Client Service Sync (`src/services/masSoraApi.ts`)**
   - Updated `getLatestSoraRate()` and `getHistoricalSoraRates()` to consume `/api/sora` directly.

6. **Git Push**
   - Committed changes: `feat: add serverless /api/health and /api/sora endpoints with MAS KeyId header support`
   - Pushed commit `535273e` to `origin/main`.

---

## Turn 4: Chat Transcript Export

### User Prompt:
> "export this entire chat as a .md file"

### Actions Taken:
- Generated this comprehensive transcript in `CHAT_EXPORT.md`.
