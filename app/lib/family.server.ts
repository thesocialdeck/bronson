import fs from 'fs/promises';
import path from 'path';
import type { FamilyMember } from '~/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const FAMILY_FILE = path.join(DATA_DIR, 'family.md');

// Default family members (fallback)
export const DEFAULT_FAMILY: FamilyMember[] = [
  { name: 'Oliver', color: 'blue', avatar: 'O' },
  { name: 'Ella', color: 'pink', avatar: 'E' },
  { name: 'Kate', color: 'emerald', avatar: 'K' },
  { name: 'Steven', color: 'amber', avatar: 'S' },
];

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  try {
    const content = await fs.readFile(FAMILY_FILE, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    const members: FamilyMember[] = [];

    for (const line of lines) {
      // Format: Name | Color | Avatar
      const parts = line.split('|').map(p => p.trim());
      if (parts.length === 3) {
        members.push({
          name: parts[0],
          color: parts[1] as FamilyMember['color'],
          avatar: parts[2],
        });
      }
    }

    return members.length > 0 ? members : DEFAULT_FAMILY;
  } catch (error) {
    // File doesn't exist yet - return empty array to trigger onboarding
    return [];
  }
}

export async function saveFamilyMembers(members: FamilyMember[]): Promise<void> {
  // Ensure data directory exists
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  // Format: Name | Color | Avatar
  const lines = members.map(m => `${m.name} | ${m.color} | ${m.avatar}`);
  const content = lines.join('\n') + '\n';

  await fs.writeFile(FAMILY_FILE, content, 'utf-8');
}

export async function hasFamilySetup(): Promise<boolean> {
  try {
    const members = await getFamilyMembers();
    return members.length > 0;
  } catch {
    return false;
  }
}
