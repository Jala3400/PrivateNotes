import { throwCustomError } from "$lib/error";
import type { ConfigurationSection, Options } from "$lib/types";
import { invoke } from "@tauri-apps/api/core";

export function optionsFromSections(sections: ConfigurationSection[]): Options {
    const config: Options = {};
    for (const group of sections) {
        for (const option of group.options) {
            config[option.key] = option.defaultValue;
        }
    }

    return config;
}

export const initialConfig = await (async () => {
    try {
        const initialConfig: string = await invoke("get_initial_config");
        return initialConfig
            ? (JSON.parse(initialConfig) as Record<string, Record<string, any>>)
            : {};
    } catch (error) {
        throwCustomError(
            "Failed to load initial configuration: " + error,
            "An error occurred while loading the initial configuration."
        );
        return {};
    }
})();
