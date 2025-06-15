import { message } from "@tauri-apps/plugin-dialog";

export async function throwCustomError(
    err: string,
    userMessage: string = err
): Promise<void> {
    console.error("Error: ", err);
    await message(userMessage, { kind: "error" });
}
