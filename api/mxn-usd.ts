// api/mxn-usd.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const apiRes = await fetch('https://api.exchangerate.host/latest?base=MXN&symbols=USD');
    if (!apiRes.ok) {
      throw new Error('Failed to fetch from ExchangeRate.host');
    }
    const data = await apiRes.json();
    const rate = data.rates?.USD;

    if (rate) {
      res.status(200).json({ mxn_usd: rate, source: "mid-market", provider: "ExchangeRate.host" });
    } else {
      res.status(502).json({ error: "Could not parse exchange rate" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
