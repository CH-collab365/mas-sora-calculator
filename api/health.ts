/**
 * Serverless Health Check Endpoint
 * Route: /api/health
 */

export interface HealthResponse {
  status: 'ok' | 'error';
  service: string;
  timestamp: string;
  masKeyConfigured: boolean;
  environment: string;
}

export default async function handler(req: any, res: any) {
  const masKey = process.env.MAS_KEY_ID || process.env.MAS_API_KEY;
  const isConfigured = Boolean(masKey && masKey !== 'YOUR_MAS_KEY_ID');

  const payload: HealthResponse = {
    status: 'ok',
    service: 'MAS SORA Gateway Serverless',
    timestamp: new Date().toISOString(),
    masKeyConfigured: isConfigured,
    environment: process.env.NODE_ENV || 'production',
  };

  // Node / Express / Vercel Serverless response
  if (res && typeof res.status === 'function') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).json(payload);
  }

  // Web Standard Response fallback
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}
