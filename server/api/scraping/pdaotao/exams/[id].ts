const validExtensions = ["xls", "xlsx", "pdf", "doc", "docx", "ppt", "pptx"];
const getFileUrl = async (getEndpoint: string) => {
	const scraping = await scrapingData(getEndpoint);

	if (scraping.success === false) {
		throw new Error(scraping.message);
	}

	if (scraping.data) {
		const $ = scraping.data;
		let urlFile = null;
		const rows = $(".border_main").find("tr");
		for (let i = 0; i < rows.length; i++) {
			const links = $(rows[i]).find("a");

			links.each((_, element) => {
				const href = element.attribs.href;
				const isValidFile = validExtensions.some((ext) =>
					href.endsWith(`.${ext}`),
				);

				if (isValidFile) {
					urlFile = extractEndpoint(href);
					return; // break loop
				}
			});
		}

		if (!urlFile) {
			throw new Error("File url not found in the page.");
		}
		return urlFile;
	}
};

export default defineEventHandler(async (event) => {
	try {
		if (event.node.req.method === "POST") {
			const body = await readBody(event);
			// console.log("Dữ liệu nhận được:", body);
			const data = await getFileUrl(body.url);

			return {
				success: true,
				message: "Data has been processed successfully.",
				response: {
					url: "https://pdaotao.duytan.edu.vn/" + data,
				},
			};
		}
	} catch (error: any) {
		if (error.message.includes("Time out")) {
			setResponseStatus(event, 504);
		} else {
			setResponseStatus(event, 500);
		}
		return {
			success: false,
			response: null,
			message: `${error.message}`,
		};
	}
});
