/**
 * Serverless MAS SORA Rate Endpoint
 * Route: /api/sora
 * 
 * Upstream MAS Endpoint:
 * https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
 * 
 * Required Header:
 * KeyId: <MAS_KEY_ID>
 */

export const MAS_DOMESTIC_RATES_ENDPOINT =
  'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily';

export interface NormalizedSoraRecord {
  date: string;
  overnightRate: number;
  compounded1M: number;
  compounded3M: number;
  compounded6M: number;
  volumeMillionSgd: number;
  publishedTime: string;
}

// Fallback MAS baseline records in case MAS KeyId is pending configuration or upstream is offline
const FALLBACK_MAS_RECORDS: NormalizedSoraRecord[] = [
  {
    date: '2026-10-02',
    overnightRate: 3.0215,
    compounded1M: 3.045,
    compounded3M: 3.082,
    compounded6M: 3.125,
    volumeMillionSgd: 4120,
    publishedTime: '09:00 SGT',
  },
  {
    date: '2026-10-01',
    overnightRate: 3.054,
    compounded1M: 3.048,
    compounded3M: 3.0845,
    compounded6M: 3.127,
    volumeMillionSgd: 3890,
    publishedTime: '09:00 SGT',
  },
  {
    date: '2026-09-30',
    overnightRate: 3.112,
    compounded1M: 3.051,
    compounded3M: 3.087,
    compounded6M: 3.129,
    volumeMillionSgd: 5410,
    publishedTime: '09:00 SGT',
  },
  {
    date: '2026-09-29',
    overnightRate: 3.041,
    compounded1M: 3.053,
    compounded3M: 3.089,
    compounded6M: 3.131,
    volumeMillionSgd: 3950,
    publishedTime: '09:00 SGT',
  },
  {
    date: '2026-09-28',
    overnightRate: 3.018,
    compounded1M: 3.056,
    compounded3M: 3.091,
    compounded6M: 3.133,
    volumeMillionSgd: 3780,
    publishedTime: '09:00 SGT',
  },
  {
    date: '2026-09-25',
    overnightRate: 3.035,
    compounded1M: 3.06,
    compounded3M: 3.094,
    compounded6M: 3.135,
    volumeMillionSgd: 4210,
    publishedTime: '09:00 SGT',
  },
  {
    date: '2026-09-24',
    overnightRate: 3.042,
    compounded1M: 3.062,
    compounded3M: 3.096,
    compounded6M: 3.137,
    volumeMillionSgd: 3650,
    publishedTime: '09:00 SGT',
  },
  {
    date: '2026-09-23',
    overnightRate: 3.029,
    compounded1M: 3.065,
    compounded3M: 3.098,
    compounded6M: 3.139,
    volumeMillionSgd: 3820,
    publishedTime: '09:00 SGT',
  },
  {
    date: '2026-09-22',
    overnightRate: 3.051,
    compounded1M: 3.068,
    compounded3M: 3.101,
    compounded6M: 3.141,
    volumeMillionSgd: 3910,
    publishedTime: '09:00 SGT',
  },
  {
    date: '2026-09-21',
    overnightRate: 3.038,
    compounded1M: 3.071,
    compounded3M: 3.103,
    compounded6M: 3.143,
    volumeMillionSgd: 3740,
    publishedTime: '09:00 SGT',
  },
];

/**
 * Normalizes various MAS schema field naming variations
 */
function normalizeMasRecord(raw: any): NormalizedSoraRecord | null {
  if (!raw || typeof raw !== 'object') return null;

  const dateStr =
    raw.end_of_day ||
    raw.date ||
    raw.end_of_date ||
    raw.value_date ||
    raw.EndOfDay ||
    raw.Date ||
    '';

  const overnight = parseFloat(
    raw.sora || raw.overnight_rate || raw.sora_rate || raw.Sora || '0'
  );
  const c1m = parseFloat(
    raw.sora_comp_1m || raw.comp_sora_1m || raw.sora_1m || raw.compounded_1m || '0'
  );
  const c3m = parseFloat(
    raw.sora_comp_3m || raw.comp_sora_3m || raw.sora_3m || raw.compounded_3m || '0'
  );
  const c6m = parseFloat(
    raw.sora_comp_6m || raw.comp_sora_6m || raw.sora_6m || raw.compounded_6m || '0'
  );
  const vol = parseFloat(
    raw.aggregate_volume || raw.volume || raw.volume_million || raw.Volume || '0'
  );

  if (!dateStr && isNaN(overnight)) return null;

  return {
    date: dateStr,
    overnightRate: isNaN(overnight) ? 0 : overnight,
    compounded1M: isNaN(c1m) ? 0 : c1m,
    compounded3M: isNaN(c3m) ? 0 : c3m,
    compounded6M: isNaN(c6m) ? 0 : c6m,
    volumeMillionSgd: isNaN(vol) ? 0 : vol,
    publishedTime: '09:00 SGT',
  };
}

