import type { ConfigurationSection, Options } from "$lib/types";

export function optionsFromSections(sections: ConfigurationSection[]): Options {
    const config: Options = {};
    for (const group of sections) {
        for (const option of group.options) {
            config[option.key] = option.defaultValue;
        }
    }

    return config;
}
