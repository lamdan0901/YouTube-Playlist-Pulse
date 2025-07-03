import { NextRequest, NextResponse } from "next/server";
import { corsHeaders, handleCors } from "../cors";

export async function OPTIONS() {
  return handleCors();
}

export async function POST(request: NextRequest) {
  try {
    const { refresh_token } = await request.json();

    const tokenParams = {
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token,
      grant_type: "refresh_token",
    };

    console.log(
      "Token refresh attempt for client:",
      process.env.GOOGLE_CLIENT_ID?.slice(0, 20) + "..."
    );

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(tokenParams),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Token refresh error response:", data);
      return NextResponse.json(
        { error: data.error_description || data.error },
        { status: 400, headers: corsHeaders() }
      );
    }

    return NextResponse.json(data, { headers: corsHeaders() });
  } catch (error: any) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}
