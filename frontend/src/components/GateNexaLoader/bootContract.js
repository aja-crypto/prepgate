/**
 * bootContract.js
 *
 * This is the CONTRACT between your real application and <GateNexaLoader>.
 * It contains no side effects, no network calls, and no auth logic — just
 * shape definitions and one pure helper function. Your app is responsible
 * for producing real values that satisfy this contract; the loader only
 * renders what it's given.
 *
 * ---------------------------------------------------------------------
 * THE CONTRACT
 * ---------------------------------------------------------------------
 *
 *   progress   number   0-100. Must reflect real completed work.
 *   status     string?  Human-readable current step, e.g. "Restoring session".
 *                       Optional — if omitted, the loader derives a generic
 *                       label from `progress` using EXAMPLE_BOOT_STAGES below.
 *   isReady    boolean? True when the app is genuinely safe to show. If you
 *                       don't pass this, the loader treats progress >= 100
 *                       as the readiness signal instead.
 *   error      string | Error | null   A critical boot failure. When set,
 *                       the loader shows an error state instead of progress
 *                       and (if provided) an onRetry action.
 *
 * onComplete()  Called exactly once, after the exit fade finishes. Mount
 *               your real app here.
 * onRetry()     Called when the user presses Retry in the error state.
 *               Your app should re-run whatever boot step failed.
 * onTimeout()   Called at most once if `timeoutMs` elapses before the app
 *               signals readiness. This does NOT make the loader exit or
 *               pretend to be ready — it's just a hook so your app can
 *               decide what to do (e.g. surface an error, offer a retry,
 *               or log the stall). Leave `timeoutMs` unset to disable.
 *
 * ---------------------------------------------------------------------
 * WHAT THIS FILE DELIBERATELY DOES NOT DO
 * ---------------------------------------------------------------------
 * - It does not call any endpoint.
 * - It does not know about your AuthContext, tokens, or session shape.
 * - It does not decide what "ready" means for GateNexa — your app does.
 *
 * EXAMPLE_BOOT_STAGES below is illustrative only. It exists so the loader
 * has *some* readable label to show when the parent hasn't supplied a
 * `status` string for a given progress value (e.g. during early wiring,
 * or a route that doesn't bother with granular status text). Replace or
 * delete it freely — the real milestones belong to your app's boot logic,
 * not to this file.
 */

export const EXAMPLE_BOOT_STAGES = [
  { id: 'init', min: 0, max: 10, label: 'Initializing GateNexa' },
  { id: 'session', min: 10, max: 30, label: 'Restoring session' },
  { id: 'workspace', min: 30, max: 50, label: 'Preparing workspace' },
  { id: 'data', min: 50, max: 70, label: 'Loading application data' },
  { id: 'services', min: 70, max: 85, label: 'Initializing core services' },
  { id: 'finalize', min: 85, max: 95, label: 'Finalizing GateNexa' },
  { id: 'ready', min: 95, max: 100, label: 'Ready' },
];

/**
 * Pure function: given a progress number, return the example stage label.
 * Never call this to invent progress — only to label progress your app
 * already computed from real work.
 */
export function getExampleStageLabel(progress, stages = EXAMPLE_BOOT_STAGES) {
  const p = Math.max(0, Math.min(100, progress ?? 0));
  const stage = stages.find((s) => p >= s.min && p <= s.max) ?? stages[0];
  return stage.label;
}

/**
 * Normalizes an `error` prop (string | Error | null | undefined) into a
 * display-safe message. Does not classify, retry, or log — that's your
 * app's error-handling responsibility.
 */
export function normalizeBootError(error) {
  if (!error) return null;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message || 'Something went wrong while starting GateNexa.';
  return 'Something went wrong while starting GateNexa.';
}
