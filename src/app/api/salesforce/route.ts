import { NextResponse } from "next/server";
import { fetchDS2Data } from "@/lib/salesforce";

export async function GET() {
  try {
    const data = await fetchDS2Data();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Salesforce API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Salesforce data", details: String(error) },
      { status: 500 }
    );
  }
}
