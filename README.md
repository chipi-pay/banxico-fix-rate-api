# Chipi SDK – MXN/USD Mid-Market Exchange Rate API

Welcome to the Chipi SDK documentation for our **MXN/USD exchange rate serverless function**. This service provides developers with a fair, transparent, and compliant way to fetch the real-time mid-market exchange rate for Mexican Peso (MXN) to US Dollar (USD).

---

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

---

## Quick Start: Deploying the Chipi Exchange Rate API on Vercel (TypeScript)

This guide will help you set up and deploy the Chipi MXN/USD exchange rate API using Vercel serverless functions with TypeScript.

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Vercel CLI](https://vercel.com/download) installed globally (`npm i -g vercel`)
- A [Vercel account](https://vercel.com/signup)

### 2. Project Setup

#### Create a new project folder

```
mkdir chipi-exchange-rate
cd chipi-exchange-rate
```

#### Initialize a Node.js project

```
npm init -y
```

#### Install TypeScript and Vercel types

```
npm install --save-dev typescript @types/node @vercel/node
```

#### Create a `tsconfig.json` file

```
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

#### File: `api/mxn-usd.ts`

```
import { VercelRequest, VercelResponse } from '@vercel/node';

// Helper to fetch the mid-market rate from Wise
async function fetchMidMarketRate(): Promise {
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
```

- This endpoint scrapes the live mid-market MXN/USD rate from Wise, ensuring you get the most accurate and fair rate available.
- For production, consider switching to an official API if available.

### 4. Deploy to Vercel

#### Log in to Vercel (if needed)

```
vercel login
```

#### Deploy your project

```
vercel
```

- Follow the prompts to link or create a new project.
- After deployment, your endpoint will be available at:
  ```
  https://.vercel.app/api/mxn-usd
  ```

---

## Usage

**GET** `/api/mxn-usd`

**Response:**

```
{
  "mxn_usd": 0.0589,
  "source": "mid-market",
  "provider": "Wise"
}
```

- `mxn_usd`: The current mid-market exchange rate from MXN to USD.
- `source`: Indicates the type of rate (always "mid-market" for this endpoint).
- `provider`: The data provider (currently Wise).

---

## Troubleshooting

- Ensure your `api/mxn-usd.ts` file is in the correct directory.
- Vercel automatically detects and compiles TypeScript serverless functions—no extra build steps are needed[3][4][5].
- If you need to customize your build, add or update your `vercel.json` configuration.

---

## License

© ChipiPay 2025. All rights reserved.

---

**Chipi SDK** is committed to fairness, transparency, and compliance.  
For more details, visit [docs.chipipay.com](https://docs.chipipay.com) or contact our support team.
