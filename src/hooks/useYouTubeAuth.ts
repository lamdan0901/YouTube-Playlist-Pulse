import { useState, useEffect } from "react";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string;
const SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube",
];

const TOKEN_STORAGE_KEY = "youtube_access_token";
const TOKEN_EXPIRY_STORAGE_KEY = "youtube_token_expiry";
const REFRESH_TOKEN_STORAGE_KEY = "youtube_refresh_token";

const storeTokens = (
  accessToken: string,
  expiresIn: number,
  refreshToken?: string
) => {
  const expiryTime = Date.now() + expiresIn * 1000;
  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  localStorage.setItem(TOKEN_EXPIRY_STORAGE_KEY, expiryTime.toString());
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }
};

const getStoredTokens = (): {
  accessToken: string | null;
  refreshToken: string | null;
  isExpired: boolean;
} => {
  const accessToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_STORAGE_KEY);

  if (!accessToken || !expiryTime) {
    return { accessToken: null, refreshToken, isExpired: true };
  }

  const isExpired = Date.now() >= parseInt(expiryTime);
  return {
    accessToken: isExpired ? null : accessToken,
    refreshToken,
    isExpired,
  };
};

const clearStoredTokens = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
};

const exchangeCodeForTokens = async (
  code: string
): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token?: string;
} | null> => {
  try {
    const apiUrl = "/api/auth/exchange";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
};

const refreshAccessToken = async (
  refreshToken: string
): Promise<{
  access_token: string;
  expires_in: number;
} | null> => {
  try {
    const apiUrl = "/api/auth/refresh";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        access_token: data.access_token,
        expires_in: data.expires_in || 3600,
      };
    }
    return null;
  } catch {
    return null;
  }
};

const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&maxResults=1",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    return response.ok;
  } catch {
    return false;
  }
};

export const useYouTubeAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      setIsValidating(true);

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const error = urlParams.get("error");

      if (error) {
        console.error("OAuth error:", error);
        setIsValidating(false);
        return;
      }

      if (code) {
        const tokens = await exchangeCodeForTokens(code);
        console.log("tokens: ", tokens);

        if (tokens) {
          storeTokens(
            tokens.access_token,
            tokens.expires_in,
            tokens.refresh_token
          );
          setAccessToken(tokens.access_token);
          setIsAuthenticated(true);

          // Clean up URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        } else {
          console.error("Failed to exchange authorization code for tokens");
        }

        setIsValidating(false);
        return;
      }

      // Check for stored tokens
      const {
        accessToken: storedAccessToken,
        refreshToken,
        isExpired,
      } = getStoredTokens();

      if (storedAccessToken && !isExpired) {
        // We have a valid access token
        const isValid = await validateToken(storedAccessToken);

        if (isValid) {
          setAccessToken(storedAccessToken);
          setIsAuthenticated(true);
          setIsValidating(false);
          return;
        }
      }

      // Try to refresh the access token if we have a refresh token
      if (refreshToken) {
        const newTokenData = await refreshAccessToken(refreshToken);

        if (newTokenData) {
          storeTokens(
            newTokenData.access_token,
            newTokenData.expires_in,
            refreshToken
          );
          setAccessToken(newTokenData.access_token);
          setIsAuthenticated(true);
        } else {
          // Refresh token is invalid, clear all stored tokens
          clearStoredTokens();
        }
      } else if (storedAccessToken) {
        // We have an access token but no refresh token (legacy user)
        console.warn(
          "Access token found but no refresh token. User may need to re-authenticate for long-term access."
        );
        setAccessToken(storedAccessToken);
        setIsAuthenticated(true);
      }

      setIsValidating(false);
    };

    initializeAuth();
  }, []);

  const authenticate = async (forceConsent: boolean = true) => {
    const redirectUri = window.location.origin;
    // Always use 'consent' by default to ensure refresh tokens are returned
    // Use 'select_account' only when explicitly requested and user wants account selection
    const promptParam = forceConsent ? "consent" : "select_account";

    // Use authorization code flow instead of implicit flow
    const authUrl =
      `https://accounts.google.com/o/oauth2/auth?` +
      `client_id=${encodeURIComponent(CLIENT_ID)}` +
      `&response_type=code` + // Changed from 'token' to 'code'
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(SCOPES.join(" "))}` +
      `&access_type=offline` + // Request offline access for refresh tokens
      `&prompt=${promptParam}` +
      `&include_granted_scopes=true`; // Ensure all granted scopes are included

    window.location.href = authUrl;
  };

  const logout = () => {
    clearStoredTokens();
    setAccessToken(null);
    setIsAuthenticated(false);
  };

  const forceReAuthenticate = () => {
    // Force consent to ensure we get refresh tokens
    clearStoredTokens();
    setAccessToken(null);
    setIsAuthenticated(false);
    authenticate(true); // Force consent
  };

  const hasRefreshToken = (): boolean => {
    const { refreshToken } = getStoredTokens();
    return !!refreshToken;
  };

  // Check token expiry and attempt refresh
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const checkAndRefreshToken = async () => {
      const { isExpired, refreshToken } = getStoredTokens();

      if (isExpired && refreshToken) {
        const newTokenData = await refreshAccessToken(refreshToken);

        if (newTokenData) {
          storeTokens(
            newTokenData.access_token,
            newTokenData.expires_in,
            refreshToken
          );
          setAccessToken(newTokenData.access_token);
        } else {
          // Refresh failed, logout user
          logout();
        }
      } else if (isExpired) {
        // No refresh token available, logout
        logout();
      }
    };

    // Check every minute
    const interval = setInterval(checkAndRefreshToken, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, accessToken]);

  return {
    isAuthenticated,
    accessToken,
    authenticate,
    logout,
    forceReAuthenticate,
    hasRefreshToken,
    isValidating,
  };
};
