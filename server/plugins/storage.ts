import redisDriver from "unstorage/drivers/redis";

export default defineNitroPlugin(() => {
	const storage = useStorage();

	// Dynamically pass in credentials from runtime configuration, or other sources
	const driver = redisDriver({
		base: "cached",
		host: useRuntimeConfig().redis.host,
		port: useRuntimeConfig().redis.port,
		username: useRuntimeConfig().redis.username,
		password: useRuntimeConfig().redis.password,
		/* other redis connector options */
	});

	// Mount driver
	storage.mount("cached", driver);
});
