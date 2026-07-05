export interface Player {
  id: string;
  name: string; // Max 2 characters
}

export type ContractType =
  | 'custom'            // Raw manual entry
  | 'ask_answer'    // Vraag & Antwoord (Prop & Cop)
  | 'troel'             // Troel / Tink
  | 'misery'           // Miserie
  | 'open_misery'      // Open Miserie / Miserie op tafel
  | 'solo'              // Solo (Abondance)
  | 'solo_slim'         // Solo Slim

export interface Round {
  id: string;
  roundNumber: number;
  scores: Record<string, number>; // playerId -> score delta for this round
  totals: Record<string, number>; // playerId -> running total after this round
  contract?: {
    type: ContractType;
    askerId?: string;
    responderId?: string;
    soloPlayerId?: string;
    tricks?: number;
    isSuccess?: boolean;
    miseryWinners?: string[]; // IDs of players who succeeded in misery
    customReason?: string; // Reason for custom/manual score
  };
}

export interface Session {
  id: string;
  date: string;
  players: Player[];
  rounds: Round[];
  isActive: boolean;
}

export interface GameSettings {
  askAndAnswerBase: number;
  askAndAnswerOvertrick: number;
  askAndAnswerAloneBase: number;
  askAndAnswerAloneOvertrick: number;
  troelBase: number;
  troelOvertrick: number;
  troelAloneBase: number;
  troelAloneOvertrick: number;
  miseryPoints: number;
  openMiseryPoints: number;
  soloAbondancePoints: number;
  soloSlimPoints: number;
  askAndAnswerTricksTarget: number;
  askAndAnswerAloneTricksTarget: number;
  troelTricksTarget: number;
}
