import { useEffect, useRef, useState } from "react";

const callbackMessages: Record<string, string> = {
  cancelled: "YouTube sign-in was cancelled.",
  consent_required: "Google needs your permission again to keep you signed in. Choose Continue to Google to reconnect.",
  failed: "Google sign-in could not be completed. Please try again.",
  invalid: "This sign-in attempt expired or could not be verified. Please try again.",
  permission: "Allow YouTube playlist access in the Google consent screen to continue.",
};

function authRequest(path: string, options: RequestInit = {}) {
  return fetch(`/api/auth/${path}`, { method: "POST", cache: "no-store", ...options });
}

export function useYouTubeAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const actionInProgress = useRef(false);
  const consentRequired = useRef(false);

  useEffect(() => {
    try {
      // Remove credentials written by previous versions of the app.
      localStorage.removeItem("youtube_access_token");
      localStorage.removeItem("youtube_token_expiry");
      localStorage.removeItem("youtube_refresh_token");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "SecurityError")) throw error;
    }

    const url = new URL(window.location.href);
    const status = url.searchParams.get("auth");
    if (status && Object.hasOwn(callbackMessages, status)) {
      consentRequired.current = status === "consent_required";
      setAuthError(callbackMessages[status]);
      url.searchParams.delete("auth");
      window.history.replaceState(window.history.state, "", url);
    }

    const request = new AbortController();
    let timer: number | undefined;
    let hadSession = false;

    async function refreshSession() {
      try {
        const response = await authRequest("refresh", { signal: request.signal });
        if (request.signal.aborted) return;
        if (response.status === 401) {
          setAccessToken(null);
          if (hadSession) setAuthError("Your YouTube session ended. Sign in again to continue.");
          return;
        }
        if (!response.ok) throw new Error("Refresh failed");

        const { accessToken: token, expiresIn } = await response.json();
        if (request.signal.aborted) return;
        setAccessToken(token);
        hadSession = true;
        const lifetime = expiresIn * 1000;
        timer = window.setTimeout(refreshSession, lifetime - Math.min(30_000, lifetime / 2));
      } catch {
        if (request.signal.aborted) return;
        setAccessToken(null);
        setAuthError("YouTube access could not be refreshed. Reload the page or sign in again.");
      } finally {
        if (!request.signal.aborted) setIsValidating(false);
      }
    }

    void refreshSession();
    return () => {
      request.abort();
      window.clearTimeout(timer);
    };
  }, []);

  async function runAction(action: () => Promise<void>, failure: string) {
    if (actionInProgress.current) return;
    actionInProgress.current = true;
    setAuthBusy(true);
    setAuthError(null);
    try {
      await action();
    } catch {
      setAuthError(failure);
      setAuthBusy(false);
      actionInProgress.current = false;
    }
  }

  async function authenticate({ switchAccount = false } = {}) {
    await runAction(async () => {
      const body = new URLSearchParams({ accept: "yes" });
      if (switchAccount) body.set("switch_account", "yes");
      if (consentRequired.current) body.set("consent", "yes");
      const response = await authRequest("start", { body });
      if (!response.ok) throw new Error("Authorization could not start");
      const { url } = await response.json();
      window.location.assign(url);
    }, "Google sign-in could not be started. Check the app’s configuration or try again.");
  }

  async function endSession(revoke: boolean) {
    const failure = revoke
      ? "Could not revoke YouTube access. Try again or remove Playlist Pulse in your Google Account settings."
      : "Could not sign out. Please try again.";
    await runAction(async () => {
      const response = await authRequest("disconnect", { method: revoke ? "POST" : "DELETE" });
      if (!response.ok) throw new Error("Session could not end");
      window.location.replace("/");
    }, failure);
  }

  return { accessToken, isValidating, isAuthenticated: Boolean(accessToken), authError, authBusy, authenticate, endSession };
}
