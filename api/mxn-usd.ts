import type { VercelRequest, VercelResponse } from '@vercel/node';

const BANXICO_TOKEN = process.env.BANXICO_TOKEN; // Store your Banxico token securely

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Fetch both buy (SF46410) and sell (SF46406) rates
    const apiRes = await fetch(
      'https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF46410,SF46406/datos/oportuno',
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
    // Extract buy and sell rates
    const buySerie = data?.bmx?.series?.find((s: any) => s.idSerie === 'SF46410');
    const sellSerie = data?.bmx?.series?.find((s: any) => s.idSerie === 'SF46406');

    const buyRateStr = buySerie?.datos?.[0]?.dato;
    const sellRateStr = sellSerie?.datos?.[0]?.dato;
    const dateStr = buySerie?.datos?.[0]?.fecha || sellSerie?.datos?.[0]?.fecha;

    if (buyRateStr && sellRateStr) {
      const buy = parseFloat(buyRateStr.replace(',', ''));
      const sell = parseFloat(sellRateStr.replace(',', ''));

      // Calculate mid-market rate
      const mid = ((buy + sell) / 2);

      // Format date as ISO if possible
      let isoDate = dateStr;
      if (dateStr && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/');
        isoDate = `${year}-${month}-${day}`;
      }

      res.status(200).json({
        mxn_usd: {
          buy,
          sell,
          mid: parseFloat(mid.toFixed(6)),
        },
        date: isoDate,
        source: "mid-market",
        provider: "Banxico",
        note: "The mid-market rate is the average of Banxico's wholesale buy and sell rates (SF46410, SF46406)."
      });
    } else {
      res.status(502).json({ error: "Could not parse buy/sell rates from Banxico" });
    }
  } catch (error) {
    console.error("Banxico API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
