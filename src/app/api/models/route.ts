import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getProviderChain } from "@/lib/provider-configs";

export async function GET() {
  // Require admin auth to list models
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ models: [] });
  }

  const providers = await getProviderChain();
  const provider = providers[0];

  if (!provider) {
    return NextResponse.json({ models: [] });
  }

  try {
    const url = `${provider.baseUrl.replace(/\/$/, "")}/models`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ models: [] });
    }

    const data = await res.json();
    const models = (data.data || []).map((m: { id: string }) => m.id);

    return NextResponse.json({ models });
  } catch {
    return NextResponse.json({ models: [] });
  }
}
