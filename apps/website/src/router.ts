import { createRouter, createWebHistory } from "vue-router";
import HomePage from "@/views/HomePage.vue";
import { ExamListPage } from "@/features/exam-list";
import PDaotaoPage from "@/views/PDaotaoPage.vue";
import PDaotaoLayout from "./views/PDaotaoLayout.vue";

const routes = [
	{
		path: "/",
		component: HomePage,
		meta: { title: "TIDTU" },
	},
	{
		path: "/pdaotao",
		component: PDaotaoLayout,
		children: [
			{
				path: "",
				component: PDaotaoPage,
				meta: { title: "P. Đào Tạo | TIDTU" },
			},
			{
				path: "examlist",
				component: ExamListPage,
				meta: { title: "Danh sách thi | TIDTU" },
			},
		],
	},
	{
		path: "/:pathMatch(.*)*",
		component: () => import("@/views/NotFoundPage.vue"),
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

router.beforeEach((to, from, next) => {
	document.title = (to.meta.title as string) || "TIDTU";
	next();
});

export default router;
