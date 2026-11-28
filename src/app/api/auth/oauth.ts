import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const youtubeScope = "https://www.googleapis.com/auth/youtube";
export const scopes = [`${youtubeScope}.readonly`, youtubeScope].join(" ");
const oauthEndpoint = "https://oauth2.googleapis.com";
const authHeaders = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
const noncePattern = /^[A-Za-z0-9_-]{43}$/;
const ivLength = 12;
const tagLength = 16;

export function appOrigin(request: NextRequest) {
  const configuredOrigin = process.env.NODE_ENV === "production"
    ? process.env.PRODUCTION_URL
    : undefined;
  if (process.env.NODE_ENV === "production" && !configuredOrigin) {
    throw new Error("PRODUCTION_URL is required");
  }
  const url = new URL(configuredOrigin ?? request.nextUrl.origin);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && loopback))) {
    throw new Error("Use an HTTPS origin for PRODUCTION_URL");
  }
  return url.origin;
}

export function cookieName(origin: string, kind: "state" | "session") {
  const prefix = origin.startsWith("https:") ? "__Host-" : "";
  return `${prefix}playlist-${kind}`;
}

export function setAuthCookie(
  response: NextResponse, origin: string, kind: "state" | "session", value: string, maxAge: number,
) {
  response.cookies.set(cookieName(origin, kind), value, {
    httpOnly: true,
    secure: origin.startsWith("https:"),
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export function validOAuthNonce(value: string | null | undefined): value is string {
  return typeof value === "string" && noncePattern.test(value);
}

export function sameState(expected: string | undefined, returned: string | null) {
  return validOAuthNonce(expected) && validOAuthNonce(returned) &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(returned));
}

export function authJson(data: object, status = 200) {
  return NextResponse.json(data, { status, headers: authHeaders });
}

export function authRedirect(origin: string, status?: string) {
  const url = new URL("/", origin);
  if (status) url.searchParams.set("auth", status);
  return NextResponse.redirect(url, { status: 303, headers: authHeaders });
}

export function emptyAuthResponse() {
  return new NextResponse(null, { status: 204, headers: authHeaders });
}

export function authPostOrigin(request: NextRequest) {
  const origin = appOrigin(request);
  return request.headers.get("origin") === origin ? origin : null;
}

export function googleClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth credentials are required");
  return { client_id: clientId, client_secret: clientSecret };
}

export function googleOAuth(path: "token" | "revoke", params: Record<string, string>) {
  return fetch(`${oauthEndpoint}/${path}`, {
    method: "POST",
    body: new URLSearchParams(params),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
}

export function sessionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!validOAuthNonce(secret)) throw new Error("SESSION_SECRET must be a 32-byte base64url value");
  return Buffer.from(secret, "base64url");
}

export function encryptRefreshToken(refreshToken: string, expiresIn: number, key: Buffer) {
  const iv = randomBytes(ivLength);
  const expiresAt = Date.now() + expiresIn * 1000;
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify({ refreshToken, expiresAt }), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

export function readRefreshToken(request: NextRequest, origin: string) {
  const cookie = request.cookies.get(cookieName(origin, "session"))?.value;
  if (!cookie) return null;
  const data = Buffer.from(cookie, "base64url");
  if (data.length <= ivLength + tagLength) return null;

  const decipher = createDecipheriv("aes-256-gcm", sessionKey(), data.subarray(0, ivLength));
  decipher.setAuthTag(data.subarray(ivLength, ivLength + tagLength));
  const plaintext = decipher.update(data.subarray(ivLength + tagLength));
  try {
    const session = JSON.parse(Buffer.concat([plaintext, decipher.final()]).toString("utf8"));
    return typeof session.refreshToken === "string" && session.expiresAt > Date.now()
      ? session.refreshToken
      : null;
  } catch {
    // Authentication failed. The cookie was altered or encrypted with a previous key.
    return null;
  }
}
