import { writable } from "svelte/store";
import { editorConfigDescription, editorConfig } from "./configs/editorConfig";
import {
    appearanceConfigDescription,
    appearanceConfig,
} from "./configs/appearanceConfig";
import { OptionType, type Command, type ConfigOptions } from "$lib/types";
import { get } from "svelte/store";

// List all configuration groups here
const configGroups = [
    {
        name: "editorConfig",
        description: editorConfigDescription,
        store: editorConfig,
    },
    {
        name: "appearanceConfig",
        description: appearanceConfigDescription,
        store: appearanceConfig,
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

export function runCommandList(script: string): void {
    const normalizedScript = script.replace(/\r\n|\r/g, "\n");
    const commands = normalizedScript
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    for (const command of commands) {
        runCommand(command);
    }
}

export function runCommand(command: string): void {
    const currentCommands = get(commandList);
    const matchedCommand = currentCommands.find((cmd) =>
        cmd.pattern.test(command)
    );

    if (matchedCommand) {
        const args = command.match(matchedCommand.pattern);
        if (args) {
            matchedCommand.execute(args);
        } else {
            matchedCommand.execute([]);
        }
    }
}
