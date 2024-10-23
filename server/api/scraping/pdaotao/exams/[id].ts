const validExtensions = ["xls", "xlsx", "pdf", "doc", "docx", "ppt", "pptx"];
const getFile = async (getEndpoint: string) => {
	try {
		const scraping = await scrapingData(getEndpoint);
		if (scraping.data) {
			const $ = scraping.data;

			let hrefs = null;
			const rows = $(".border_main").find("tr");
			for (let i = 0; i < rows.length; i++) {
				const links = $(rows[i]).find("a");

				links.each((_, element) => {
					const href = element.attribs.href;
					const isValidFile = validExtensions.some((ext) =>
						href.endsWith(`.${ext}`),
					);

					if (isValidFile) {
						hrefs = extractEndpoint(href);
						// console.log("hrefs", hrefs);
						return;
					}
				});
			}
			return hrefs;
		}
	} catch (error) {
		throw new Error(`Hrefs ${error}`);
	}
};

export default defineEventHandler(async (event) => {
	try {
		if (event.node.req.method === "POST") {
			const body = await readBody(event);
			// console.log("Dữ liệu nhận được:", body);
			const data = await getFile(body.url);

			return {
				success: true,
				message: "Data has been processed successfully.",
				data: {
					url: "https://pdaotao.duytan.edu.vn/" + data,
				},
			};
		}
	} catch (error: any) {
		if (error.message.includes("Time out")) {
			setResponseStatus(event, 502);
		} else {
			setResponseStatus(event, 500);
		}
		return {
			success: false,
			data: null,
			message: `${error.message}`,
		};
	}
});
