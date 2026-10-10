import { docs, markdownResponse } from "@/lib/agents";

export const dynamic = "force-static";

// The landing page demonstrates the README, so its Markdown twin is the README.
export const GET = () => markdownResponse(docs().full());
