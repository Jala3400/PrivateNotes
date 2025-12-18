import { addNotification } from "./stores/notifications";
import { NotificationType } from "./types";

export async function throwCustomError(
    err: string,
    userMessage: string = err
): Promise<void> {
    console.error("Error: ", err);
    addNotification(userMessage, NotificationType.ERROR);
}
