import type { MetadataRoute } from "next";
import { ORIGIN } from "@/lib/agent-files";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: { userAgent: "*", allow: "/" },
		sitemap: `${ORIGIN}/sitemap.xml`,
	};
}
