"use client";

import { app, authentication } from "@microsoft/teams-js";
import { useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3978";

type Resolution = {
  channel_name: string | null;
  resolution_status: string;
  resolved: boolean;
};

export default function TeamsChannelContextPage() {
  const [message, setMessage] = useState("Reading this Teams channel…");
  const [resolution, setResolution] = useState<Resolution | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveChannelContext() {
      try {
        await app.initialize();
        const context = await app.getContext();
        const tenantId = context.user?.tenant?.id?.trim();
        const teamId = context.team?.internalId?.trim();
        const channelId = context.channel?.id?.trim();
        const channelName = context.channel?.displayName?.trim();

        if (!tenantId || !teamId || !channelId || !channelName) {
          throw new Error("Teams did not provide a complete named channel context.");
        }

        // The token remains in memory for this request only. It is never persisted
        // in localStorage or sessionStorage.
        const token = await authentication.getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/teams/channel-context`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tenant_id: tenantId,
            team_id: teamId,
            team_name: context.team?.displayName?.trim() || null,
            channel_id: channelId,
            channel_name: channelName,
          }),
        });
        const body = (await response.json()) as {
          success?: boolean;
          data?: Resolution;
          error?: { message?: string };
        };
        if (!response.ok || !body.success || !body.data) {
          throw new Error(body.error?.message ?? "The channel context could not be saved.");
        }
        if (!cancelled) {
          setResolution(body.data);
          setMessage(
            body.data.resolved
              ? `Channel resolved as “${body.data.channel_name}”.`
              : `Channel is already resolved as “${body.data.channel_name}”.`,
          );
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "The Teams channel context could not be read.");
        }
      }
    }

    void resolveChannelContext();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
        StratSync Teams
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-slate-950">Channel context</h1>
      <p className="mt-3 text-slate-600" role="status">{message}</p>
      {resolution && (
        <p className="mt-4 text-sm text-slate-500">
          Resolution status: {resolution.resolution_status}
        </p>
      )}
    </main>
  );
}
