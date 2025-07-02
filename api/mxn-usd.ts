import type { VercelRequest, VercelResponse } from '@vercel/node';

const BANXICO_TOKEN = process.env.BANXICO_TOKEN; // Store your Banxico token as an env var

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const apiRes = await fetch(
      'https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno',
      {
        headers: {
          'Bmx-Token': BANXICO_TOKEN as string,
          'Accept': 'application/json',
        },
      }
    );

    if (!apiRes.ok) {
      throw new Error(`Banxico API responded with status ${apiRes.status}`);
    }

    const data = await apiRes.json();
    // Banxico response structure: data.bmx.series[0].datos[0].dato
    const rate = data?.bmx?.series?.[0]?.datos?.[0]?.dato;
    const date = data?.bmx?.series?.[0]?.datos?.[0]?.fecha;

    if (rate) {
      res.status(200).json({
        mxn_usd: rate,
        date,
        source: "FIX",
        provider: "Banxico"
      });
    } else {
      res.status(502).json({ error: "Could not parse exchange rate from Banxico" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
