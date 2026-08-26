// Domain types shared across server + client.

export type RoundStatus = "draft" | "open" | "closed" | "settled";

export interface Profile {
  id: string; // = auth.users.id
  email: string;
  display_name: string | null;
  is_admin: boolean;
  banned: boolean;
  created_at: string;
}

export interface Round {
  id: string;
  name: string;
  status: RoundStatus;
  threshold_pct: number; // electoral threshold, e.g. 4
  base_bet: number; // 50
  double_cost: number; // 50
  sniper_cost: number; // 20
  passfail_cost: number; // 30
  gold_first_pct: number; // 0.75
  gold_second_pct: number; // 0.25
  sniper_first_pct: number; // 0.75
  sniper_second_pct: number; // 0.25
  paybox_url: string | null;
  closes_at: string | null; // ISO — auto-close time ("המועד הקובע")
  created_at: string;
}

export interface Party {
  id: string;
  round_id: string;
  name: string; // full name incl. leader
  nickname: string; // short display name
  display_order: number;
  is_swing: boolean; // מתנדנדת — participates in "עוברת או לא"
  bloc: BlocKey | null; // political bloc for the live bloc meter
  actual_seats: number | null; // filled after election
  actual_passed: boolean | null; // for swing parties
}

export type BlocKey = "coalition" | "change" | "arab";

export const BLOCS: { key: BlocKey; label: string; color: string }[] = [
  { key: "coalition", label: "הקואליציה", color: "#1e40f5" },
  { key: "change", label: "גוש השינוי", color: "#0ea5e9" },
  { key: "arab", label: "המפלגות הערביות", color: "#10b981" },
];

export interface Bid {
  id: string;
  round_id: string;
  user_id: string;
  nickname: string;
  email: string;
  is_double: boolean;
  has_sniper: boolean;
  has_passfail: boolean;
  amount_due: number; // computed total to pay
  paid: boolean;
  paid_at: string | null;
  frozen: boolean; // 1–3 seat rule (rule 3.1.4)
  created_at: string;
  updated_at: string;
}

export interface BidSeat {
  bid_id: string;
  party_id: string;
  seats: number;
}

export interface BidPassfail {
  bid_id: string;
  party_id: string;
  predicted_pass: boolean;
}
