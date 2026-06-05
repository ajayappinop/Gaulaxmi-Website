import type { Document, Filter } from 'mongodb';

export function toMongoDoc<T extends { id: string }>(item: T): Document {
  return { _id: item.id, ...item } as Document;
}

export function fromMongoDoc<T>(doc: Document): T {
  const { _id: _ignored, ...rest } = doc;
  return rest as T;
}

export function idFilter(id: string): Filter<Document> {
  return { _id: id } as unknown as Filter<Document>;
}

export function settingsFilter(id: string): Filter<Document> {
  return { _id: id } as unknown as Filter<Document>;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
