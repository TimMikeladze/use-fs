import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const COLLAPSED_HEIGHT = 225;

const replaceContent = (content: string) => {
	return content.replace("Check out the 💻 [**use-fs.com**](https://use-fs.app) to see it in action.", "");
};

export const Readme = ({ className }: { className?: string }) => {
	const [content, setContent] = useState("");
	const [isExpanded, setIsExpanded] = useState(false);

	useEffect(() => {
		import("../../README.md?raw").then((module) => {
			setContent(replaceContent(module.default));
		});
	}, []);

	return (
		<div className="relative">
			<div
				className={cn(
					"bg-zinc-950 rounded-lg border border-zinc-800 shadow-2xl overflow-hidden transition-all duration-500",
					
				)}
				style={{
					maxHeight: isExpanded ? "none" : `${COLLAPSED_HEIGHT}px`,
				}}
			>
				<div className="sm:px-6 px-3 relative">
					<article
						className={cn(
							"prose prose-invert prose-sm sm:prose-base max-w-8xl mx-auto",
							"prose-headings:font-mono",
							"prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:font-normal prose-h1:mb-8 sm:prose-h1:mb-12 prose-h1:text-white prose-h1:leading-relaxed",
							"prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-4 sm:prose-h2:mb-6 prose-h2:mt-12 sm:prose-h2:mt-16 prose-h2:text-white prose-h2:leading-relaxed",
							"prose-p:font-mono prose-p:text-base prose-p:leading-loose prose-p:mb-6 sm:prose-p:mb-8",
							"prose-a:font-mono prose-a:text-white prose-a:no-underline hover:prose-a:text-gray-300 prose-a:font-bold",
							"prose-strong:text-white prose-strong:font-bold",
							"prose-li:my-2 prose-li:text-base prose-li:leading-loose",
							"[&_p]:tracking-wide",
							"[&_ul]:mt-4 [&_ul]:mb-8 [&_ul]:space-y-3",
							"[&_h2+ul]:mt-6",
							"[&_a:has(strong)]:font-normal",
							"[&_p>a]:inline-flex [&_p>a]:items-center [&_p>a]:gap-1.5",
							"[&_p>a:not(:last-child)]:after:content-['∙'] [&_p>a:not(:last-child)]:after:mx-3 [&_p>a:not(:last-child)]:after:text-gray-500",
							className,
						)}
					>
						<Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
					</article>
					{!isExpanded && (
						<div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />
					)}
				</div>
			</div>
			<button
				type="button"
				onClick={() => setIsExpanded(!isExpanded)}
				className="mt-4 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
			>
				{isExpanded ? "Show less documentation" : "Show more documentation"}
			</button>
		</div>
	);
};