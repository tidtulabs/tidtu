import "./assets/styles/index.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import VueGtag from "vue-gtag";
import { VueQueryPlugin } from '@tanstack/vue-query'

createApp(App)

	.use(router)
	.use(VueGtag, {
		config: { id: "G-F1TX2BDFSE" },
	})
  .use(VueQueryPlugin)
	.mount("#app");
