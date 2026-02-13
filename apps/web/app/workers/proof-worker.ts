/**
 * Web Worker for Railgun ZK proof generation.
 *
 * Uses @veil/core SDK wrappers which handle param formatting.
 * Each proof type receives a typed params object from the UI.
 */

type ProofType = "shield" | "transfer" | "unshield" | "swap";

interface ProofRequest {
  type: ProofType;
  params: Record<string, unknown>;
}

interface ProofProgress {
  type: "progress";
  progress: number; // 0-100
}

interface ProofResult {
  type: "result";
  serializedTransaction: string;
}

interface ProofError {
  type: "error";
  message: string;
}

const onProgress = (progress: number) => {
  const msg: ProofProgress = { type: "progress", progress: Math.round(progress) };
  self.postMessage(msg);
};

self.addEventListener("message", async (event: MessageEvent<ProofRequest>) => {
  const { type, params } = event.data;

  try {
    let result: unknown;

    switch (type) {
      case "shield": {
        const { prepareShield } = await import("@veil/core");
        result = await prepareShield({
          chain: params.chain as "polygon" | "ethereum" | "arbitrum",
          tokenAddress: params.tokenAddress as `0x${string}`,
          amount: BigInt(params.amount as string),
          recipientZkAddress: params.recipientZkAddress as `0zk${string}`,
          onProgress,
        });
        break;
      }

      case "transfer": {
        const { prepareTransfer } = await import("@veil/core");
        result = await prepareTransfer({
          chain: params.chain as "polygon" | "ethereum" | "arbitrum",
          walletId: params.walletId as string,
          tokenAddress: params.tokenAddress as `0x${string}`,
          amount: BigInt(params.amount as string),
          recipientZkAddress: params.recipientZkAddress as `0zk${string}`,
          onProgress,
        });
        break;
      }

      case "unshield": {
        const { prepareUnshield } = await import("@veil/core");
        result = await prepareUnshield({
          chain: params.chain as "polygon" | "ethereum" | "arbitrum",
          walletId: params.walletId as string,
          tokenAddress: params.tokenAddress as `0x${string}`,
          amount: BigInt(params.amount as string),
          destinationAddress: params.destinationAddress as `0x${string}`,
          onProgress,
        });
        break;
      }

      case "swap": {
        const { prepareSwap } = await import("@veil/core");
        result = await prepareSwap({
          chain: params.chain as "polygon" | "ethereum" | "arbitrum",
          walletId: params.walletId as string,
          quote: params.quote as {
            sellToken: `0x${string}`;
            buyToken: `0x${string}`;
            sellAmount: bigint;
            buyAmount: bigint;
            to: `0x${string}`;
            data: string;
            value: bigint;
          },
          recipientZkAddress: params.recipientZkAddress as `0zk${string}`,
          feeRecipient: params.feeRecipient as `0x${string}`,
          feeBasisPoints: (params.feeBasisPoints as number) || 85,
          onProgress,
        });
        break;
      }
    }

    onProgress(100);
    const msg: ProofResult = {
      type: "result",
      serializedTransaction: JSON.stringify(result, (_key, value) =>
        typeof value === "bigint" ? value.toString() : value
      ),
    };
    self.postMessage(msg);
  } catch (error) {
    const msg: ProofError = {
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(msg);
  }
});
