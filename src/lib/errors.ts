/**
 * Pick the error message to send to the client. In development we surface the
 * real message to aid debugging; in production we hide internal details behind
 * a generic fallback so we never leak stack/internal info to users.
 *
 * Always log the real error server-side separately — this only decides what the
 * client sees.
 */
export function clientErrorMessage(
  error: unknown,
  fallback: string,
  opts: { isProduction?: boolean } = {},
): string {
  const isProduction =
    opts.isProduction ?? process.env.NODE_ENV === "production";
  if (isProduction) return fallback;
  return error instanceof Error ? error.message : fallback;
}
