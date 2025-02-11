import { Icon } from "@iconify/react";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

/**
 * Shared layout configurations
 *
 * you can configure layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
	nav: {
		title: (
			<div className="flex items-center gap-2">
				<span className="text-2xl">🗂️</span>
				<span className="font-bold text-xl">use-fs</span>
			</div>
		),
	},
	links: [
		// {
		// 	text: "Documentation",
		// 	url: "/docs",
		// 	active: "nested-url",
		// },
		{
			text: "@linesofcode",
			url: "https://linesofcode.dev",
			type: "icon",
			icon: <Icon icon="meteor-icons:at" />,
		},
		{
			text: "Bluesky",
			url: "https://bsky.app/profile/linesofcode.bsky.social",
			type: "icon",
			icon: <Icon icon="meteor-icons:bluesky" />,
		},
		{
			text: "Twitter",
			url: "https://x.com/linesofcode",
			type: "icon",
			icon: <Icon icon="meteor-icons:x" />,
		},
	],
	githubUrl: "https://github.com/TimMikeladze/use-fs",
};
