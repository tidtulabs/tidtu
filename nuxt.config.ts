// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2024-04-03",
	app: {
		pageTransition: { name: "page", mode: "out-in" },
	},
	css: ["~/assets/css/main.css"],
	devtools: { enabled: true },
	modules: ["@nuxtjs/tailwindcss", "shadcn-nuxt", "nuxt-svgo-loader"],

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

