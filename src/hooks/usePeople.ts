import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { PeopleData, ParseResult, Person } from "@/lib/types";

// Birthday event type for calendar integration
export interface BirthdayEvent {
  id: string;
  personId: string;
  personName: string;
  date: { month: number; day: number }; // 0-indexed month
  birthYear: number | null; // null if not specified
  color: string | null;
}

// Parse a birthday string like "sep 14", "14 sep", "sep 14 1990", "1990-09-14"
function parseBirthdayDate(
  dateStr: string,
): { month: number; day: number; year: number | null } | null {
  const monthNames: Record<string, number> = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
  };

  const normalized = dateStr.toLowerCase().trim();

  // Try ISO format: 1990-09-14
  const isoMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1], 10),
      month: parseInt(isoMatch[2], 10) - 1,
      day: parseInt(isoMatch[3], 10),
    };
  }

  // Try "month day year" or "month day": sep 14 1990, sep 14
  const monthFirstMatch = normalized.match(
    /^([a-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?$/,
  );
  if (monthFirstMatch) {
    const month = monthNames[monthFirstMatch[1]];
    if (month !== undefined) {
      return {
        month,
        day: parseInt(monthFirstMatch[2], 10),
        year: monthFirstMatch[3] ? parseInt(monthFirstMatch[3], 10) : null,
      };
    }
  }

  // Try "day month year" or "day month": 14 sep 1990, 14 sep
  const dayFirstMatch = normalized.match(
    /^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/,
  );
  if (dayFirstMatch) {
    const month = monthNames[dayFirstMatch[2]];
    if (month !== undefined) {
      return {
        month,
        day: parseInt(dayFirstMatch[1], 10),
        year: dayFirstMatch[3] ? parseInt(dayFirstMatch[3], 10) : null,
      };
    }
  }

  // Try "day/month/year" or "day/month": 14/9/1990, 14/9
  const slashMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
  if (slashMatch) {
    return {
      day: parseInt(slashMatch[1], 10),
      month: parseInt(slashMatch[2], 10) - 1,
      year: slashMatch[3] ? parseInt(slashMatch[3], 10) : null,
    };
  }

  return null;
}

// Extract birthday from a person's fields
function extractBirthday(person: Person): BirthdayEvent | null {
  const birthdayStr = person.fields["birthday"] || person.fields["born"];
  if (!birthdayStr) return null;

  const parsed = parseBirthdayDate(birthdayStr);
  if (!parsed) return null;

  return {
    id: `birthday-${person.id}`,
    personId: person.id,
    personName: person.name,
    date: { month: parsed.month, day: parsed.day },
    birthYear: parsed.year,
    color: person.color,
  };
}

export function usePeople() {
  const [people, setPeople] = useState<PeopleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [peoplePath, setPeoplePath] = useState<string | null>(null);

  const loadPeople = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const dir = await invoke<string>("get_calendar_dir");
      const path = `${dir}/people.md`;
      setPeoplePath(path);

      const exists = await invoke<boolean>("file_exists", { path });
      if (!exists) {
        // Create a default people file
        const defaultContent = `# People\n\n## Family\n\n## Friends\n\n## Work\n`;
        await invoke("ensure_directory", { path: dir });
        await invoke("write_file", { path, content: defaultContent });
      }

      const result = await invoke<ParseResult<PeopleData>>(
        "parse_people_file",
        { path },
      );
      setPeople(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const readPeopleFile = useCallback(async (): Promise<string | null> => {
    if (!peoplePath) return null;

    try {
      return await invoke<string>("read_file", { path: peoplePath });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [peoplePath]);

  const writePeopleFile = useCallback(
    async (content: string): Promise<boolean> => {
      if (!peoplePath) return false;

      try {
        await invoke("write_file", { path: peoplePath, content });
        await loadPeople();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return false;
      }
    },
    [peoplePath, loadPeople],
  );

  // Get all person IDs for autocomplete
  const getAllPersonIds = useCallback((): string[] => {
    if (!people) return [];

    const ids: string[] = [];
    for (const context of people.contexts) {
      for (const person of context.people) {
        ids.push(person.id);
        // Also include family member IDs
        if (person.members) {
          for (const member of person.members) {
            ids.push(member.id);
          }
        }
      }
    }
    return ids;
  }, [people]);

  // Get family members (people in the "Family" context) with their colors
  const getFamilyMembers = useCallback((): Array<{
    id: string;
    name: string;
    color: string | null;
  }> => {
    if (!people) return [];

    const familyContext = people.contexts.find(
      (c) => c.id === "family" || c.name.toLowerCase() === "family",
    );
    if (!familyContext) return [];

    return familyContext.people.map((person) => ({
      id: person.id,
      name: person.name,
      color: person.color,
    }));
  }, [people]);

  // Get a person by ID
  const getPerson = useCallback(
    (id: string) => {
      if (!people) return null;

      for (const context of people.contexts) {
        for (const person of context.people) {
          if (person.id === id) return person;
          // Check members too
          for (const member of person.members) {
            if (member.id === id) {
              // Return a person-like object for members
              return {
                id: member.id,
                name: member.name,
                subtitle: null,
                color: null,
                fields: member.fields,
                notes: [],
                log: [],
                members: [],
                line_number: 0,
              };
            }
          }
        }
      }
      return null;
    },
    [people],
  );

  // Get all birthdays from the people data
  const getBirthdays = useCallback((): BirthdayEvent[] => {
    if (!people) return [];

    const birthdays: BirthdayEvent[] = [];

    for (const context of people.contexts) {
      for (const person of context.people) {
        const birthday = extractBirthday(person);
        if (birthday) {
          birthdays.push(birthday);
        }

        // Also check members (e.g., family members within a household)
        for (const member of person.members) {
          const memberBirthdayStr =
            member.fields["birthday"] || member.fields["born"];
          if (memberBirthdayStr) {
            const parsed = parseBirthdayDate(memberBirthdayStr);
            if (parsed) {
              birthdays.push({
                id: `birthday-${member.id}`,
                personId: member.id,
                personName: member.name,
                date: { month: parsed.month, day: parsed.day },
                birthYear: parsed.year,
                color: null,
              });
            }
          }
        }
      }
    }

    return birthdays;
  }, [people]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  return {
    people,
    loading,
    error,
    peoplePath,
    loadPeople,
    readPeopleFile,
    writePeopleFile,
    getAllPersonIds,
    getFamilyMembers,
    getPerson,
    getBirthdays,
  };
}
