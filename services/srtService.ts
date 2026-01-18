
import { SrtEntry } from '../types';

/**
 * Parses a raw SRT string into an array of SrtEntry objects.
 */
export const parseSrt = (content: string): SrtEntry[] => {
  const normalizedContent = content.replace(/\r\n/g, '\n').trim();
  const blocks = normalizedContent.split(/\n\n+/);
  
  return blocks.map(block => {
    const lines = block.split('\n');
    if (lines.length < 3) return null;
    
    const id = lines[0].trim();
    const timestamp = lines[1].trim();
    const text = lines.slice(2).join('\n').trim();
    
    return { id, timestamp, text };
  }).filter((entry): entry is SrtEntry => entry !== null);
};

/**
 * Reconstructs an SRT string from an array of SrtEntry objects.
 */
export const stringifySrt = (entries: SrtEntry[]): string => {
  return entries
    .map(entry => `${entry.id}\n${entry.timestamp}\n${entry.text}`)
    .join('\n\n');
};

/**
 * Splits an array of entries into batches of a specific size.
 */
export const chunkEntries = <T,>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};
