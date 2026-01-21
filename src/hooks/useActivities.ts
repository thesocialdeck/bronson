import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { ActivitiesData, Activity, ParseResult } from "@/lib/types";

export function useActivities() {
  const [activities, setActivities] = useState<ActivitiesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activitiesPath, setActivitiesPath] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const dir = await invoke<string>("get_calendar_dir");
      const path = `${dir}/activities.md`;
      setActivitiesPath(path);

      const exists = await invoke<boolean>("file_exists", { path });
      if (!exists) {
        // Create a default activities file
        const defaultContent = `# Activities\n\n## Sport\n\n### +sport\nicon: ⚽\ncolor: #10B981\n\n## Social\n\n### +social\nicon: 🎉\ncolor: #EC4899\n\n## Medical\n\n### +appointment\nicon: 🗓️\ncolor: #6366F1\n`;
        await invoke("ensure_directory", { path: dir });
        await invoke("write_file", { path, content: defaultContent });
      }

      const result = await invoke<ParseResult<ActivitiesData>>(
        "parse_activities_file",
        { path },
      );
      setActivities(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const readActivitiesFile = useCallback(async (): Promise<string | null> => {
    if (!activitiesPath) return null;

    try {
      return await invoke<string>("read_file", { path: activitiesPath });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [activitiesPath]);

  const writeActivitiesFile = useCallback(
    async (content: string): Promise<boolean> => {
      if (!activitiesPath) return false;

      try {
        await invoke("write_file", { path: activitiesPath, content });
        await loadActivities();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return false;
      }
    },
    [activitiesPath, loadActivities],
  );

  // Get all activity IDs for autocomplete
  const getAllActivityIds = useCallback((): string[] => {
    if (!activities) return [];

    const ids: string[] = [];
    for (const category of activities.categories) {
      for (const activity of category.activities) {
        ids.push(activity.id);
      }
    }
    return ids;
  }, [activities]);

  // Get activity by ID
  const getActivity = useCallback(
    (id: string): Activity | null => {
      if (!activities) return null;

      for (const category of activities.categories) {
        for (const activity of category.activities) {
          if (activity.id === id) {
            return activity;
          }
        }
      }
      return null;
    },
    [activities],
  );

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  return {
    activities,
    loading,
    error,
    activitiesPath,
    loadActivities,
    readActivitiesFile,
    writeActivitiesFile,
    getAllActivityIds,
    getActivity,
  };
}
