import { deterministicStringify } from "./deterministicStringify";

export function createParametersString(toolParams: Record<string, unknown>): string {
    console.log(
        "[createParametersString] Creating parameters string for tool params: ",
        deterministicStringify(toolParams)
    );

    return deterministicStringify(toolParams);
}
