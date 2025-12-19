import { keymap } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { tableStateField } from "./TablePlugin/tableStateField";
import { createTableKeymap } from "./TablePlugin/tableKeymap";
import { TableWidget } from "./TablePlugin/TableWidget";

/**
 * CodeMirror plugin for rendering and editing Markdown tables
 */
export function tableRendererPlugin(): Extension {
    return [
        // StateField for block decorations (required by CodeMirror)
        tableStateField,

        // Register keyboard shortcuts for table navigation
        keymap.of(createTableKeymap(tableStateField)),
    ];
}

// Export the state field and TableWidget for external access
export { tableStateField, TableWidget };

