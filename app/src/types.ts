// src/types.ts

export interface MoveFieldWrapper<T> {
  fields: T;
}

export interface ProposalFields {
  id: string;
  title: string;
  event_uri: string;
  yes: string;    // Sui returns numbers as string sometimes
  no: string;
  executed: boolean;
  approved_by_player: boolean;
}

export type ProposalWrapped = MoveFieldWrapper<ProposalFields>;

export interface DaoFields {
  proposals: ProposalWrapped[];
}