import type { Timestamp } from "firebase/firestore";

import type { TerminologyLabels } from "./community";

export type SocietyStatus = "active" | "trial" | "suspended" | "archived";

export interface Society {
  id: string;
  name: string;
  code?: string;
  city?: string;
  state?: string;
  status: SocietyStatus;
  planId?: string;
  billingStatus?: "trial" | "active" | "past_due" | "cancelled";
  terminologyLabels?: TerminologyLabels;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
