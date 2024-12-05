export function extractEndpoint(href: string | undefined): string {
	if (typeof href !== "string") {
		throw new Error("Invalid href: href should be a string");
	}

	// Normalize the href by removing leading ./ or ../
	if (href.startsWith("../")) {
		// Handle case where href starts with "../"
		href = href.replace(/^\.\.\//, "/");
	} else if (href.startsWith("./")) {
		// Handle case where href starts with "./"
		href = href.replace(/^\.\//, "/");
	} else if (!href.startsWith("/")) {
		// If it's a relative path without any dots, just add leading "/"
		href = `/${href}`;
	}

	const regex = /\/(.*)/;
	const match = href.match(regex); // Match result might be null
	if (match && match[1]) {
		return match[1]; // Safely return the first capturing group
	}
	throw new Error("Invalid href format"); // Handle the case where no match is found
}
