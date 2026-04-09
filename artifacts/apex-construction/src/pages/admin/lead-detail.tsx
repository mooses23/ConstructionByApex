import { useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Phone, Mail, MessageSquare, MapPin, Clock, Plus, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useGetLead, useUpdateLead, useAddLeadNote, useLogContact, getGetLeadQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  quoted: "bg-purple-100 text-purple-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
};

export default function AdminLeadDetail() {
  const [, params] = useRoute("/admin/leads/:id");
  const id = Number(params?.id);
  const queryClient = useQueryClient();

  const { data: lead, isLoading } = useGetLead(id, {
    query: { enabled: !!id, queryKey: getGetLeadQueryKey(id) },
  });

  const { mutate: updateLead, isPending: updatingLead } = useUpdateLead();
  const { mutate: addNote, isPending: addingNote } = useAddLeadNote();
  const { mutate: logContact, isPending: loggingContact } = useLogContact();

  const [newNote, setNewNote] = useState("");
  const [contactMethod, setContactMethod] = useState<string>("");
  const [contactOutcome, setContactOutcome] = useState("");
  const [contactNotes, setContactNotes] = useState("");

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getGetLeadQueryKey(id) });
  }

  function handleStatusChange(status: string) {
    updateLead(
      { id, data: { status: status as "new" | "contacted" | "quoted" | "won" | "lost" } },
      { onSuccess: invalidate }
    );
  }

  function handleAddNote() {
    if (!newNote.trim()) return;
    addNote(
      { id, data: { content: newNote } },
      {
        onSuccess: () => {
          setNewNote("");
          invalidate();
        },
      }
    );
  }

  function handleLogContact() {
    if (!contactMethod || !contactOutcome) return;
    logContact(
      {
        id,
        data: {
          method: contactMethod as "call" | "text" | "email" | "in-person",
          outcome: contactOutcome,
          notes: contactNotes || undefined,
        },
      },
      {
        onSuccess: () => {
          setContactMethod("");
          setContactOutcome("");
          setContactNotes("");
          invalidate();
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p>Lead not found</p>
        <Link href="/admin/leads" className="text-amber-500 text-sm mt-2 inline-block">Back to leads</Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/leads" className="flex items-center gap-1 text-slate-500 hover:text-amber-500 text-sm mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Leads
      </Link>

      {/* Lead header with quick-action buttons */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{lead.fullName}</h1>
            <p className="text-slate-500 text-sm mt-1">{lead.serviceNeeded} · Submitted {new Date(lead.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize ${STATUS_COLORS[lead.status] ?? ""}`}>
              {lead.status}
            </span>
            <Select value={lead.status} onValueChange={handleStatusChange} disabled={updatingLead}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["new", "contacted", "quoted", "won", "lost"].map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Quick-action buttons */}
        <div className="flex flex-wrap gap-3">
          <a href={`tel:${lead.phone}`}>
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-12 px-5 text-sm">
              <Phone className="w-4 h-4 mr-2" />
              Call {lead.phone}
            </Button>
          </a>
          <a href={`sms:${lead.phone}`}>
            <Button size="lg" variant="outline" className="border-slate-300 text-slate-700 hover:border-amber-400 font-bold h-12 px-5 text-sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Text
            </Button>
          </a>
          <a href={`mailto:${lead.email}`}>
            <Button size="lg" variant="outline" className="border-slate-300 text-slate-700 hover:border-amber-400 font-bold h-12 px-5 text-sm">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-extrabold text-slate-900 mb-4 text-base">Customer Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs">Phone</p>
                  <a href={`tel:${lead.phone}`} className="font-semibold text-slate-900 hover:text-amber-500">{lead.phone}</a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs">Email</p>
                  <a href={`mailto:${lead.email}`} className="font-semibold text-slate-900 hover:text-amber-500">{lead.email}</a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs">Location</p>
                  <p className="font-semibold text-slate-900">{lead.city}, OH {lead.zipCode}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs">Preferred Contact</p>
                  <p className="font-semibold text-slate-900 capitalize">{lead.preferredContactMethod}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-extrabold text-slate-900 mb-3 text-base">Project Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400 text-xs mb-1">Service</p>
                <Badge variant="secondary">{lead.serviceNeeded}</Badge>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">Timeline</p>
                <p className="text-slate-700 font-medium">{lead.preferredTimeline}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">Description</p>
                <p className="text-slate-700 leading-relaxed">{lead.projectDescription}</p>
              </div>
            </div>
          </div>

          {/* Contact Log */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-extrabold text-slate-900 mb-4 text-base">Contact Log</h2>
            {lead.contacts && lead.contacts.length > 0 ? (
              <div className="space-y-3 mb-5">
                {lead.contacts.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
                    <div className="w-7 h-7 bg-amber-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-3 h-3 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="outline" className="text-xs capitalize">{c.method}</Badge>
                        <span className="text-slate-400 text-xs">{new Date(c.contactedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-700 text-sm font-medium">{c.outcome}</p>
                      {c.notes && <p className="text-slate-500 text-xs mt-0.5">{c.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm mb-4">No contact logged yet.</p>
            )}
            <div className="space-y-3 bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Log Contact Attempt</p>
              <div className="grid grid-cols-2 gap-3">
                <Select value={contactMethod} onValueChange={setContactMethod}>
                  <SelectTrigger className="text-sm h-9">
                    <SelectValue placeholder="Method..." />
                  </SelectTrigger>
                  <SelectContent>
                    {["call", "text", "email", "in-person"].map((m) => (
                      <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  className="border border-slate-200 rounded-md px-3 text-sm h-9 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Outcome..."
                  value={contactOutcome}
                  onChange={(e) => setContactOutcome(e.target.value)}
                />
              </div>
              <Textarea
                placeholder="Notes (optional)"
                rows={2}
                value={contactNotes}
                onChange={(e) => setContactNotes(e.target.value)}
                className="text-sm"
              />
              <Button
                size="sm"
                onClick={handleLogContact}
                disabled={loggingContact || !contactMethod || !contactOutcome}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
              >
                {loggingContact ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                Log Contact
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Notes */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-extrabold text-slate-900 mb-4 text-base">Internal Notes</h2>
            {lead.notes && lead.notes.length > 0 ? (
              <div className="space-y-3 mb-4">
                {lead.notes.map((n) => (
                  <div key={n.id} className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                    <p className="text-slate-700 text-sm leading-relaxed">{n.content}</p>
                    <p className="text-amber-600 text-xs mt-2">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm mb-3">No notes yet.</p>
            )}
            <div className="space-y-2">
              <Textarea
                placeholder="Add a note..."
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="text-sm"
                data-testid="textarea-note"
              />
              <Button
                size="sm"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
                onClick={handleAddNote}
                disabled={addingNote || !newNote.trim()}
                data-testid="button-add-note"
              >
                {addingNote ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                Add Note
              </Button>
            </div>
          </div>

          {/* Quotes */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-extrabold text-slate-900 mb-3 text-base">Quotes</h2>
            {lead.quotes && lead.quotes.length > 0 ? (
              <div className="space-y-2">
                {lead.quotes.map((q) => (
                  <Link key={q.id} href={`/admin/quotes/${q.id}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-amber-300 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{q.title}</p>
                      <p className="text-slate-500 text-xs capitalize">{q.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-sm">${Number(q.totalAmount).toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm mb-3">No quotes yet.</p>
            )}
            <Link href={`/admin/quotes/new?leadId=${lead.id}`}>
              <Button size="sm" variant="outline" className="w-full mt-3 border-slate-200 text-slate-600 hover:border-amber-400">
                <FileText className="w-3 h-3 mr-1" /> Create Quote
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
