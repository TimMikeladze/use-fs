import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { Helmet } from "react-helmet";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		{Boolean(
			import.meta.env.VITE_UMAMI_URL && import.meta.env.VITE_UMAMI_WEBSITE_ID,
		) && (
			<Helmet>
				<script
					defer={true}
					src={`${import.meta.env.VITE_UMAMI_URL}/script.js`}
					data-website-id={import.meta.env.VITE_UMAMI_WEBSITE_ID}
				/>
			</Helmet>
		)}
		<App />
	</StrictMode>,
);
