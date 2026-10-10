import type { MetadataRoute } from "next";
import { AGENT_FILES, ORIGIN } from "@/lib/agent-files";

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{ url: `${ORIGIN}/`, priority: 1 },
		...AGENT_FILES.map((file) => ({ url: `${ORIGIN}${file.path}` })),
	];
}
