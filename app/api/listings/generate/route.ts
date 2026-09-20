import { aiError } from "@/lib/renoxis/ai-error";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const LISTING_SYSTEM_PROMPT = `You are an expert real estate listing copywriter.

CRITICAL FAIR HOUSING COMPLIANCE:
You MUST NOT include ANY language that implies:
- Familial status (NO "perfect for families", "great for kids", etc.)
- Religion (NO "walk to church/temple/mosque", etc.)
- Race or national origin (NO "diverse neighborhood", ethnic references)
- Disability (NO "quiet", "active lifestyle", accessibility features presented as selling points)
- Age (NO "mature", "young professionals", "retirees")

BANNED PHRASES (never use):
- "master bedroom" (use "primary bedroom")
- "perfect for families" / "great for kids"
- "quiet neighborhood" / "peaceful" (implies disability/age)
- "walk to [religious building]"
- Any reference to ideal buyer demographics

ALLOWED:
- Factual property features (square footage, bedrooms, materials)
- Location proximity to transit, shopping, parks (NO demographic implications)
- Condition and finishes
- Utilities and systems

Generate compelling, benefit-focused listing copy that is 100% fair-housing compliant.`;

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

    const prompt = `Generate fair-housing compliant listing copy for:

Address: ${data.address}
Price: ${data.price}
${data.propertyType ? `Type: ${data.propertyType}` : ""}
${data.bedrooms ? `Bedrooms: ${data.bedrooms}` : ""}
${data.bathrooms ? `Bathrooms: ${data.bathrooms}` : ""}
${data.sqft ? `Square Feet: ${data.sqft}` : ""}
${data.lotSize ? `Lot Size: ${data.lotSize}` : ""}
${data.yearBuilt ? `Year Built: ${data.yearBuilt}` : ""}
${data.features ? `\nKey Features:\n${data.features}` : ""}
${data.highlights ? `\nNeighborhood:\n${data.highlights}` : ""}

Write compelling listing copy (3-4 paragraphs) that highlights the property's best features while being 100% fair-housing compliant.`;

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
