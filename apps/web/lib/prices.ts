/** CoinGecko price feed for Polygon tokens (no API key needed) */

// CoinGecko IDs for our tokens
const COINGECKO_IDS: Record<string, string> = {
  "0x0000000000000000000000000000000000000000": "matic-network", // POL
  "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359": "usd-coin",
  "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": "tether",
  "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619": "weth",
  "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063": "dai",
  "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270": "wmatic",
};

let priceCache: Record<string, number> = {};
let lastFetch = 0;
const CACHE_TTL = 60_000; // 1 minute

export async function fetchPrices(): Promise<Record<string, number>> {
  const now = Date.now();
  if (now - lastFetch < CACHE_TTL && Object.keys(priceCache).length > 0) {
    return priceCache;
  }

  try {
    const ids = [...new Set(Object.values(COINGECKO_IDS))].join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      { signal: AbortSignal.timeout(5000) },
    );

    if (!res.ok) return priceCache;

    const data = await res.json();
    const newPrices: Record<string, number> = {};

    for (const [address, cgId] of Object.entries(COINGECKO_IDS)) {
      if (data[cgId]?.usd) {
        newPrices[address] = data[cgId].usd;
      }
    }

    priceCache = newPrices;
    lastFetch = now;
    return newPrices;
  } catch {
    return priceCache;
  }
}

export function getUsdValue(
  tokenAddress: string,
  balance: string,
  prices: Record<string, number>,
): string {
  const price = prices[tokenAddress.toLowerCase()];
  if (!price) return "0.00";
  const value = parseFloat(balance) * price;
  if (value < 0.01 && value > 0) return "<0.01";
  return value.toFixed(2);
}
