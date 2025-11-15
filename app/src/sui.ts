// src/sui.ts
// Basic Sui client & on-chain IDs

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

export const client = new SuiClient({
  url: getFullnodeUrl("devnet"), // devnet fullnode
});

// TODO: replace these with your actual IDs
export const PACKAGE_ID =
  "0x46ab2068de058786c9eeb2b67472863e54aafa6c842714b4f039c7ec41fb02a9";
export const DAO_ID = "0xe04211965c01b49d10c80392abf2be762bbd1c41b4e481c336c1b6004ca9ad47";

// Shared object initial version (from `sui client object DAO_ID`)
export const DAO_INITIAL_SHARED_VERSION = "13";