import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
}

export function requireAuth(request: CallableRequest<unknown>): AuthenticatedUser {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  return {
    uid: request.auth.uid,
    email:
      typeof request.auth.token.email === "string"
        ? request.auth.token.email
        : undefined,
    name:
      typeof request.auth.token.name === "string"
        ? request.auth.token.name
        : undefined,
  };
}
