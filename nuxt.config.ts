// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2024-04-03",
	app: {
		pageTransition: { name: "page", mode: "out-in" },
	},

	css: ["~/assets/css/main.css"],
	runtimeConfig: {
		redis: {
			driver: process.env.REDIS_DRIVER,
			host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
			username: process.env.REDIS_USERNAME,
			password: process.env.REDIS_PASSWORD,
		},
	},
	devtools: { enabled: false},
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
		// "@nuxt/test-utils/module",
	],
	gtag: {
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
