import { configGroupList } from "./configGroups";
import {
    OptionType,
    type Command,
    type ConfigurationGroup,
    type Options,
} from "$lib/types";

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
export const commandList = configGroupList.flatMap((group) =>
    makeCommandsFromGroup(group, group.store)
);

export function runCommandScript(script: string): void {
    const normalizedScript = script.replace(/\r\n|\r/g, "\n");
    const commands = normalizedScript
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    for (const command of commands) {
        runCommandByName(command);
    }
}

export function runCommandByName(command: string): void {
    const matchedCommand = commandList.find((cmd) => cmd.pattern.test(command));

    if (!matchedCommand) {
        console.warn("Command not found: " + command);
        return;
    }

    const args = command.match(matchedCommand.pattern)?.slice(1) ?? [];

    if (matchedCommand.requireArgs && !args?.length) {
        console.warn("Not enough arguments for command " + matchedCommand.name);
    } else {
        matchedCommand.execute(args);
    }
}
