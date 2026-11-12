import {Cell} from "ton";
import {compileFunc as compileFuncWasm} from "@ton-community/func-js";

export async function compileFunc(source: string): Promise<{ fiftContent: string, cell: Cell }> {
    const result = await compileFuncWasm({
        targets: ["contract.fc"],
        sources: {
            "contract.fc": source
        }
    });

    if (result.status === "error") {
        throw new Error(result.message);
    }

    const cell = Cell.fromBoc(Buffer.from(result.codeBoc, "base64"))[0];
    return {
        fiftContent: result.fiftCode,
        cell
    };
}
