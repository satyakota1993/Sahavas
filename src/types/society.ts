import type { Timestamp } from "firebase/firestore";

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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
