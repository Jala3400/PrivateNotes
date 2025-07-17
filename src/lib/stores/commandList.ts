import { writable } from "svelte/store";
import {
    editorConfigDescription,
    editorConfig,
} from "./editorConfig";
import {
    appearanceConfigDescription,
    appearanceConfig,
} from "./appearanceConfig";
import { OptionType, type Command, type ConfigOptions } from "$lib/types";

// List all configuration groups here
const configGroups = [
    {
        name: "editorConfig",
        description: editorConfigDescription,
        store: editorConfig,
        // setter: setEditorConfig,
    },
    {
        name: "appearanceConfig",
        description: appearanceConfigDescription,
        store: appearanceConfig,
        // setter: setAppearanceConfig,
    },
];

function makeCommandsFromConfig(
    configDescription: typeof editorConfigDescription,
    getConfig: ConfigOptions
) {
    const commands: Command[] = [];
    for (const [section, options] of configDescription) {
        for (const [key, option, type] of options) {
            if (type === OptionType.NUMBER) {
                commands.push({
                    name: `set ${key} `,
                    pattern: new RegExp(`^set ${key} (\\d+) *$`, "i"),
                    requireArgs: true,
                    execute: (args: string[]) => {
                        const value = Number(args[0]);
                        getConfig.update((cfg: ConfigOptions) => {
                            const newCfg = { ...cfg, [key]: value };
                            return newCfg;
                        });
                    },
                });
            } else if (type === OptionType.BOOLEAN) {
                commands.push({
                    name: `enable ${key}`,
                    pattern: new RegExp(`^enable ${key}$`, "i"),
                    execute: () => {
                        getConfig.update((cfg: ConfigOptions) => {
                            const newCfg = { ...cfg, [key]: true };
                            return newCfg;
                        });
                    },
                });
                commands.push({
                    name: `disable ${key}`,
                    pattern: new RegExp(`^disable ${key}$`, "i"),
                    execute: () => {
                        getConfig.update((cfg: ConfigOptions) => {
                            const newCfg = { ...cfg, [key]: false };
                            return newCfg;
                        });
                    },
                });
                commands.push({
                    name: `toggle ${key}`,
                    pattern: new RegExp(`^toggle ${key}$`, "i"),
                    execute: () => {
                        getConfig.update((cfg: ConfigOptions) => {
                            const newCfg = { ...cfg, [key]: !cfg[key] };
                            return newCfg;
                        });
                    },
                });
            }
        }
    }
    return commands;
}

// Generate commands for all config groups
const allCommands = configGroups.flatMap((group) =>
    makeCommandsFromConfig(group.description, group.store)
);

export const commandList = writable<Command[]>(allCommands);
