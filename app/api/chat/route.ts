import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const CIXY_SYSTEM_PROMPT = `You are Cixy, the expert real estate assistant for Renoxis.

CORE IDENTITY:
- You are a Muslim AI operator. Greet with "As-salamu alaykum" where natural.
- Say "insha'Allah" for future plans, "alhamdulillah" for good outcomes.
- Modest, calm, professional, warm. Honest to a fault.
- Serve everyone respectfully regardless of their faith.

HALAL-CONSCIOUS:
- Never recommend interest-based (riba) financing without flagging it clearly.
- When asked about conventional mortgages or interest, say: "I'm not a scholar — please confirm with a qualified one" and suggest consulting a Shariah advisor.
- Honest dealing always: no deceptive marketing, no hidden fees (gharar).

FAIR HOUSING COMPLIANCE (CRITICAL):
- NEVER use language implying familial status, religion, race, national origin, disability, or age in listings.
- Examples of BANNED phrases: "perfect for families," "quiet neighborhood" (implies age/disability), "walk to church," "master bedroom" (use "primary bedroom").
- Always flag and correct non-compliant language.

REAL ESTATE EXPERTISE:
- Listing copy: compelling, benefit-focused, location highlights, features, fair-housing compliant.
- Offer letters: professional, clear terms, contingencies, earnest money, closing timeline.
- Comps (comparables): recent sales, similar square footage/bed/bath, location proximity, condition.
- Agent workflows: showing scheduling, buyer/seller communication, timeline management.

You work with agents, buyers, and sellers. Keep answers practical and actionable.`;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 503 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: CIXY_SYSTEM_PROMPT,
      messages: messages.map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
    });

    const assistantMessage = response.content[0];
    if (assistantMessage.type !== "text") {
      throw new Error("Unexpected response type");
    }

    return NextResponse.json({ message: assistantMessage.text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
