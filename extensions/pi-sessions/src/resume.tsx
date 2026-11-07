import {
  List,
  ActionPanel,
  Action,
  Icon,
  Color,
  closeMainWindow,
  confirmAlert,
  Alert,
  showToast,
  Toast,
} from "@vicinae/api";
import fs from "node:fs";
import React, { useState, useEffect, useCallback } from "react";
import { getSessions } from "./scanner";
import { launchPiSession } from "./launcher";
import { formatTimeAgo } from "./utils";
import { removeFromCache } from "./cache";
import { SessionEntry } from "./types";

export default function ResumeCommand() {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const list = await getSessions(force);
      setSessions(list);
    } catch (err) {
      console.error("Failed to load pi sessions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelect = useCallback((session: SessionEntry) => {
    closeMainWindow();
    launchPiSession(session);
  }, []);

  const handleDelete = useCallback(async (session: SessionEntry) => {
    const sessionLabel =
      session.name ||
      session.firstPrompt?.slice(0, 40) ||
      session.id.slice(0, 8);

    const confirmed = await confirmAlert({
      title: "Delete Pi Session?",
      message: `Permanently delete "${sessionLabel}"? This removes the session file from disk.`,
      primaryAction: {
        title: "Delete",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (!confirmed) return;

    try {
      if (fs.existsSync(session.filePath)) {
        fs.unlinkSync(session.filePath);
      }
      removeFromCache(session.filePath);
      setSessions((prev) => prev.filter((s) => s.filePath !== session.filePath));
      await showToast({
        style: Toast.Style.Success,
        title: "Session deleted",
        message: sessionLabel,
      });
    } catch (err: any) {
      console.error("Failed to delete session file:", err);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to delete session",
        message: err.message || String(err),
      });
    }
  }, []);

  return (
    <List
      isLoading={loading}
      searchBarPlaceholder="Search pi sessions by name, goal, or keywords..."
      filtering={true}
    >
      {sessions.map((session) => {
        const title =
          session.name ||
          session.compactionGoal ||
          session.firstPrompt ||
          `Session ${session.id.slice(0, 8)}`;

        const cleanCwd = session.cwd.replace(process.env.HOME || "", "~");

        const accessories: List.Item.Accessory[] = [
          { text: formatTimeAgo(session.mtime) },
        ];

        if (session.name) {
          accessories.unshift({
            tag: { value: "Named", color: Color.Green },
          });
        }

        return (
          <List.Item
            key={session.filePath}
            title={title}
            subtitle={cleanCwd}
            keywords={session.keywords}
            icon="icon.png"
            accessories={accessories}
            actions={
              <ActionPanel>
                <Action
                  title="Resume in tmux"
                  icon={Icon.Terminal}
                  onAction={() => handleSelect(session)}
                />
                <Action.CopyToClipboard
                  title="Copy Resume Command"
                  content={`pi --session "${session.filePath}"`}
                />
                <Action.CopyToClipboard
                  title="Copy Session Path"
                  content={session.filePath}
                />
                <Action.CopyToClipboard
                  title="Copy Session ID"
                  content={session.id}
                />
                <Action.CopyToClipboard
                  title="Copy Working Directory"
                  content={session.cwd}
                />
                <ActionPanel.Section>
                  <Action
                    title="Delete Session"
                    icon={Icon.Trash}
                    style="destructive"
                    shortcut={{ modifiers: ["ctrl"], key: "x" }}
                    onAction={() => handleDelete(session)}
                  />
                  <Action
                    title="Refresh Sessions"
                    icon={Icon.ArrowClockwise}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                    onAction={() => loadData(true)}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
