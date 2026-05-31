# Sahavas Onboarding Portal

Production-ready React/Vite workspace that integrates the Sahavas governance demo and the apartment onboarding workflow described in `Sahavas_Apartment_Onboarding_SOP_1.docx`.

## What Is Included

- Society, owner, tenant, family, KYC, staff, vendor, domestic help, move-in, move-out, and evidence vault surfaces.
- Sequential gates aligned to the SOP's "account does not equal access" principle.
- Local state persistence for safe demo and UAT sessions.
- Real browser file inputs for document metadata capture.
- Keyboard-accessible cards, gate rows, and navigation controls.
- Build, preview, and lint scripts.
- One combined root app at `/` with tabs for the Governance Platform and Onboarding Portal.
- Static Sahavas governance demo imported from `sahavas_5.html`, still available directly at `/sahavas_5.html`.
- Original SOP document served from `/docs/Sahavas_Apartment_Onboarding_SOP_1.docx` and linked in the app header.

## Local Commands

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

## Production Integration Notes

- Replace simulated OTP, KYC, eSign, quorum approval, payment recording, and Evidence Vault writes with authenticated APIs.
- Persist documents to a private object store and store only document metadata plus hashes in the app database.
- Enforce every gate server-side; the client-side checks are UX guardrails, not the source of truth.
- Add route-level auth once the backend is connected, using `society_id`, `role`, and `flat_id` as the permission triple.
- Configure CSP, audit logging, DPDP consent capture, and retention-policy jobs before launch.
