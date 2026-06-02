import { initializeApp } from "firebase-admin/app";

initializeApp();

export { recordAuditEvent } from "./audit/recordAuditEvent";
export {
  createCommunity,
  updateCommunity,
  updateCommunityConfiguration,
} from "./community/manageCommunity";
export { acceptInvite } from "./membership/acceptInvite";
