import { randomUUID } from "crypto";

export type Note = {
  id: string;
  text: string;
  isDone: boolean;
};

let notes = new Map<string, Note>();

export function createNote(text: string): Note {
  const note = { id: randomUUID(), text, isDone: false };
  notes.set(note.id, note);
  return note;
}

export function deleteNote(id: string): void {
  notes.delete(id);
}

export function getNote(id: string): Note | undefined {
  return notes.get(id);
}

export function listNotes(): Note[] {
  return [...notes.values()];
}
