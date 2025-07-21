import type { ConfigurationGroup } from "$lib/types";
import { invoke } from "@tauri-apps/api/core";
import { appearanceConfigGroup } from "./configs/appearanceConfig";
import { editorConfigGroup } from "./configs/editorConfig";
import { throwCustomError } from "$lib/error";

// Unified config group list
export const configGroupList: ConfigurationGroup[] = [
    appearanceConfigGroup,
    editorConfigGroup,
];

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

async function saveDefaultConfig(config: Record<string, Record<string, any>>) {
    try {
        const content = JSON.stringify(config);
        await invoke("save_initial_config", { content });
    } catch (error) {
        throwCustomError(
            "Failed to save default configuration " + error,
            "An error occurred while saving the default configuration."
        );
    }
}

const debouncedSaveDefaultConfig = debounce(saveDefaultConfig, 300);

// Subscribe to each store and track only changed values
const changedConfig: Record<string, Record<string, any>> = {};

for (const group of configGroupList) {
    let isFirstTime = true;
    group.store.subscribe((value) => {
        if (isFirstTime) {
            isFirstTime = false;
            return; // Skip first run to avoid initial save
        }
        const changed: Record<string, any> = {};
        for (const key in value) {
            if (value[key] !== group.defaults[key]) {
                changed[key] = value[key];
            }
        }

        if (Object.keys(changed).length > 0) {
            changedConfig[group.key] = changed;
        } else {
            delete changedConfig[group.key];
        }

        debouncedSaveDefaultConfig(changedConfig);
    });
}
export function loadConfigFile(config: Record<string, Record<string, any>>) {
    Object.entries(config).forEach(([key, value]) => {
        const store = configGroupList.find(
            (item) => item.name.toLowerCase() === key.toLowerCase()
        )?.store;

        if (store) {
            store.update((current) => ({
                ...current,
                ...value,
            }));
        }
    });
}
