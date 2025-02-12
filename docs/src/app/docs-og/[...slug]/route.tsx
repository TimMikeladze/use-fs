import { metadataImage } from "@/lib/metadata";
import { generateOGImage } from "fumadocs-ui/og";

export const GET = metadataImage.createAPI((_page) => {
	return generateOGImage({
		title: "use-fs",
		description: "A React hook for integrating with the File System Access API",
		site: "use-fs",
	});
});

export function generateStaticParams() {
	return metadataImage.generateParams();
}
