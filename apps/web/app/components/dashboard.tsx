"use client";

import { useWalletStore } from "../store";
import { useBalances } from "../hooks/use-balances";

export function Dashboard() {
  const smartWalletAddress = useWalletStore((s) => s.smartWalletAddress);
  const publicBalances = useWalletStore((s) => s.publicBalances);
  const privateBalances = useWalletStore((s) => s.privateBalances);

  useBalances();

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const totalPublic = publicBalances.reduce(
    (sum, b) => sum + parseFloat(b.usdValue || "0"),
    0,
  );
  const totalPrivate = privateBalances.reduce(
    (sum, b) => sum + parseFloat(b.usdValue || "0"),
    0,
  );

  return (
    <div className="flex flex-col min-h-dvh px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Veil</h2>
          <button
            onClick={() => navigator.clipboard.writeText(smartWalletAddress || "")}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            {smartWalletAddress ? truncateAddress(smartWalletAddress) : "---"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-neutral-500">Polygon</span>
        </div>
      </div>

      {/* Balance Card */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 mb-6">
        <div className="mb-4">
          <p className="text-xs text-neutral-500 mb-1">Total Balance</p>
          <p className="text-3xl font-semibold tracking-tight">
            ${(totalPublic + totalPrivate).toFixed(2)}
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div>
            <p className="text-neutral-500 text-xs">Public</p>
            <p className="text-neutral-200">${totalPublic.toFixed(2)}</p>
          </div>
          <div className="border-l border-neutral-800 pl-4">
            <p className="text-neutral-500 text-xs">Private</p>
            <p className="text-indigo-400">${totalPrivate.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-5 gap-2 mb-8">
        <ActionButton label="Shield" icon="↓" />
        <ActionButton label="Send" icon="↑" />
        <ActionButton label="Receive" icon="↙" />
        <ActionButton label="Swap" icon="⇄" />
        <ActionButton label="Unshield" icon="↗" />
      </div>

      {/* Token List */}
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-3">Assets</h3>
        {publicBalances.length === 0 && privateBalances.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-600 text-sm">No assets yet</p>
            <p className="text-neutral-700 text-xs mt-1">
              Deposit tokens to get started
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {privateBalances.map((token) => (
              <TokenRow key={`priv-${token.address}`} token={token} isPrivate />
            ))}
            {publicBalances.map((token) => (
              <TokenRow key={`pub-${token.address}`} token={token} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({ label, icon }: { label: string; icon: string }) {
  const setScreen = useWalletStore((s) => s.setScreen);

  const screenMap: Record<string, string> = {
    Shield: "shield",
    Send: "send",
    Receive: "receive",
    Swap: "swap",
    Unshield: "unshield",
  };

  return (
    <button
      onClick={() => setScreen(screenMap[label] as Parameters<typeof setScreen>[0])}
      className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-xs text-neutral-400">{label}</span>
    </button>
  );
}

function TokenRow({
  token,
  isPrivate,
}: {
  token: { symbol: string; name: string; balance: string; usdValue: string };
  isPrivate?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-neutral-900/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-medium">
          {token.symbol.slice(0, 2)}
        </div>
        <div>
          <p className="text-sm font-medium">{token.symbol}</p>
          <p className="text-xs text-neutral-500">{token.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm ${isPrivate ? "text-indigo-400" : ""}`}>
          {token.balance}
        </p>
        <p className="text-xs text-neutral-500">${token.usdValue}</p>
      </div>
    </div>
  );
}
