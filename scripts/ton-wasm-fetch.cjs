const fs = require("node:fs/promises");
const path = require("node:path");

const nativeFetch = globalThis.fetch;

if (typeof nativeFetch === "function" && !globalThis.__tonWasmFetchPatched) {
    globalThis.fetch = async (input, init) => {
        const resource = typeof input === "string"
            ? input
            : input instanceof URL
                ? input.href
                : input && typeof input.url === "string"
                    ? input.url
                    : "";

        const resourcePath = resource.split(/[?#]/, 1)[0];
        if (path.basename(resourcePath) === "vm-exec.wasm") {
            const wasmPath = resource.startsWith("file:")
                ? new URL(resource)
                : resource;
            const bytes = await fs.readFile(wasmPath);
            return new Response(bytes, {
                status: 200,
                headers: { "content-type": "application/wasm" }
            });
        }

        return nativeFetch(input, init);
    };

    globalThis.__tonWasmFetchPatched = true;
}