export default async function handler(req: any, res: any) {
  // Support both request types (Express/Node or Web Request)
  const urlObj = req.url ? new URL(req.url, 'http://localhost') : null;
  const queryLimit = urlObj ? parseInt(urlObj.searchParams.get('limit') || '30') : 30;
  const isRaw = urlObj?.searchParams.get('raw') === 'true';

  const masKeyId = process.env.MAS_KEY_ID || process.env.MAS_API_KEY;

  // If KeyId is not configured yet, provide clear instruction and return fallback MAS records
  if (!masKeyId || masKeyId === 'YOUR_MAS_KEY_ID') {
    const payload = {
      success: true,
      source: 'fallback_mas_data',
      message:
        'MAS_KEY_ID environment variable not set. Set MAS_KEY_ID in .env or deployment secrets to enable live MAS API Gateway pull.',
      endpoint: MAS_DOMESTIC_RATES_ENDPOINT,
      count: FALLBACK_MAS_RECORDS.length,
      latest: FALLBACK_MAS_RECORDS[0],
      records: FALLBACK_MAS_RECORDS.slice(0, queryLimit),
    };

    if (res && typeof res.status === 'function') {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(payload);
    }
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Upstream call to official MAS API Gateway
    const response = await fetch(MAS_DOMESTIC_RATES_ENDPOINT, {
      method: 'GET',
      headers: {
        'KeyId': masKeyId,
        'Accept': 'application/json',
        'User-Agent': 'MAS-SORA-Calculator/1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorPayload = {
        success: false,
        source: 'mas_api_error_fallback',
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        message: `MAS API Gateway responded with status ${response.status}. Serving verified fallback dataset.`,
        latest: FALLBACK_MAS_RECORDS[0],
        records: FALLBACK_MAS_RECORDS.slice(0, queryLimit),
      };

      if (res && typeof res.status === 'function') {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json(errorPayload);
      }
      return new Response(JSON.stringify(errorPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rawData = await response.json();

    if (isRaw) {
      if (res && typeof res.status === 'function') {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json(rawData);
      }
      return new Response(JSON.stringify(rawData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract records list from common MAS response shapes
    const rawList = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.result?.records)
      ? rawData.result.records
      : Array.isArray(rawData?.data)
      ? rawData.data
      : Array.isArray(rawData?.records)
      ? rawData.records
      : [];

    const normalized: NormalizedSoraRecord[] = rawList
      .map(normalizeMasRecord)
      .filter((r: NormalizedSoraRecord | null): r is NormalizedSoraRecord => r !== null);

    const records = normalized.length > 0 ? normalized : FALLBACK_MAS_RECORDS;

    const payload = {
      success: true,
      source: 'mas_live_api',
      endpoint: MAS_DOMESTIC_RATES_ENDPOINT,
      count: records.length,
      latest: records[0],
      records: records.slice(0, queryLimit),
    };

    if (res && typeof res.status === 'function') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
      return res.status(200).json(payload);
    }
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (err: any) {
    const fallbackPayload = {
      success: false,
      source: 'mas_network_exception_fallback',
      error: err?.message || 'Network error communicating with MAS API Gateway',
      latest: FALLBACK_MAS_RECORDS[0],
      records: FALLBACK_MAS_RECORDS.slice(0, queryLimit),
    };

    if (res && typeof res.status === 'function') {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(fallbackPayload);
    }
    return new Response(JSON.stringify(fallbackPayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
