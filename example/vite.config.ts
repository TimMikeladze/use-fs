import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [tailwindcss(), react()],
	define: {
		// biome-ignore lint/style/useNamingConvention: <explanation>
		__APP_ENV__: JSON.stringify(process.env.VITE_VERCEL_ENV),
		// biome-ignore lint/style/useNamingConvention: <explanation>
		VITE_UMAMI_WEBSITE_ID: JSON.stringify(process.env.VITE_UMAMI_WEBSITE_ID),
		// biome-ignore lint/style/useNamingConvention: <explanation>
		VITE_UMAMI_URL: JSON.stringify(process.env.VITE_UMAMI_URL),
	},
});
