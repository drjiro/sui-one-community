// src/App.tsx
import { useEffect, useState } from "react";
import { fetchDaoState, DaoState, Proposal } from "./query";

import { connectWallet, executeTx, ConnectedWallet } from "./wallet";

import {
  makeBuyMembershipTx,
  makeCreateProposalTx,
  makeVoteTx,
} from "./dao";
import { fetchOwnedNFTs, NFTItem } from "./nft";

export default function App() {
  const [dao, setDao] = useState<DaoState | null>(null);
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [nfts, setNfts] = useState<NFTItem[]>([]);

  // -------------------------
  // DAO Load
  // -------------------------
  async function loadDao() {
    const state = await fetchDaoState();
    setDao(state);
  }

  // -------------------------
  // DAO NFTs
  // -------------------------
  const loadNFTs = async (addr: string) => {
    const list = await fetchOwnedNFTs(addr);
    setNfts(list);
  };

  // -------------------------
  // Connect Wallet
  // -------------------------
  const handleConnect = async () => {
    try {
      const w = await connectWallet();
      setWallet(w);
      console.log("Connected wallet:", w.account.address);

      await loadNFTs(w.account.address);
    } catch (err) {
      console.error("Connect error:", err);
    }
  };
 
  useEffect(() => {
    loadDao();
  }, []);

  // -------------------------
  // Buy Membership
  // -------------------------
  async function handleBuy() {
    if (!wallet) {
      await handleConnect();
      return;
    }

    const tx = makeBuyMembershipTx();
    const result = await executeTx(wallet.wallet, tx);
    console.log("BUY RESULT:", result);

    await loadDao();
  }

  // -------------------------
  // Create Proposal
  // -------------------------
  async function handleCreateProposal() {
    if (!wallet) {
      await handleConnect();
      return;
    }

    const title = prompt("Event title?") ?? "";
    const description = prompt("Event description?") ?? "";
    const uri = prompt("Event image URI?") ?? "";
    const priceStr = prompt("Event NFT price (in MIST)?", "10000000");

    const price = Number(priceStr ?? "0");

    const tx = makeCreateProposalTx(title, description, uri, price);
    const result = await executeTx(wallet.wallet, tx);
    console.log("PROPOSAL RESULT:", result);

    await loadDao();
  }

  // -------------------------
  // Vote
  // -------------------------
  async function handleVote(id: number, yes: boolean) {
    if (!wallet) {
      await handleConnect();
      return;
    }

    const tx = makeVoteTx(id, yes);
    const result = await executeTx(wallet.wallet, tx);
    console.log("VOTE RESULT:", result);

//    await Dao();
  }

  // -------------------------
  // Init
  // -------------------------
  useEffect(() => {
    loadDao();
  }, []);

  // -------------------------
  // Render
  // -------------------------
  if (!dao) return <div>Loading SuixOne Championship Fan DAO…</div>;

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Sui x One championship Fan Community DAO</h1>

      <button onClick={handleConnect}>
        {wallet ? `Connected: ${wallet.account.address}` : "Connect Wallet"}
      </button>
      <hr />

      <h2>Your NFTs</h2>
      {nfts.length === 0 && <p>No NFTs yet.</p>}

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {nfts.map((n) => (
          <div key={n.id} style={{ width: 150 }}>
            <img
              src={n.imageUrl}
              alt="NFT"
              style={{ width: "100%", borderRadius: "8px" }}
            />
            <div>ID: {n.id}</div>
            <div>{n.type.includes("Membership") ? "Membership NFT" : "Event NFT"}</div>
          </div>
        ))}
      </div>
      <hr />
      <h2>Membership</h2>
      <p>Price: {dao.membershipPrice} MIST</p>
      <p>
        Sold: {dao.soldMemberships} / {dao.maxMemberships}
      </p>

      <button onClick={handleBuy}>Buy Membership</button>

      <hr />
      <h2>Proposals</h2>
      <button onClick={handleCreateProposal}>Create Proposal</button>

      {dao.proposals.map((p: Proposal) => (
        <div
          key={p.id}
          style={{
            border: "1px solid #ccc",
            marginTop: 10,
            padding: 10,
            borderRadius: 6,
          }}
        >
          <h3>
            #{p.id} {p.title}
          </h3>
          <p>{p.description}</p>
          <p>Event URI: {p.eventUri}</p>
          <p>Price: {p.eventPrice}</p>
          <p>YES: {p.yesVotes} / NO: {p.noVotes}</p>

          <p>
            Executed: {p.executed ? "✔" : "✘"} /
            Player Approved: {p.approvedByPlayer ? "✔" : "✘"}
          </p>

          <button onClick={() => handleVote(p.id, true)}>Vote YES</button>
          <button onClick={() => handleVote(p.id, false)}>Vote NO</button>
        </div>
      ))}
    </div>
  );
}