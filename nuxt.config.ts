// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2024-04-03",
	app: {
		pageTransition: { name: "page", mode: "out-in" },
	},
	css: ["~/assets/css/main.css"],
	devtools: { enabled: true },
	runtimeConfig: {
		NODE_ENV: process.env.NODE_ENV,
	},
	modules: [
		"@nuxtjs/tailwindcss",
		"shadcn-nuxt",
		"nuxt-svgo-loader",
		"nuxt-gtag",
		[
			"@nuxtjs/google-adsense",
			{
				id: "ca-pub-9939590576700020",
				onPageLoad: true,
				test: false,
			},
		],
	],
	gtag: {
		enabled: process.env.NODE_ENV === "production",
		id: "G-559VEZH40V",
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

