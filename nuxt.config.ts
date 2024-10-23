// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2024-04-03",
	app: {
		pageTransition: { name: "page", mode: "out-in" },
	},
	css: ["~/assets/css/main.css"],
	devtools: { enabled: true },
	modules: [
		"@nuxtjs/tailwindcss",
		"shadcn-nuxt",
		"nuxt-svgo-loader",
		[
			"@nuxtjs/google-adsense",
			{
				id: "ca-pub-9939590576700020",
				onPageLoad: true,
				test: false,
			},
		],
		"nuxt-gtag",
	],
	gtag: {
		id: process.env.GOOGLE_ANALYTICS_ID,
		enabled: process.env.NODE_ENV === "production",
	},

	components: [
		{
			path: "~/features",
			pathPrefix: false,
		},
		{
			path: "~/components/layouts",
			pathPrefix: false,
		},
	],
});

