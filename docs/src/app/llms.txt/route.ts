import { docs, markdownResponse } from "@/lib/agents";

export const dynamic = "force-static";

export const GET = () => markdownResponse(docs().llmsTxt(), "text/plain");
