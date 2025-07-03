import { NextResponse } from "next/server";

export function corsHeaders() {
  const isDevelopment = process.env.NODE_ENV !== "production";

  return {
    "Access-Control-Allow-Origin": isDevelopment
      ? "*"
      : process.env.FRONTEND_URL || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

export function handleCors() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}
