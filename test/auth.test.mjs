import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

const require = createRequire(import.meta.url);
let app;
let origin;
let output = "";

before(async () => {
  const portPicker = createServer();
  await new Promise((resolve, reject) => {
    portPicker.once("error", reject).listen(0, "127.0.0.1", resolve);
  });
  const { port } = portPicker.address();
  await new Promise((resolve) => portPicker.close(resolve));
  origin = `http://127.0.0.1:${port}`;
  app = spawn(process.execPath, [
    "--import", new URL("./mock-google.mjs", import.meta.url).href,
    require.resolve("next/dist/bin/next"), "start", "-H", "127.0.0.1", "-p", String(port),
  ], {
    env: {
      ...process.env,
      PRODUCTION_URL: origin,
      GOOGLE_CLIENT_ID: "fixture-client-id",
      GOOGLE_CLIENT_SECRET: "fixture-client-secret",
      SESSION_SECRET: randomBytes(32).toString("base64url"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (const stream of [app.stdout, app.stderr]) {
    stream.on("data", (chunk) => { output += chunk; });
  }

  for (let attempts = 0; attempts < 300 && app.exitCode === null; attempts++) {
    if (await fetch(`${origin}/`, { signal: AbortSignal.timeout(1000) })
      .then((response) => response.ok, () => false)) return;
    await delay(100);
  }
  assert.fail(`Next.js server did not start. Run npm run build first.\n${output}`);
});

after(() => app?.kill());

function request(path, options = {}) {
  return fetch(`${origin}${path}`, { redirect: "manual", ...options });
}

function post(path, cookie, requestOrigin = origin, body) {
  const headers = { Origin: requestOrigin };
  if (cookie) headers.Cookie = cookie;
  return request(`/api/auth/${path}`, { method: "POST", headers, body });
}

async function start(options = {}) {
  const response = await post("start", null, origin, new URLSearchParams({ accept: "yes", ...options }));
  assert.equal(response.status, 200);
  const { url } = await response.json();
  return { response, url: new URL(url) };
}

test("the public homepage links to the privacy policy, terms and YouTube terms", async () => {
  const homepage = await (await request("/")).text();
  assert.equal(homepage.match(/<title>(.*?)<\/title>/)?.[1], "Playlist Pulse");
  assert.match(homepage, /href="\/privacy"/);
  assert.match(homepage, /href="\/terms"/);
  const privacy = await request("/privacy");
  assert.equal(privacy.status, 200);
  assert.match(await privacy.text(), /security\.google\.com\/settings\/security\/permissions/);
  const terms = await request("/terms");
  assert.equal(terms.status, 200);
  assert.match(await terms.text(), /youtube\.com\/t\/terms/);
});

test("OAuth requires same-origin POSTs and validates callbacks before exchanging codes", async () => {
  assert.equal((await post("start", null, "https://unrelated.example")).status, 403);
  assert.equal((await post("start")).status, 400);
  const { response, url } = await start();
  assert.equal(url.origin, "https://accounts.google.com");
  assert.equal(url.searchParams.get("redirect_uri"), origin);
  assert.equal(url.searchParams.get("scope"), "https://www.googleapis.com/auth/youtube");
  assert.equal(url.searchParams.has("prompt"), false);
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  const state = url.searchParams.get("state");
  assert.match(state, /^[\w-]{43}$/);
  const stateCookie = response.headers.get("set-cookie");
  assert.match(stateCookie, /HttpOnly/i);
  assert.match(stateCookie, /SameSite=lax/i);

  for (const path of ["/?code=fixture-code", "/?code=fixture-code&state=mismatch"]) {
    const rejected = await request(path, { headers: { Cookie: stateCookie.split(";")[0] } });
    assert.equal(rejected.status, 303);
    assert.equal(rejected.headers.get("location"), `${origin}/?auth=invalid`);
    assert.equal(rejected.headers.get("set-cookie"), null);
  }

  const cancelled = await request(`/?error=access_denied&state=${state}`, {
    headers: { Cookie: stateCookie.split(";")[0] },
  });
  assert.equal(cancelled.headers.get("location"), `${origin}/?auth=cancelled`);
  assert.match(cancelled.headers.get("set-cookie"), /Max-Age=0/i);
});

test("OAuth can request fresh consent when Google omits a refresh token", async () => {
  const { response, url } = await start();
  const state = url.searchParams.get("state");
  const callback = await request(`/?code=fixture-existing-grant&state=${state}`, {
    headers: { Cookie: response.headers.get("set-cookie").split(";")[0] },
  });
  assert.equal(callback.status, 303);
  assert.equal(callback.headers.get("location"), `${origin}/?auth=consent_required`);
  assert.match(callback.headers.get("set-cookie"), /Max-Age=0/i);

  const reconnect = await start({ consent: "yes" });
  assert.equal(reconnect.url.searchParams.get("prompt"), "consent");
  const newState = reconnect.url.searchParams.get("state");
  const reconnected = await request(`/?code=fixture-code&state=${newState}`, {
    headers: { Cookie: reconnect.response.headers.get("set-cookie").split(";")[0] },
  });
  assert.equal(reconnected.headers.get("location"), `${origin}/`);
  assert.ok(reconnected.headers.getSetCookie().some((cookie) => cookie.startsWith("playlist-session=")));
});

test("switching accounts explicitly still opens Google's account chooser", async () => {
  const { url } = await start({ switch_account: "yes" });
  assert.equal(url.searchParams.get("prompt"), "select_account consent");
});

test("a successful callback keeps refresh credentials private and disconnect revokes them", async () => {
  const { response, url } = await start();
  const state = url.searchParams.get("state");
  const callback = await request(`/?code=fixture-code&state=${state}`, {
    headers: { Cookie: response.headers.get("set-cookie").split(";")[0] },
  });
  assert.equal(callback.status, 303);
  assert.equal(callback.headers.get("location"), `${origin}/`);
  assert.equal(callback.headers.get("referrer-policy"), "no-referrer");
  const session = callback.headers.getSetCookie().find((cookie) => cookie.startsWith("playlist-session="));
  assert.match(session, /HttpOnly/i);
  assert.match(session, /Max-Age=2592000/i);
  assert.doesNotMatch(session, /fixture-refresh-token/);
  const sessionCookie = session.split(";")[0];
  const active = await post("refresh", sessionCookie);
  assert.equal(active.headers.get("cache-control"), "no-store");
  assert.deepEqual(await active.json(), { accessToken: "fixture-access-token", expiresIn: 3600 });
  const lastChar = sessionCookie.at(-12);
  const tampered = `${sessionCookie.slice(0, -12)}${lastChar === "A" ? "B" : "A"}${sessionCookie.slice(-11)}`;
  assert.equal((await post("refresh", tampered)).status, 401);
  const signedOut = await request("/api/auth/disconnect", {
    method: "DELETE", headers: { Origin: origin, Cookie: sessionCookie },
  });
  assert.equal(signedOut.status, 204);
  assert.match(signedOut.headers.getSetCookie().find((cookie) => cookie.startsWith("playlist-session=")), /Max-Age=0/i);
  assert.equal((await post("refresh")).status, 401);
  assert.equal((await post("refresh", sessionCookie)).status, 200);
  assert.equal((await post("disconnect", sessionCookie, "https://unrelated.example")).status, 403);
  const disconnected = await post("disconnect", sessionCookie);
  assert.equal(disconnected.status, 204);
  assert.match(disconnected.headers.get("set-cookie"), /Max-Age=0/i);
  assert.equal((await post("refresh", sessionCookie)).status, 401);
});
