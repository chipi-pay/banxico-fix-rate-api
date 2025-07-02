import { VercelRequest, VercelResponse } from '@vercel/node';

// Helper to fetch the mid-market rate from Wise
async function fetchMidMarketRate(): Promise<number | null> {
  const res = await fetch('https://wise.com/gb/currency-converter/mxn-to-usd-rate');
  const html = await res.text();
  const match = html.match(/1 MXN\|([0-9.]+) USD/);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const rate = await fetchMidMarketRate();
    if (rate) {
      res.status(200).json({ mxn_usd: rate, source: "mid-market", provider: "Wise" });
    } else {
      res.status(502).json({ error: "Could not fetch exchange rate" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}