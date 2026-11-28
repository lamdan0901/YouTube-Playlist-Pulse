import { NextRequest } from "next/server";
import { authJson, authPostOrigin, emptyAuthResponse, googleOAuth, readRefreshToken, setAuthCookie } from "../oauth";

function clearAuthCookies(origin: string) {
  const response = emptyAuthResponse();
  setAuthCookie(response, origin, "state", "", 0);
  setAuthCookie(response, origin, "session", "", 0);
  return response;
}

export async function DELETE(request: NextRequest) {
  try {
    const origin = authPostOrigin(request);
    if (!origin) return authJson({ error: "Invalid request origin" }, 403);
    return clearAuthCookies(origin);
  } catch {
    return authJson({ error: "Could not sign out. Check the app’s OAuth configuration." }, 500);
  }
}

export async function POST(request: NextRequest) {
  const failure = "Could not revoke YouTube access. Try again or remove Playlist Pulse in your Google Account settings.";
  try {
    const origin = authPostOrigin(request);
    if (!origin) return authJson({ error: "Invalid request origin" }, 403);
    const refreshToken = readRefreshToken(request, origin);
    if (refreshToken) {
      const upstream = await googleOAuth("revoke", { token: refreshToken });
      if (!upstream.ok) {
        const alreadyRevoked = upstream.status === 400 && (await upstream.json()).error === "invalid_token";
        if (!alreadyRevoked) return authJson({ error: failure }, 502);
      }
    }
    return clearAuthCookies(origin);
  } catch {
    return authJson({ error: failure }, 502);
  }
}
