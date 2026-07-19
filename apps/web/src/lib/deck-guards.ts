/**
 * Pre-flight gates for inbound deck URLs and PDF uploads.
 * Blocks wallet/timeout exploits before Firecrawl or storage work.
 */

export const MAX_DECK_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB local upload
export const MAX_DECK_REMOTE_BYTES = 15 * 1024 * 1024; // 15MB remote HEAD gate
export const MAX_DECK_PAGES_HINT = 40; // soft cap documented; PDF page count optional

const PDF_MAGIC = Buffer.from("%PDF-", "ascii");
const MAX_REMOTE_REDIRECTS = 5;
const ALLOWED_DECK_HOST_SUFFIXES = [
  "docs.google.com",
  "drive.google.com",
  "dropbox.com",
  "www.dropbox.com",
  "dl.dropboxusercontent.com",
  "github.com",
  "raw.githubusercontent.com",
  "notion.so",
  "www.notion.so",
  "pitch.com",
  "www.pitch.com",
  "docsend.com",
  "www.docsend.com",
  "vibemarketer.fun",
];

export function assertPdfMagic(buf: Buffer): void {
  if (buf.length < 5 || !buf.subarray(0, 5).equals(PDF_MAGIC)) {
    throw new Error("Deck upload must be a real PDF (missing %PDF- header)");
  }
}

export type RemoteDeckPreflight = {
  ok: boolean;
  contentLength: number | null;
  contentType: string | null;
  error?: string;
};

function parseAllowedDeckUrl(raw: string): URL {
  const url = new URL(raw);
  const hostname = url.hostname.toLowerCase();
  const allowed = ALLOWED_DECK_HOST_SUFFIXES.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`),
  );
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    !allowed
  ) {
    throw new Error(`Deck URL host is not allowed: ${hostname || "invalid"}`);
  }
  return url;
}

/** HEAD check before any scrape/extract of a remote deck URL. */
export async function preflightRemoteDeck(
  deckUrl: string,
): Promise<RemoteDeckPreflight> {
  try {
    let currentUrl = parseAllowedDeckUrl(deckUrl);
    const signal = AbortSignal.timeout(8_000);
    let head: Response | null = null;

    for (let redirects = 0; redirects <= MAX_REMOTE_REDIRECTS; redirects += 1) {
      head = await fetch(currentUrl, {
        method: "HEAD",
        redirect: "manual",
        signal,
      });
      if (head.status < 300 || head.status >= 400) break;

      const location = head.headers.get("location");
      await head.body?.cancel();
      if (!location) throw new Error("Deck URL redirect missing location");
      if (redirects === MAX_REMOTE_REDIRECTS) {
        throw new Error("Deck URL has too many redirects");
      }
      currentUrl = parseAllowedDeckUrl(new URL(location, currentUrl).toString());
      head = null;
    }

    if (!head) throw new Error("Deck URL preflight returned no response");
    const contentType = head.headers.get("content-type");
    const lenRaw = head.headers.get("content-length");
    const contentLength = lenRaw ? parseInt(lenRaw, 10) : null;

    if (
      contentLength != null &&
      Number.isFinite(contentLength) &&
      contentLength > MAX_DECK_REMOTE_BYTES
    ) {
      return {
        ok: false,
        contentLength,
        contentType,
        error: `Deck URL payload too large (${contentLength} bytes; max ${MAX_DECK_REMOTE_BYTES})`,
      };
    }

    // Soft type check — many CDNs omit content-type on HEAD
    if (
      contentType &&
      !/pdf|octet-stream|binary/i.test(contentType) &&
      !/\.pdf(\?|$)/i.test(currentUrl.toString())
    ) {
      return {
        ok: false,
        contentLength,
        contentType,
        error: `Deck URL does not look like a PDF (content-type: ${contentType})`,
      };
    }

    if (!head.ok && head.status !== 405 && head.status !== 403) {
      return {
        ok: false,
        contentLength,
        contentType,
        error: `Deck URL preflight returned HTTP ${head.status}`,
      };
    }

    return { ok: true, contentLength, contentType };
  } catch (e) {
    return {
      ok: false,
      contentLength: null,
      contentType: null,
      error:
        e instanceof Error
          ? `Deck URL preflight failed: ${e.message}`
          : "Deck URL preflight failed",
    };
  }
}
