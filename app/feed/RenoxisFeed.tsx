"use client";
import { useMemo } from "react";
import { createFeedClient } from "@/feed-client/api";
import { FeedView, type FeedSkin } from "@/feed-client/FeedView";

// Renoxis skin: only existing Renoxis classes (command-desk.css / welcome.css). Layout lives in ./feed.css.
const skin: FeedSkin = {
  tabs: "workspace-tabs", tab: "", tabActive: "active",
  card: "desk-panel", cardHead: "", title: "",
  button: "primary", buttonSecondary: "", buttonSmall: "fx-sm",
  chip: "tag", aiChip: "tag rx-ai", input: "rx-input", label: "",
  muted: "rx-muted", alert: "notice", notice: "notice", empty: "empty", listRow: "lead-row",
  signInUrl: "/auth/apixis/start?next=%2Ffeed",
  buyIxisUrl: "https://apixis-wallet.vercel.app/buy?product=renoxis",
};

export function RenoxisFeed() {
  const client = useMemo(() => createFeedClient({ client: "renoxis", sessionUrl: "/api/feed-session" }), []);
  return <FeedView client={client} skin={skin} siteName="Renoxis" />;
}
