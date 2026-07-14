import Cloudflare from "cloudflare";

const client = new Cloudflare({
	apiEmail: process.env["CLOUDFLARE_EMAIL"],
	apiKey: process.env["CLOUDFLARE_API_KEY"],
});

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CLOUDFLARE_KV_NAMESPACE_ID;

interface Metadata {
	createdAt: string;
}

interface KVResponse {
	success: boolean;
	message: string;
	data?: any;
}

interface KV {
	put: (
		key: string,
		data: any,
		options?: {
			expirationTtl?: number;
		},
	) => Promise<KVResponse>;
	get: (key: string) => Promise<any | null>;
	delete: (key: string) => Promise<KVResponse>;
}

const KV: KV = {
	put: async (
		key: string,
		data: any,
		options?: {
			expirationTtl?: number;
		},
	): Promise<KVResponse> => {
		if (CF_ACCOUNT_ID && CF_KV_NAMESPACE_ID) {
			const metadata: Metadata = {
				createdAt: new Date().toISOString(),
			};
			const params: any = {
				account_id: CF_ACCOUNT_ID,
				metadata: JSON.stringify(metadata),
				value: data,
			};
			if (options?.expirationTtl) {
				params.expiration_ttl = options.expirationTtl;
			}

			try {
				const value = await client.kv.namespaces.values.update(
					CF_KV_NAMESPACE_ID,
					key,
					params,
				);

				return {
					success: true,
					message: "Data stored successfully",
				};
			} catch (error: any) {
				return {
					success: false,
					message: `Error storing data: ${error.message}`,
				};
			}
		} else {
			return { success: false, message: "Missing Cloudflare configuration" };
		}
	},

	get: async (key: string): Promise<any | null> => {
		if (CF_ACCOUNT_ID && CF_KV_NAMESPACE_ID) {
			try {
				const res = await client.kv.namespaces.values.get(
					CF_KV_NAMESPACE_ID,
					key,
					{
						account_id: CF_ACCOUNT_ID,
					},
				);

				if (res) {
					const data = await res.json();
					return data;
				}

				return null;
			} catch (error) {
				console.error("Error retrieving data:", error);
				return null;
			}
		} else {
			console.error("Missing Cloudflare configuration");
			return null;
		}
	},
	delete: async (key: string): Promise<KVResponse> => {
		if (CF_ACCOUNT_ID && CF_KV_NAMESPACE_ID) {
			try {
				await client.kv.namespaces.values.delete(CF_KV_NAMESPACE_ID, key, {
					account_id: CF_ACCOUNT_ID,
				});

				return {
					success: true,
					message: "Data deleted successfully",
				};
			} catch (error: any) {
				return {
					success: false,
					message: `Error deleting data: ${error.message}`,
				};
			}
		} else {
			return { success: false, message: "Missing Cloudflare configuration" };
		}
	},
};

export { KV };
