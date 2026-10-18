"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, Loader2, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SeverityBadge } from "@/components/common";
import { TeamsPreview } from "@/components/teams-preview";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getActiveInstallations, getChannelDisplayName, getConfiguredChannels, getInstallationDisplayName } from "@/lib/teams";
import { useInstallations, useRisks, useSendNotification } from "@/lib/hooks";

const schema = z.object({ risk_id: z.string().min(1, "Select a risk"), team_id: z.string().min(1, "Select a Team"), channel_id: z.string().min(1, "Select a channel") });
type FormValues = z.infer<typeof schema>;

export function SendNotificationDialog({ initialRiskId, triggerLabel = "Send Risk Alert", compact = false }: { initialRiskId?: string; triggerLabel?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const risks = useRisks();
  const installationsQuery = useInstallations();
  const sendNotification = useSendNotification();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { risk_id: initialRiskId ?? "", team_id: "", channel_id: "" } });
  const riskId = useWatch({ control: form.control, name: "risk_id" });
  const teamId = useWatch({ control: form.control, name: "team_id" });
  const channelId = useWatch({ control: form.control, name: "channel_id" });
  const selectedRisk = useMemo(() => risks.data?.find((risk) => risk.risk_id === riskId), [risks.data, riskId]);
  const activeInstallations = useMemo(() => getActiveInstallations(installationsQuery.data ?? []), [installationsQuery.data]);
  const selectedInstallation = useMemo(() => activeInstallations.find((installation) => installation.team_id === teamId), [activeInstallations, teamId]);
  const configuredChannels = useMemo(() => selectedInstallation ? getConfiguredChannels(selectedInstallation) : [], [selectedInstallation]);
  const selectedChannel = useMemo(() => configuredChannels.find((channel) => channel.channel_id === channelId), [configuredChannels, channelId]);
  const isSending = sendNotification.isPending;

  useEffect(() => { if (initialRiskId) form.setValue("risk_id", initialRiskId); }, [form, initialRiskId]);

  async function submit(values: FormValues) {
    const installation = activeInstallations.find((item) => item.team_id === values.team_id);
    const channel = installation ? getConfiguredChannels(installation).find((item) => item.channel_id === values.channel_id) : undefined;
    if (!installation || !channel || !channel.destination_id) {
      form.setError("channel_id", { message: "Select a configured Teams channel." });
      return;
    }
    try {
      const result = await sendNotification.mutateAsync({ destination_id: channel.destination_id, risk_id: values.risk_id });
      setResultId(result.notification_id);
      toast.success("Notification sent successfully");
    } catch (error) {
      toast.error(`Notification send failed: ${error instanceof Error ? error.message : "The notification could not be sent."}`);
    }
  }

  function handleTeamChange(value: string) {
    form.setValue("team_id", value, { shouldValidate: true });
    form.setValue("channel_id", "", { shouldValidate: false });
    form.clearErrors("channel_id");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setResultId(null);
      sendNotification.reset();
      form.reset({ risk_id: initialRiskId ?? "", team_id: "", channel_id: "" });
    }
  }

  const installationsUnavailable = installationsQuery.isLoading || installationsQuery.isError || activeInstallations.length === 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild><Button size={compact ? "sm" : "default"} className="bg-cyan-600 text-white hover:bg-cyan-700"><Send className="size-4" />{triggerLabel}</Button></DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-3xl">
        {resultId ? <div className="p-8 text-center"><CheckCircle2 className="mx-auto size-12 text-emerald-600" /><DialogTitle className="mt-4 text-xl">Notification sent successfully</DialogTitle><DialogDescription className="mt-2">The risk alert was accepted for delivery to Microsoft Teams.</DialogDescription><div className="mx-auto mt-5 max-w-sm rounded-xl bg-slate-50 p-4 text-left text-sm"><p className="text-slate-500">Notification ID</p><p className="mt-1 font-mono font-semibold text-slate-900">{resultId}</p></div><Button className="mt-6" onClick={() => handleOpenChange(false)}>Done</Button></div> : <form onSubmit={form.handleSubmit(submit)}>
          <DialogHeader className="border-b px-6 py-5"><DialogTitle>Send Risk Alert to Microsoft Teams</DialogTitle><DialogDescription>Select a risk, active Team, and configured channel.</DialogDescription></DialogHeader>
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_.9fr]">
            <div className="space-y-5">
              <div className="space-y-2"><Label htmlFor="risk">1. Select risk</Label><Select value={riskId} onValueChange={(value) => form.setValue("risk_id", value, { shouldValidate: true })}><SelectTrigger id="risk" className="h-11 w-full"><SelectValue placeholder="Choose a risk" /></SelectTrigger><SelectContent>{risks.data?.map((risk) => <SelectItem key={risk.risk_id} value={risk.risk_id}>{risk.risk_id} · {risk.title}</SelectItem>)}</SelectContent></Select>{form.formState.errors.risk_id && <p className="text-sm text-rose-600">{form.formState.errors.risk_id.message}</p>}</div>
              {selectedRisk && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{selectedRisk.title}</p><p className="mt-1 text-sm text-slate-500">{selectedRisk.subtitle ?? selectedRisk.summary ?? selectedRisk.risk_id}</p></div>{selectedRisk.severity && <SeverityBadge severity={selectedRisk.severity} />}</div></div>}
              {installationsQuery.isLoading && <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"><Loader2 className="size-4 animate-spin" />Loading Microsoft Teams installations…</div>}
              {installationsQuery.isError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><p>{installationsQuery.error instanceof Error ? installationsQuery.error.message : "Microsoft Teams installations could not be loaded."}</p><Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => installationsQuery.refetch()}>Retry</Button></div>}
              {!installationsQuery.isLoading && !installationsQuery.isError && activeInstallations.length === 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">No active Microsoft Teams installations are connected.</div>}
              {activeInstallations.length > 0 && <>
                <div className="space-y-2"><Label htmlFor="team">2. Select Team</Label><Select value={teamId} onValueChange={handleTeamChange}><SelectTrigger id="team" className="h-11 w-full"><SelectValue placeholder="Choose a Team" /></SelectTrigger><SelectContent>{activeInstallations.map((installation) => <SelectItem key={installation.team_id} value={installation.team_id}>{getInstallationDisplayName(installation)}</SelectItem>)}</SelectContent></Select>{form.formState.errors.team_id && <p className="text-sm text-rose-600">{form.formState.errors.team_id.message}</p>}</div>
                <div className="space-y-2"><Label htmlFor="channel">3. Select channel</Label><Select value={channelId} onValueChange={(value) => form.setValue("channel_id", value, { shouldValidate: true })} disabled={!selectedInstallation || configuredChannels.length === 0}><SelectTrigger id="channel" className="h-11 w-full"><SelectValue placeholder={selectedInstallation ? "Choose a configured channel" : "Choose a Team first"} /></SelectTrigger><SelectContent>{configuredChannels.map((channel) => <SelectItem key={channel.channel_id} value={channel.channel_id}>{getChannelDisplayName(channel)}</SelectItem>)}</SelectContent></Select>{selectedInstallation && configuredChannels.length === 0 && <p className="text-sm text-slate-500">No configured channels available for this Team.</p>}{form.formState.errors.channel_id && <p className="text-sm text-rose-600">{form.formState.errors.channel_id.message}</p>}</div>
              </>}
              {selectedInstallation && selectedChannel && <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4"><div><p className="font-semibold text-slate-900">{getInstallationDisplayName(selectedInstallation)}</p><p className="text-sm text-slate-500">{getChannelDisplayName(selectedChannel)}</p></div><span className="text-sm font-semibold text-emerald-700">Configured</span></div>}
            </div>
            <div><Tabs defaultValue="summary"><TabsList className="mb-3 w-full"><TabsTrigger value="summary" className="flex-1">Summary</TabsTrigger><TabsTrigger value="preview" className="flex-1">Teams preview</TabsTrigger></TabsList><TabsContent value="summary" className="rounded-xl border bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-900">Delivery checklist</p><div className="mt-4 space-y-3 text-sm text-slate-600"><p className="flex gap-2"><ArrowRight className="mt-0.5 size-4 shrink-0 text-cyan-700" />Only the risk and resolved destination IDs are sent.</p><p className="flex gap-2"><ArrowRight className="mt-0.5 size-4 shrink-0 text-cyan-700" />The backend controls routing, credentials, and card rendering.</p><p className="flex gap-2"><ArrowRight className="mt-0.5 size-4 shrink-0 text-cyan-700" />Delivery result is recorded by the notification service.</p></div></TabsContent><TabsContent value="preview">{selectedRisk ? <TeamsPreview risk={selectedRisk} /> : <div className="grid min-h-56 place-items-center rounded-xl border border-dashed text-sm text-slate-500">Select a risk to preview its card.</div>}</TabsContent></Tabs></div>
          </div>
          <DialogFooter className="border-t bg-slate-50 px-6 py-4"><Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button><Button type="submit" disabled={isSending || installationsUnavailable || !selectedRisk || !selectedInstallation || !selectedChannel} className="bg-cyan-600 hover:bg-cyan-700">{isSending ? <><Loader2 className="animate-spin" />Sending to Teams...</> : <><Send />Send Notification</>}</Button></DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>
  );
}
