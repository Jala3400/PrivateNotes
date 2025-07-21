import { writable } from "svelte/store";
import { configGroupList } from "./configGroups";
import {
    OptionType,
    type Command,
    type ConfigurationGroup,
    type Options,
} from "$lib/types";
import { get } from "svelte/store";

function makeCommandsFromGroup(group: ConfigurationGroup, store: Options) {
    const commands: Command[] = [];
    for (const section of group.sections) {
        for (const { key, type } of section.options) {
            if (type === OptionType.NUMBER) {
                commands.push({
                    name: `set ${key} `,
                    pattern: new RegExp(`^set\\s+${key}\\s+(\\d+)$`, "i"),
                    requireArgs: true,
                    execute: (args: string[]) => {
                        const value = Number(args[0]);
                        store.update((cfg: Options) => {
                            cfg[key] = value;
                            return cfg;
                        });
                    },
                });
            } else if (type === OptionType.BOOLEAN) {
                commands.push({
                    name: `enable ${key}`,
                    pattern: new RegExp(`^enable\\s+${key}$`, "i"),
                    execute: () => {
                        store.update((cfg: Options) => {
                            cfg[key] = true;
                            return cfg;
                        });
                    },
                });

                commands.push({
                    name: `disable ${key}`,
                    pattern: new RegExp(`^disable\\s+${key}$`, "i"),
                    execute: () => {
                        store.update((cfg: Options) => {
                            cfg[key] = false;
                            return cfg;
                        });
                    },
                });

                commands.push({
                    name: `toggle ${key}`,
                    pattern: new RegExp(`^toggle\\s+${key}$`, "i"),
                    execute: () => {
                        store.update((cfg: Options) => {
                            cfg[key] = !cfg[key];
                            return cfg;
                        });
                    },
                });
            }
        }
    }
    return commands;
}

// Generate commands for all config groups
const allCommands = configGroupList.flatMap((group) =>
    makeCommandsFromGroup(group, group.store)
);

export const commandList = writable<Command[]>(allCommands);

export function runCommandScript(script: string): void {
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
