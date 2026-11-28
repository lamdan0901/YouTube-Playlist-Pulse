import { NextRequest } from "next/server";
import { authJson, authPostOrigin, googleClient, googleOAuth, readRefreshToken } from "../oauth";

export async function POST(request: NextRequest) {
  try {
    const origin = authPostOrigin(request);
    if (!origin) return authJson({ error: "Invalid request origin" }, 403);
    const refreshToken = readRefreshToken(request, origin);
    if (!refreshToken) return authJson({ error: "Sign in to continue" }, 401);

    const upstream = await googleOAuth("token", {
      ...googleClient(),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });
    const data = await upstream.json();
    if (upstream.status === 400 && data.error === "invalid_grant") {
      return authJson({ error: "Sign in again to reconnect YouTube" }, 401);
    }
    if (!upstream.ok || typeof data.access_token !== "string" || !data.access_token ||
        !Number.isSafeInteger(data.expires_in) || data.expires_in <= 0) {
      return authJson({ error: "Could not refresh YouTube access. Try again." }, 502);
    }
    return authJson({ accessToken: data.access_token, expiresIn: data.expires_in });
  } catch {
    return authJson({ error: "Could not refresh YouTube access. Try again." }, 502);
  }
}
