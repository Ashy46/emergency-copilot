import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { roomName, identity, role } = await req.json();

    if (!roomName || !identity || !role) {
      return NextResponse.json({ error: "Missing roomName/identity/role" }, { status: 400 });
    }

    const url = process.env.LIVEKIT_URL!;
    const apiKey = process.env.LIVEKIT_API_KEY!;
    const apiSecret = process.env.LIVEKIT_API_SECRET!;
    if (!url || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "LiveKit env not configured" }, { status: 500 });
    }

    const at = new AccessToken(apiKey, apiSecret, { identity });

    // Permissions: caller can publish; dispatcher is view-only
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: role === "caller",
      canSubscribe: true
    });

    const token = await at.toJwt();
    return NextResponse.json({ url, token });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "bad_request" }, { status: 400 });
  }
}
