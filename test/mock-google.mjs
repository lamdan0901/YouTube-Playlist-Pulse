const fetchUpstream = globalThis.fetch;
const refreshToken = "fixture-refresh-token";
let revoked = false;

globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input.url ?? input);
  if (url.origin !== "https://oauth2.googleapis.com") {
    return fetchUpstream(input, init);
  }

  const form = new URLSearchParams(init.body);
  if (url.pathname === "/revoke" && form.get("token") === refreshToken) {
    revoked = true;
    return new Response();
  }

  if (url.pathname === "/token") {
    if (form.get("grant_type") === "authorization_code" &&
        form.get("redirect_uri") === process.env.PRODUCTION_URL &&
        /^[\w-]{43}$/.test(form.get("code_verifier"))) {
      const scope = "https://www.googleapis.com/auth/youtube";
      if (form.get("code") === "fixture-existing-grant") return Response.json({ scope });
      if (form.get("code") === "fixture-code") {
        revoked = false;
        return Response.json({ refresh_token: refreshToken, scope });
      }
    }

    if (!revoked && form.get("grant_type") === "refresh_token" &&
        form.get("refresh_token") === refreshToken) {
      return Response.json({ access_token: "fixture-access-token", expires_in: 3600 });
    }
  }

  return Response.json({ error: "invalid_grant" }, { status: 400 });
};
