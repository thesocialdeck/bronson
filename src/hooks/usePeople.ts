import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { PeopleData, ParseResult } from "@/lib/types";

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
  };
}
