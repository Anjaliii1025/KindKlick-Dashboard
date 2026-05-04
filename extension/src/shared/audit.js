import { KEYS, pushCapped } from "./storage.js";
const AUDIT_CAP = 5000;
export async function audit(action, details = {}) {
  await pushCapped(KEYS.AUDIT, { ts: Date.now(), action, details }, AUDIT_CAP);
}
