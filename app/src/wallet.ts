// src/wallet.ts

import {
  getWallets,
  type WalletWithFeatures,
} from "@mysten/wallet-standard";

import type {
  StandardConnectFeature,
  StandardConnectOutput,
} from "@mysten/wallet-standard";

import type {
  SuiSignAndExecuteTransactionFeature,
  SuiSignAndExecuteTransactionInput,
  SuiSignAndExecuteTransactionOutput,
} from "@mysten/wallet-standard";

import { Transaction } from "@mysten/sui/transactions";


// =============================================================
// 1) Wallet 標準仕様に完全準拠した Feature 型を定義
// =============================================================

type FeatureRecord = Readonly<Record<`${string}:${string}`, unknown>>;

export type SuiCompatibleWallet = WalletWithFeatures<
  FeatureRecord & StandardConnectFeature & SuiSignAndExecuteTransactionFeature
>;

export interface ConnectedWallet {
  wallet: SuiCompatibleWallet;
  account: { address: string };
}


// =============================================================
// 2) ウォレット取得
// =============================================================

export function getAvailableWallets(): readonly WalletWithFeatures<FeatureRecord>[] {
  return getWallets().get() as readonly WalletWithFeatures<FeatureRecord>[];
}


// =============================================================
// 3) Sui ウォレットの判定（type guard）
// =============================================================

function isSuiWallet(
  w: WalletWithFeatures<FeatureRecord>
): w is SuiCompatibleWallet {
  return (
    "standard:connect" in w.features &&
    "sui:signAndExecuteTransaction" in w.features
  );
}

export function getFirstWallet(): SuiCompatibleWallet | null {
  for (const w of getAvailableWallets()) {
    if (isSuiWallet(w)) return w;
  }
  return null;
}


// =============================================================
// 4) connect()
// =============================================================

export async function connectWallet(): Promise<ConnectedWallet> {
  const wallet = getFirstWallet();
  if (!wallet) throw new Error("No Sui-compatible wallet found");

  const connectFeature = wallet.features["standard:connect"];
  const { accounts }: StandardConnectOutput = await connectFeature.connect();

  return { wallet, account: accounts[0] };
}


// =============================================================
// 5) executeTx() 最新 wallet-standard API 対応
// =============================================================

export async function executeTx(
  wallet: SuiCompatibleWallet,
  tx: Transaction
): Promise<SuiSignAndExecuteTransactionOutput> {
  const feature = wallet.features["sui:signAndExecuteTransaction"];

  const input: SuiSignAndExecuteTransactionInput = {
    transaction: tx,
    chain: wallet.chains[0],         // 例: "sui:mainnet"
    account: wallet.accounts[0],     // ← これが必須！
  };

  return feature.signAndExecuteTransaction(input);
}