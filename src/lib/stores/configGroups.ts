import type { ConfigurationGroup } from "$lib/types";
import { invoke } from "@tauri-apps/api/core";
import {
    appearanceConfig,
    appearanceConfigSections,
    setAppearanceConfig,
} from "./configs/appearanceConfig";
import {
    editorConfig,
    editorConfigSections,
    setEditorConfig,
} from "./configs/editorConfig";
import { throwCustomError } from "$lib/error";

// Unified config group list
export const configGroupList: ConfigurationGroup[] = [
    {
        name: "Appearance",
        store: appearanceConfig,
        sections: appearanceConfigSections,
        setter: setAppearanceConfig,
    },
    {
        name: "Editor",
        store: editorConfig,
        sections: editorConfigSections,
        setter: setEditorConfig,
    },
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
        await invoke("save_default_config", { content });
    } catch (error) {
        throwCustomError(
            "Failed to save default configuration " + error,
            "An error occurred while saving the default configuration."
        );
    }
}

const debouncedSaveDefaultConfig = debounce(saveDefaultConfig, 300);

const defaultConfig: Record<string, Record<string, any>> = {};

// Build defaultConfig object from configGroupList sections
for (const group of configGroupList) {
    const defaults: Record<string, any> = {};
    for (const section of group.sections) {
        for (const option of section.options) {
            defaults[option.key] = option.defaultValue;
        }
    }
    defaultConfig[group.name] = defaults;
}

const changedConfig: Record<string, Record<string, any>> = {};

// Subscribe to each store and track only changed values
for (const group of configGroupList) {
    const defaults = defaultConfig[group.name];
    group.store.subscribe((value) => {
        const changed: Record<string, any> = {};
        for (const key in value) {
            if (value[key] !== defaults[key]) {
                changed[key] = value[key];
            }
        }

        if (Object.keys(changed).length > 0) {
            changedConfig[group.name] = changed;
        } else {
            delete changedConfig[group.name];
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
