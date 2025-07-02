import type { VercelRequest, VercelResponse } from '@vercel/node';

const BANXICO_TOKEN = process.env.BANXICO_TOKEN; // Store securely in your environment

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Optional fee as a decimal (e.g., 0.01 for 1%)
    const feeParam = req.query.fee;
    let fee = 0;
    if (feeParam) {
      const parsed = parseFloat(Array.isArray(feeParam) ? feeParam[0] : feeParam);
      if (!isNaN(parsed) && parsed >= 0 && parsed < 1) {
        fee = parsed;
      }
    }

    // Fetch the Banxico FIX rate (USD/MXN)
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
    const serie = data?.bmx?.series?.[0];
    const rateStr = serie?.datos?.[0]?.dato;
    const dateStr = serie?.datos?.[0]?.fecha;

    let isoDate = dateStr;
    if (dateStr && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      isoDate = `${year}-${month}-${day}`;
    }

    if (rateStr) {
      const referenceRate = parseFloat(rateStr.replace(',', ''));
      const customerRate = parseFloat((referenceRate * (1 + fee)).toFixed(6));

      res.status(200).json({
        reference: {
          rate: referenceRate,
          date: isoDate,
          source: "FIX",
          provider: "Banxico",
          note: "The FIX rate is Banxico's official reference for USD/MXN."
        },
        fee: fee,
        customer_rate: customerRate,
        explanation: `customer_rate = reference_rate * (1 + fee)`
      });
    } else {
      res.status(502).json({ error: "Could not parse FIX rate from Banxico" });
    }
  } catch (error) {
    console.error("Banxico API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
