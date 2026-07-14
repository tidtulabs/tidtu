import { BASE_URL } from "./base-url";

const checkFileType = async (url: string) => {
    try {
        const response = await fetch(`${BASE_URL}/${url}`, { method: "HEAD" });
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        
        const contentType = response.headers.get("Content-Type");
        
        if (!contentType) {
            return { type: null, message: "No Content-Type returned." };
        }
        
        const contentTypeMap: Record<string, string> = {
            "application/pdf": "pdf",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
            "application/zip": "zip",
            "application/vnd.ms-excel": "xls",
        };

        const fileType = Object.entries(contentTypeMap).find(([key]) =>
            contentType.includes(key)
        )?.[1];
        
        return fileType || null;
    } catch (error) {
        // console.error("Error checking file type:", error);
        return null;
    }
};

const checkFileExtension = (url: string) => {
    const supportedFormats = [
        { extension: ".pdf", type: "pdf" },
        { extension: ".xlsx", type: "xlsx" },
        { extension: ".xls", type: "xls" },
        { extension: ".docx", type: "docx" },
        { extension: ".zip", type: "zip" },
    ];

    const matchedFormat = supportedFormats.find(({ extension }) =>
        url.endsWith(extension)
    );

    return matchedFormat?.type || null
};


export { checkFileType, checkFileExtension };
