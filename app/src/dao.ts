// src/dao.ts
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, DAO_ID, DAO_INITIAL_SHARED_VERSION } from "./sui";

const SHARED_DAO = {
  objectId: DAO_ID,
  initialSharedVersion: parseInt(DAO_INITIAL_SHARED_VERSION, 10),
  mutable: true,
};
/**
 * Buy Membership
 */
export function makeBuyMembershipTx() {
  const tx = new Transaction();

  // price: move 仕様に従う（Coin<SUI> を tx.gas から切り出し）
  const price = 100000000n; // 0.1 SUI (例)
  const payment = tx.splitCoins(tx.gas, [price]);

  tx.moveCall({
    target: `${PACKAGE_ID}::fan_dao::buy_membership`,
    arguments: [
      tx.sharedObjectRef(SHARED_DAO),
      payment,
    ],
  });

  return tx;
}

/**
 * Create Proposal
 */
export function makeCreateProposalTx(
  title: string,
  description: string,
  uri: string,
  price: number,
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::fan_dao::new_event_proposal`,
    arguments: [
      tx.sharedObjectRef(SHARED_DAO),
      tx.pure.u64(0), // <-- デモ：MembershipNFT チェック無効のためダミー
      tx.pure.string(title),
      tx.pure.string(description),
      tx.pure.string(uri),
      tx.pure.u64(price),
    ],
  });

  return tx;
}

/**
 * Vote
 */
export function makeVoteTx(id: number, yes: boolean) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::fan_dao::vote`,
    arguments: [
      tx.sharedObjectRef(SHARED_DAO),
      tx.pure.u64(0), // <-- デモ: membership 省略
      tx.pure.u64(id),
      tx.pure.bool(yes),
    ],
  });

  return tx;
}