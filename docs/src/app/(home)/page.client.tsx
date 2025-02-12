"use client";
import dynamic from "next/dynamic";

const Demo = dynamic(() => import("./Demo"), { ssr: false });

export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col justify-center text-center">
			<Demo />
		</main>
	);
}
