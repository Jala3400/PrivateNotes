export interface OpenedFolder {
    name: string;
    path: string;
    notes: NoteInfo[];
}

export interface NoteInfo {
    name: string;
    path: string;
}
