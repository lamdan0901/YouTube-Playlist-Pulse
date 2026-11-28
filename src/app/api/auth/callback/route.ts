import { NextRequest } from "next/server";
import {
  appOrigin, authJson, authRedirect, cookieName, encryptRefreshToken, googleClient,
  googleOAuth, sameState, sessionKey, setAuthCookie, validOAuthNonce, youtubeScope,
} from "../oauth";

const sessionLifetime = 30 * 24 * 60 * 60;

export async function GET(request: NextRequest) {
  let origin: string;
  try {
    origin = appOrigin(request);
  } catch {
    return authJson({ error: "Google sign-in is unavailable. Check the app’s OAuth configuration." }, 500);
  }

  const params = request.nextUrl.searchParams;
  const [state, verifier] = request.cookies.get(cookieName(origin, "state"))?.value.split(".") ?? [];
  if (!sameState(state, params.get("state")) || !validOAuthNonce(verifier)) {
    return authRedirect(origin, "invalid");
  }

  const finish = (status?: string) => {
    const response = authRedirect(origin, status);
    setAuthCookie(response, origin, "state", "", 0);
    return response;
  };

  const error = params.get("error");
  if (error) return finish(error === "access_denied" ? "cancelled" : "failed");
  const code = params.get("code");
  if (!code) return finish("invalid");

  try {
    const key = sessionKey();
    const upstream = await googleOAuth("token", {
      ...googleClient(),
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: origin,
    });
    if (!upstream.ok) return finish("failed");
    const data = await upstream.json();
    if (typeof data.scope !== "string" || !data.scope.split(" ").includes(youtubeScope)) {
      return finish("permission");
    }
    if (typeof data.refresh_token !== "string" || !data.refresh_token) return finish("consent_required");

    const response = finish();
    const expiresIn = data.refresh_token_expires_in;
    const maxAge = Number.isSafeInteger(expiresIn) && expiresIn > 0
      ? Math.min(expiresIn, sessionLifetime)
      : sessionLifetime;
    setAuthCookie(response, origin, "session", encryptRefreshToken(data.refresh_token, maxAge, key), maxAge);
    return response;
  } catch {
    return finish("failed");
  }
}
