// api/mxn-usd.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const WISE_API_TOKEN = process.env.WISE_API_TOKEN; // Store your token securely in Vercel env vars

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const apiRes = await fetch(
      'https://api.transferwise.com/v1/rates?source=MXN&target=USD',
      {
        headers: {
          'Authorization': `Bearer ${WISE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!apiRes.ok) {
      throw new Error(`Wise API responded with status ${apiRes.status}`);
    }

    const data = await apiRes.json();
    // Wise returns an array of rates, pick the first one
    const rate = data[0]?.rate;

    if (rate) {
      res.status(200).json({ mxn_usd: rate, source: "mid-market", provider: "Wise" });
    } else {
      res.status(502).json({ error: "Could not parse exchange rate" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
