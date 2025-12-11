import type { CustomNotification, NotificationType } from "$lib/types";
import { get, writable } from "svelte/store";

export const notifications = writable<CustomNotification[]>([]);

let notificationId = 0;
const notificationDuration = 3000; // Duration in milliseconds

export function addNotification(message: string, type: NotificationType) {
    const id = ++notificationId;

    notifications.update((items) => {
        items.push({ id, message, type });
        return items;
    });

    setTimeout(() => removeNotification(id), notificationDuration);
}

export function removeNotification(id: number) {
    notifications.update((items) => items.filter((n) => n.id !== id));
}
