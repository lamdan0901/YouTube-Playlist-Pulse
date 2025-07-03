import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "yt-playlist-pulse",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
}
