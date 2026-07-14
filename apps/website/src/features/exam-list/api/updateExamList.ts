
export const updateExamList =() => {
	fetch(
		`${import.meta.env.VITE_CACHE_SERVICE}/api/v1/pdaotao/scraping/examlist`,
		{ method: "PUT" },
	)
		.then((res) => {
			if (res.ok) {
				// console.log("Updated");
			}
		})
		.catch((err) => {});
};
