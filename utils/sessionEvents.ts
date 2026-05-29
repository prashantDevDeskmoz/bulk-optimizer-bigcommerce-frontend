export const SESSION_READY_EVENT = "bulk-optimizer:session-ready";

export function dispatchSessionReady(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SESSION_READY_EVENT));
}
