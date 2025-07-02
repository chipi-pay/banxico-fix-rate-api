# banxico-fix-rate-api

**A transparent API for USD/MXN exchange rates based on the official Banxico FIX rate, with optional configurable markup.**

## Why This API?

Most currency APIs either use unclear sources or hide their markups. This project is different:

- **Official Reference:** Uses the Banxico FIX rate, the official USD/MXN rate for regulatory, accounting, and settlement purposes in Mexico.
- **Transparent Fee:** Lets you apply a clear, configurable markup (fee) to the reference rate, so your customers always know what they’re paying.
- **Simple & Fast:** Deployable as a Vercel serverless function in minutes.

## How It Works

- **Reference Rate:** The API fetches the latest Banxico FIX rate (`SF43718`) for USD/MXN.
- **Fee (Markup):** You can specify a markup (as a decimal, e.g., `0.01` for 1%) via a query parameter.
- **Customer Rate:** The API calculates the customer-facing rate as `reference_rate * (1 + fee)`.
- **Full Transparency:** The API response shows the reference rate, the fee, and the final customer rate.

## Example

**Request:**
```
GET /api/mxn-usd?fee=0.01
```

**Response:**
```json
{
  "reference": {
    "rate": 18.754,
    "date": "2025-07-02",
    "source": "FIX",
    "provider": "Banxico",
    "note": "The FIX rate is Banxico's official reference for USD/MXN."
  },
  "fee": 0.01,
  "customer_rate": 18.94154,
  "explanation": "customer_rate = reference_rate * (1 + fee)"
}
```

## Quick Start

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Vercel CLI](https://vercel.com/download)
- A [Vercel account](https://vercel.com/signup)
- A Banxico SIE API token ([get yours here](https://www.banxico.org.mx/SieAPIRest/service/v1/token))

### 2. Setup

```bash
git clone https://github.com/your-org/banxico-fix-rate-api.git
cd banxico-fix-rate-api
npm install
```

Create a `tsconfig.json` if it doesn’t exist:

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

### 3. Add Your Banxico Token

Set your Banxico API token as an environment variable in Vercel or `.env` file:
```
BANXICO_TOKEN=your_banxico_token_here
```

### 4. Create the API Endpoint

Create `api/mxn-usd.ts`:

```typescript
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
        explanation: "customer_rate = reference_rate * (1 + fee)"
      });
    } else {
      res.status(502).json({ error: "Could not parse FIX rate from Banxico" });
    }
  } catch (error) {
    console.error("Banxico API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
```

## Deploy to Vercel

```bash
vercel login
vercel
```

Follow the prompts to link or create a new project.

## Usage

- **GET `/api/mxn-usd`** – Returns the latest Banxico FIX rate.
- **GET `/api/mxn-usd?fee=0.01`** – Returns the FIX rate plus a 1% markup.

## How to Set a Competitive Fee

- **Fintechs:** 0.3%–1% is highly competitive.
- **Traditional banks:** 1.5%–3% is common.
- **Always disclose your markup for transparency.**

## Troubleshooting

- Ensure your Banxico token is valid and set as an environment variable.
- If you get a 502 or 500 error, check the Banxico API status or your token.
- Vercel automatically detects and compiles TypeScript serverless functions.

## License

© ChipiPay 2025. All rights reserved.

**banxico-fix-rate-api** is committed to transparency, fairness, and compliance.  
For more details, visit [docs.chipipay.com](https://docs.chipipay.com) or contact our support team.
