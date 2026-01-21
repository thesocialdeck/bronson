import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Calendar, ParseResult } from "@/lib/types";

// Month order for sorting and section creation
const MONTH_ORDER = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function useCalendar() {
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarPath, setCalendarPath] = useState<string | null>(null);
  const [calendarDir, setCalendarDir] = useState<string | null>(null);

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const dir = await invoke<string>("get_calendar_dir");
      setCalendarDir(dir);
      const year = new Date().getFullYear();
      const path = `${dir}/${year}.md`;
      setCalendarPath(path);

      const exists = await invoke<boolean>("file_exists", { path });
      if (!exists) {
        // Create a default calendar file
        const defaultContent = `# ${year}\n\n## Recurring\n\n## January\n\n## February\n\n## March\n\n## April\n\n## May\n\n## June\n\n## July\n\n## August\n\n## September\n\n## October\n\n## November\n\n## December\n`;
        await invoke("ensure_directory", { path: dir });
        await invoke("write_file", { path, content: defaultContent });
      }

      const result = await invoke<ParseResult<Calendar>>(
        "parse_calendar_file",
        { path },
      );
      setCalendar(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const insertEvent = useCallback(
    async (
      line: string,
      month: string,
      year?: number,
    ): Promise<number | null> => {
      if (!calendarDir) return null;

      try {
        // Determine which year file to use
        const targetYear = year ?? new Date().getFullYear();
        const targetPath = `${calendarDir}/${targetYear}.md`;

        // Check if the year file exists, create if not
        const exists = await invoke<boolean>("file_exists", {
          path: targetPath,
        });
        if (!exists) {
          const defaultContent = `# ${targetYear}\n\n## Recurring\n\n## January\n\n## February\n\n## March\n\n## April\n\n## May\n\n## June\n\n## July\n\n## August\n\n## September\n\n## October\n\n## November\n\n## December\n`;
          await invoke("ensure_directory", { path: calendarDir });
          await invoke("write_file", {
            path: targetPath,
            content: defaultContent,
          });
        }

        // Read current content to check if month section exists
        const content = await invoke<string>("read_file", { path: targetPath });
        const monthPattern = new RegExp(`^## ${month}\\s*$`, "im");

        if (!monthPattern.test(content)) {
          // Month section doesn't exist - need to add it in the right place
          const lines = content.split("\n");
          const monthIndex = MONTH_ORDER.indexOf(month);

          if (monthIndex !== -1) {
            // Find where to insert the new month section
            let insertLineIndex = lines.length;

            // Look for the next month that exists after our target month
            for (let i = monthIndex + 1; i < MONTH_ORDER.length; i++) {
              const nextMonthPattern = new RegExp(
                `^## ${MONTH_ORDER[i]}\\s*$`,
                "i",
              );
              const foundIndex = lines.findIndex((l) =>
                nextMonthPattern.test(l),
              );
              if (foundIndex !== -1) {
                insertLineIndex = foundIndex;
                break;
              }
            }

            // Insert the new month section
            lines.splice(insertLineIndex, 0, `## ${month}`, "");
            await invoke("write_file", {
              path: targetPath,
              content: lines.join("\n"),
            });
          }
        }

        // Now insert the event
        const lineNumber = await invoke<number>("insert_event", {
          path: targetPath,
          line,
          month,
        });

        // Reload if we modified the current year's calendar
        if (targetPath === calendarPath) {
          await loadCalendar();
        }

        return lineNumber;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return null;
      }
    },
    [calendarDir, calendarPath, loadCalendar],
  );

  const readCalendarFile = useCallback(async (): Promise<string | null> => {
    if (!calendarPath) return null;

    try {
      return await invoke<string>("read_file", { path: calendarPath });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [calendarPath]);

  const writeCalendarFile = useCallback(
    async (content: string): Promise<boolean> => {
      if (!calendarPath) return false;

      try {
        await invoke("write_file", { path: calendarPath, content });
        await loadCalendar();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return false;
      }
    },
    [calendarPath, loadCalendar],
  );

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  return {
    calendar,
    loading,
    error,
    calendarPath,
    loadCalendar,
    insertEvent,
    readCalendarFile,
    writeCalendarFile,
  };
}
