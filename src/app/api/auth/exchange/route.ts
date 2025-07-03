import { NextRequest, NextResponse } from "next/server";
import { corsHeaders, handleCors } from "../cors";

export async function OPTIONS() {
  return handleCors();
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    // Get the actual origin from the request
    const origin =
      request.headers.get("origin") ||
      (process.env.NODE_ENV === "production"
        ? process.env.PRODUCTION_URL!
        : "http://localhost:3001"); // Updated to match actual dev port

    const tokenParams = {
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: origin,
    };

    console.log("Token exchange params:", {
      ...tokenParams,
      client_secret: "[REDACTED]",
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(tokenParams),
    });

    const data = await response.json();

    if (data.error) {
      console.error("OAuth error response:", data);
      return NextResponse.json(
        { error: data.error_description || data.error },
        { status: 400, headers: corsHeaders() }
      );
    }

    return NextResponse.json(data, { headers: corsHeaders() });
  } catch (error: any) {
    console.error("Token exchange error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}
