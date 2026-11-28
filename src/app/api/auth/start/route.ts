import { createHash, randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { authJson, authPostOrigin, googleClient, sessionKey, setAuthCookie, youtubeScope } from "../oauth";

export async function POST(request: NextRequest) {
  try {
    const origin = authPostOrigin(request);
    if (!origin) return authJson({ error: "Invalid request origin" }, 403);
    const accepted = new URLSearchParams(await request.text()).get("accept") === "yes";
    if (!accepted) return authJson({ error: "Accept the Privacy Policy and Terms of Service first." }, 400);

    const { client_id } = googleClient();
    sessionKey();
    const state = randomBytes(32).toString("base64url");
    const verifier = randomBytes(32).toString("base64url");
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams({
      client_id,
      response_type: "code",
      redirect_uri: origin,
      scope: youtubeScope,
      state,
      code_challenge: createHash("sha256").update(verifier).digest("base64url"),
      code_challenge_method: "S256",
      access_type: "offline",
      prompt: "select_account consent",
    }).toString();

    const response = authJson({ url: url.toString() });
    setAuthCookie(response, origin, "state", `${state}.${verifier}`, 600);
    return response;
  } catch {
    return authJson({ error: "Google sign-in is unavailable. Check the app’s OAuth configuration." }, 500);
  }
}
