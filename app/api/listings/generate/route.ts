import { aiError } from "@/lib/renoxis/ai-error";
import {
  buildListingUserPrompt,
  LISTING_SYSTEM_PROMPT,
} from "@/lib/renoxis/cixy-prompts";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ListingRequest {
  address: string;
  price: string;
  bedrooms?: string;
  bathrooms?: string;
  sqft?: string;
  lotSize?: string;
  yearBuilt?: string;
  propertyType?: string;
  features?: string;
  highlights?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data: ListingRequest = await request.json();
    if (!data || typeof data.address !== 'string' || !data.address.trim() || typeof data.price !== 'string' || !data.price.trim() || Object.values(data).some(v => typeof v !== 'string' || v.length > 10000)) {
      return NextResponse.json({ error: 'Enter a valid address and price; text fields must be under 10,000 characters.' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 503 }
      );
    }

    // TODO: Call Apixis Wallet API to reserve 1,000 Ixis before generation
    // POST /api/v1/quotes → /reservations → capture on success / release on failure
    // For now, proceeding without actual redemption (waiting on Wallet integration docs)

    const { data: allowed, error: limitError } = await supabase.rpc('renoxis_take_ai_slot');
    if (limitError) return NextResponse.json({error:'AI request limits are unavailable. Please retry later.'},{status:503});
    if (!allowed) return NextResponse.json({error:'AI limit reached (10 per minute / 100 per day). Please try again later.'},{status:429});

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = buildListingUserPrompt(data);

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 1024,
      thinking: { type: "disabled" },
      system: LISTING_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const listingCopy = response.content.find(block => block.type === "text");
    if (!listingCopy || listingCopy.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // TODO: Capture the 1,000 Ixis reservation on success

    return NextResponse.json({ listing: listingCopy.text });
  } catch (error) {
    return aiError(error);
  }
}
