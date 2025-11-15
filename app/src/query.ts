// src/query.ts
import { client, DAO_ID } from "./sui";
import type { SuiObjectResponse } from "@mysten/sui/client";

export interface Proposal {
  id: number;
  title: string;
  description: string;
  eventUri: string;
  eventPrice: number;
  yesVotes: number;
  noVotes: number;
  executed: boolean;
  approvedByPlayer: boolean;
  saleOpen: boolean;
}

export interface DaoState {
  membershipPrice: number;
  maxMemberships: number;
  soldMemberships: number;
  yesThreshold: number;
  treasury: number;
  proposals: Proposal[];
}

interface RawProposalFields {
  id: string | number;
  title: string;
  description: string;
  event_uri: string;
  event_price: string | number;
  yes_votes: string | number;
  no_votes: string | number;
  executed: boolean;
  approved_by_player: boolean;
  sale_open: boolean;
}

interface RawProposal {
  fields: RawProposalFields;
}

export async function fetchDaoState(): Promise<DaoState> {
  const obj: SuiObjectResponse = await client.getObject({
    id: DAO_ID,
    options: { showContent: true },
  });

  if (!obj.data || obj.data.content?.dataType !== "moveObject") {
    throw new Error("Invalid FanDao object");
  }

  const fields = obj.data.content.fields as Record<string, unknown>;

  const rawProposals = (fields.proposals as unknown as RawProposal[]) ?? [];

  const proposals: Proposal[] = rawProposals.map((rp) => {
    const p = rp.fields;
    return {
      id: Number(p.id),
      title: p.title,
      description: p.description,
      eventUri: p.event_uri,
      eventPrice: Number(p.event_price),
      yesVotes: Number(p.yes_votes),
      noVotes: Number(p.no_votes),
      executed: Boolean(p.executed),
      approvedByPlayer: Boolean(p.approved_by_player),
      saleOpen: Boolean(p.sale_open),
    };
  });

  return {
    membershipPrice: Number(fields.membership_price),
    maxMemberships: Number(fields.max_memberships),
    soldMemberships: Number(fields.sold_memberships),
    yesThreshold: Number(fields.yes_threshold),
    treasury: Number(fields.treasury),
    proposals,
  };
}