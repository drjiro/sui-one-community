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
  const MIST_PER_SUI = 1_000_000_000;

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
    if (!wallet) return await handleConnect();

    const tx = makeBuyMembershipTx();
    const result = await executeTx(wallet.wallet, tx);
    console.log("BUY RESULT:", result);

    await loadDao();
  }

  // -------------------------
  // Create Proposal
  // -------------------------
  async function handleCreateProposal() {
    if (!wallet) return await handleConnect();

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
    if (!wallet) return await handleConnect();

    const tx = makeVoteTx(id, yes);
    const result = await executeTx(wallet.wallet, tx);
    console.log("VOTE RESULT:", result);

    await loadDao();
  }

  // -------------------------
  // Render
  // -------------------------
  if (!dao)
    return (
      <div style={styles.loading}>
        Loading Sui x ONE Community DAO…
      </div>
    );

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>SUI × ONE CHAMPIONSHIP<br/>FAN COMMUNITY DAO</h1>

      {/* Wallet */}
      <button style={styles.walletBtn} onClick={handleConnect}>
        {wallet ? `CONNECTED: ${wallet.account.address}` : "CONNECT WALLET"}
      </button>

      {/* NFT Section */}
      <h2 style={styles.sectionTitle}>YOUR NFT COLLECTION</h2>

      {nfts.length === 0 && <p style={styles.emptyText}>No NFTs yet.</p>}

      <div style={styles.nftGrid}>
        {nfts.map((n) => (
          <div key={n.id} style={styles.card}>
            <img
              src={n.imageUrl}
              alt="NFT"
              style={styles.cardImg}
            />
            <div style={styles.cardText}>ID: {n.id}</div>
            <div style={styles.cardSub}>
              {n.type.includes("Membership")
                ? "Membership NFT"
                : "Event NFT"}
            </div>
          </div>
        ))}
      </div>

      {/* Membership */}
      <h2 style={styles.sectionTitle}>MEMBERSHIP</h2>
      <div style={styles.infoBox}>
        <p>Price: <b>{dao.membershipPrice / MIST_PER_SUI} </b> SUI</p>
        <p>Remaining: <b>{dao.maxMemberships - dao.soldMemberships}</b></p>
        <p>Sold: {dao.soldMemberships} / {dao.maxMemberships}</p>
      </div>

      <button style={styles.actionBtn} onClick={handleBuy}>
        BUY MEMBERSHIP
      </button>

      {/* Proposals */}
      <h2 style={styles.sectionTitle}>PROPOSALS</h2>

      <button style={styles.actionBtn} onClick={handleCreateProposal}>
        CREATE PROPOSAL
      </button>

      {dao.proposals.map((p: Proposal) => (
        <div key={p.id} style={styles.proposalCard}>
          <h3 style={styles.proposalTitle}>
            #{p.id} {p.title}
          </h3>
          <p>{p.description}</p>
          <p>Event URI: {p.eventUri}</p>
          <p>Price: <b>{p.eventPrice / MIST_PER_SUI} </b>SUI</p>
          <p>YES: {p.yesVotes} / NO: {p.noVotes}</p>

          <button style={styles.voteYes} onClick={() => handleVote(p.id, true)}>
            VOTE YES
          </button>
          <button style={styles.voteNo} onClick={() => handleVote(p.id, false)}>
            VOTE NO
          </button>
        </div>
      ))}
    </div>
  );
}

// =====================
// MMA UI STYLES
// =====================
const styles: Record<string, any> = {
  page: {
    padding: 20,
    background: "#0d0d0d",
    minHeight: "100vh",
    color: "#eee",
    fontFamily: "Impact, Arial Black, sans-serif",
  },

  loading: {
    color: "white",
    padding: 40,
    fontSize: 28,
  },

  title: {
    fontSize: 36,
    color: "#ff0033",
    textAlign: "center",
    fontWeight: "900",
    textShadow: "0 0 10px #ff0022",
    marginBottom: 20,
  },

  walletBtn: {
    padding: "12px 20px",
    background: "#111",
    border: "2px solid #ff0033",
    color: "#ff0033",
    fontSize: 18,
    cursor: "pointer",
    borderRadius: 6,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 28,
    marginTop: 30,
    color: "#ff0033",
    borderLeft: "6px solid #ff0033",
    paddingLeft: 10,
  },

  emptyText: { color: "#888" },

  nftGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 20,
  },

  card: {
    background: "#1b1b1b",
    borderRadius: 12,
    width: 160,
    padding: 10,
    border: "2px solid #333",
    boxShadow: "0 0 12px #000 inset",
  },

  cardImg: {
    width: "100%",
    borderRadius: 8,
  },

  cardText: {
    marginTop: 6,
    fontWeight: "bold",
  },

  cardSub: { fontSize: 12, color: "#bbb" },

  infoBox: {
    background: "#1a1a1a",
    padding: 15,
    borderRadius: 8,
    border: "1px solid #333",
    marginBottom: 15,
  },

  actionBtn: {
    padding: "14px 22px",
    fontSize: 20,
    background: "#ff0033",
    border: "none",
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: 20,
    color: "white",
  },

  proposalCard: {
    background: "#111",
    borderLeft: "6px solid #ff0033",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },

  proposalTitle: {
    fontWeight: "bold",
    color: "#ff0033",
  },

  voteYes: {
    background: "#00cc44",
    padding: "10px 16px",
    border: "none",
    borderRadius: 6,
    marginRight: 10,
    fontWeight: "bold",
    cursor: "pointer",
  },

  voteNo: {
    background: "#cc0000",
    padding: "10px 16px",
    border: "none",
    borderRadius: 6,
    fontWeight: "bold",
    cursor: "pointer",
  },
};