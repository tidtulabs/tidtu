import { collectData } from "@/lib/collectData";
import { extractEndPoint } from "@/utils/extractEndPont";
const validExtensions = ["xls", "xlsx", "pdf", "doc", "docx", "ppt", "pptx"];

const getFile = async (getEndpoint: string) => {
	const fetch = getEndpoint;
	// console.log("Fetching link:", fetch);

	const $ = await collectData(fetch);
	let hrefs = null;
	const rows = $(".border_main").find("tr");
	for (let i = 0; i < rows.length; i++) {
		const links = $(rows[i]).find("a");

		links.each((index, element) => {
			const href = element.attribs.href;
			const isValidFile = validExtensions.some((ext) =>
				href.endsWith(`.${ext}`),
			);

			if (isValidFile) {
				hrefs = extractEndPoint(href);
				// console.log("hrefs", hrefs);
				return;
			}
		});
	}
	return hrefs;
};

export default defineEventHandler(async (event) => {
	// const params = event.context.params;
	// const id = params?.id;
	// console.log(id);
	if (event.node.req.method === "POST") {
		const body = await readBody(event);
		console.log("Dữ liệu nhận được:", body);
		const data = await getFile(body.url);
		return {
			success: true,
			message: "Data has been processed successfully.",
			data: {
				url: "https://pdaotao.duytan.edu.vn/" + data,
			},
		};
	}

	return {
		success: false,
		data: null,
		message: "Invalid method.",
	};
});
