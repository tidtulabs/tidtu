import { createRouter, createWebHistory } from "vue-router"
import HomePage from "@/views/HomePage.vue"
import PDaoTaoLayout from "./views/PDaoTaoLayout.vue"

const routes = [
	{
		path: "/",
		component: HomePage,
		meta: { title: "TIDTU" },
	},
	{
		path: "/pdaotao",
		component: PDaoTaoLayout,
		children: [
			{
				path: "",
				component: () => import("@/views/PDaoTaoPage.vue"),
				meta: { title: "P. Đào Tạo | TIDTU" },
			},
				{
					path: "examlist",
					alias: "danh-sach-thi",
					component: () => import("@/features/exam-list/views/ExamListPage.vue"),
					meta: { title: "Danh sách thi | TIDTU" },
				},
				{
					path: "feedback",
					alias: "gop-y-bao-loi",
					component: () => import("@/features/feedback/components/FeedbackView.vue"),
					meta: { title: "Góp ý & Báo lỗi | TIDTU" },
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

export default router;
