# Chipi SDK – MXN/USD Mid-Market Exchange Rate API

Welcome to the Chipi SDK documentation for our **MXN/USD exchange rate serverless function**. This service provides developers with a fair, transparent, and compliant way to fetch the real-time mid-market exchange rate for Mexican Peso (MXN) to US Dollar (USD) using official data from Banco de México (Banxico).

## Why Use the Mid-Market Rate?

**The Only Fair Exchange Rate: The Mid-Market Rate**

Exchange rates don’t need to be complicated. There’s only one rate that truly matters: the **mid-market rate**.

- **What is the mid-market rate?**  
  The mid-market rate is the midpoint between the buy and sell prices for a currency on the global market. It’s the “real” rate that banks use when trading between themselves, and it’s widely recognized as the fairest and most transparent rate available.

- **Why does Chipi use it?**  
  Most banks and money transfer providers add hidden markups to their exchange rates, making it hard to know the true cost of currency conversion. By using the mid-market rate, Chipi ensures you always get a transparent, unbiased, and competitive rate—free from hidden fees or artificial spreads.

- **Full transparency:**  
  The rate you see is the rate you get. No misleading “0% fee” claims, no hidden costs in the small print.

- **Regulatory compliance:**  
  The mid-market rate is accepted by accounting and regulatory bodies as a reputable, consistent benchmark for reporting and settlements.

**Learn more about the mid-market rate and why it matters on [Wise’s rate tracker](https://wise.com/gb/currency-converter/mxn-to-usd-rate).**

## How Chipi Calculates the Mid-Market Rate with Banxico

Chipi fetches the **official wholesale buy and sell rates for USD/MXN** directly from Banxico’s SIE API and calculates the mid-market rate as their average:

$$
\text{Mid-market rate} = \frac{\text{Buy Rate} + \text{Sell Rate}}{2}
$$

- **Buy Rate:** Banxico’s wholesale market buy rate for USD/MXN (see series ID below).
- **Sell Rate:** Banxico’s wholesale market sell rate for USD/MXN (see series ID below).
- **Mid-market Rate:** The average of the above, representing the fairest, most transparent rate.

**About Series IDs:**  
Banxico assigns a unique, permanent series ID to each economic indicator. For USD/MXN, you must use the correct IDs for the buy and sell rates. These IDs are fixed and published in Banxico’s [official catalog](https://www.banxico.org.mx/SieAPIRest/service/v1/doc/catalogoSeries).  
*You can make these IDs configurable in your code for flexibility and future-proofing.*

## Quick Start: Deploying the Chipi Exchange Rate API on Vercel (TypeScript)

This guide will help you set up and deploy the Chipi MXN/USD exchange rate API using Vercel serverless functions with TypeScript.

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Vercel CLI](https://vercel.com/download) installed globally (`npm i -g vercel`)
- A [Vercel account](https://vercel.com/signup)
- A Banxico SIE API token ([get yours here](https://www.banxico.org.mx/SieAPIRest/service/v1/token))

### 2. Project Setup

```bash
mkdir chipi-exchange-rate
cd chipi-exchange-rate
npm init -y
npm install --save-dev typescript @types/node @vercel/node
```

Create a `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "target": "es2019",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist"
  },
  "include": ["api"]
}
```

### 3. Create the API Endpoint

#### File: `api/mxn-usd-midrate.ts`

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

const BANXICO_TOKEN = process.env.BANXICO_TOKEN; // Store your Banxico token securely

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Replace with the correct Banxico series IDs for USD/MXN buy and sell rates
    const BUY_SERIE = process.env.BANXICO_BUY_SERIE || 'SFXXXXX'; // USD/MXN buy rate
    const SELL_SERIE = process.env.BANXICO_SELL_SERIE || 'SFYYYYY'; // USD/MXN sell rate

    const apiRes = await fetch(
      `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${BUY_SERIE},${SELL_SERIE}/datos/oportuno`,
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
    const buySerie = data?.bmx?.series?.find((s: any) => s.idSerie === BUY_SERIE);
    const sellSerie = data?.bmx?.series?.find((s: any) => s.idSerie === SELL_SERIE);

    const buyRateStr = buySerie?.datos?.[0]?.dato;
    const sellRateStr = sellSerie?.datos?.[0]?.dato;
    const dateStr = buySerie?.datos?.[0]?.fecha || sellSerie?.datos?.[0]?.fecha;

    if (buyRateStr && sellRateStr) {
      const buy = parseFloat(buyRateStr.replace(',', ''));
      const sell = parseFloat(sellRateStr.replace(',', ''));
      const mid = ((buy + sell) / 2);

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
        note: "The mid-market rate is the average of Banxico's wholesale buy and sell rates."
      });
    } else {
      res.status(502).json({ error: "Could not parse buy/sell rates from Banxico" });
    }
  } catch (error) {
    console.error("Banxico API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
```

- **Configure your Banxico series IDs** as environment variables (`BANXICO_BUY_SERIE`, `BANXICO_SELL_SERIE`) for flexibility and future-proofing.  
- **Get your Banxico API token** and store it as `BANXICO_TOKEN` in your environment.

### 4. Deploy to Vercel

```bash
vercel login
vercel
```

- Follow the prompts to link or create a new project.

## Usage

**GET** `/api/mxn-usd-midrate`

**Response:**

```json
{
  "mxn_usd": {
    "buy": 18.7400,
    "sell": 18.7680,
    "mid": 18.754
  },
  "date": "2025-07-02",
  "source": "mid-market",
  "provider": "Banxico",
  "note": "The mid-market rate is the average of Banxico's wholesale buy and sell rates."
}
```

- `mxn_usd.buy`: Banxico's official wholesale buy rate for USD/MXN.
- `mxn_usd.sell`: Banxico's official wholesale sell rate for USD/MXN.
- `mxn_usd.mid`: The calculated mid-market rate.
- `date`: The date of the rates (ISO format).
- `source`: Always "mid-market" for this endpoint.
- `provider`: The data provider (Banxico).

## Troubleshooting

- Ensure your `api/mxn-usd.ts` file is in the correct directory.
- Set your Banxico token and series IDs as environment variables in Vercel.
- Vercel automatically detects and compiles TypeScript serverless functions—no extra build steps are needed.
- If you need to customize your build, add or update your `vercel.json` configuration.

## License

© ChipiPay 2025. All rights reserved.

**Chipi SDK** is committed to fairness, transparency, and compliance.  
For more details, visit [docs.chipipay.com](https://docs.chipipay.com) or contact our support team.

**Note:**  
Banxico series IDs are fixed references to specific economic indicators. Always verify you are using the correct IDs for USD/MXN buy and sell rates by consulting Banxico’s [official catalog](https://www.banxico.org.mx/SieAPIRest/service/v1/doc/catalogoSeries). For maximum flexibility, make these IDs configurable in your deployment.
