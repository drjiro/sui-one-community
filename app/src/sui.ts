// src/sui.ts
// Basic Sui client & on-chain IDs

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

export const client = new SuiClient({
  url: getFullnodeUrl("devnet"), // devnet fullnode
});

// TODO: replace these with your actual IDs
export const PACKAGE_ID =
  "0xe94404e347fbef68d0690e2670f141b715be2aff182e061f195f1527b5c5eff1";
export const DAO_ID = "0xd48402c3ef10d6392aa9bcc4d8cafd993b0fb8c20c3ae12a151420291ad86f0d";

// Shared object initial version (from `sui client object DAO_ID`)
export const DAO_INITIAL_SHARED_VERSION = "13";