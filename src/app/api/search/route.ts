import { NextResponse } from "next/server";
import { searchSite } from "@/lib/data";
import { rateLimit, requestKey } from "@/lib/rate-limit";
export async function GET(request: Request) { if (!rateLimit(requestKey(request, "search"), 30, 60_000).allowed) return NextResponse.json({ error: "Too many searches" }, { status: 429 }); const query = new URL(request.url).searchParams.get("q") ?? ""; return NextResponse.json(await searchSite(query)); }
