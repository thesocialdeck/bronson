import matter from 'gray-matter';

export function parseMarkdownEntries(content: string): any[] {
  // Split by --- to get individual entries
  const entries = content.split(/\n---\n/).filter(e => e.trim());

  return entries.map(entry => {
    try {
      const parsed = matter(`---\n${entry}\n---`);
      return parsed.data;
    } catch (error) {
      console.error('Failed to parse entry:', error);
      return null;
    }
  }).filter(Boolean);
}

export function stringifyMarkdownEntry(data: any): string {
  return matter.stringify('', data);
}

export function updateMarkdownEntry(content: string, id: string, newData: any): string {
  const entries = content.split(/\n---\n/).filter(e => e.trim());

  const updated = entries.map(entry => {
    try {
      const parsed = matter(`---\n${entry}\n---`);
      if (parsed.data.id === id) {
        return matter.stringify('', { ...parsed.data, ...newData });
      }
      return `---\n${entry}\n---`;
    } catch (error) {
      return `---\n${entry}\n---`;
    }
  });

  return updated.join('\n');
}

export function deleteMarkdownEntry(content: string, id: string): string {
  const entries = content.split(/\n---\n/).filter(e => e.trim());

  const filtered = entries.filter(entry => {
    try {
      const parsed = matter(`---\n${entry}\n---`);
      return parsed.data.id !== id;
    } catch (error) {
      return true;
    }
  });

  return filtered.map(e => `---\n${e.trim()}\n---`).join('\n');
}
