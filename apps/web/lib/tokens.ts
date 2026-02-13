export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  isNative?: boolean;
}

// Polygon mainnet tokens
export const POLYGON_TOKENS: Token[] = [
  {
    address: "0x0000000000000000000000000000000000000000",
    symbol: "POL",
    name: "Polygon",
    decimals: 18,
    isNative: true,
  },
  {
    address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
  },
  {
    address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
  },
  {
    address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
  },
  {
    address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
  },
  {
    address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    symbol: "WPOL",
    name: "Wrapped POL",
    decimals: 18,
  },
];

// WMATIC/WPOL address for shield operations on native token
export const WPOL_ADDRESS = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";

export function getTokenByAddress(address: string): Token | undefined {
  return POLYGON_TOKENS.find(
    (t) => t.address.toLowerCase() === address.toLowerCase(),
  );
}

export function getTokenBySymbol(symbol: string): Token | undefined {
  return POLYGON_TOKENS.find(
    (t) => t.symbol.toLowerCase() === symbol.toLowerCase(),
  );
}

export function formatTokenAmount(amount: bigint, decimals: number): string {
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;
  const decimal = remainder.toString().padStart(decimals, "0").slice(0, 4);
  return `${whole}.${decimal}`.replace(/\.?0+$/, "") || "0";
}

export function parseTokenAmount(amount: string, decimals: number): bigint {
  const [whole = "0", frac = ""] = amount.split(".");
  const paddedFrac = frac.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole + paddedFrac);
}
