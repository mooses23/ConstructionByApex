import { Link } from "wouter";
import { FileText, Clock, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useListQuotes } from "@workspace/api-client-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
};

export default function AdminQuotes() {
  const { data, isLoading } = useListQuotes();
  const quotes = data?.quotes ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Quotes</h1>
        <p className="text-slate-500 text-sm mt-1">{quotes.length} quotes total</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">No quotes created yet.</p>
            <p className="text-slate-400 text-sm mt-1">Go to a lead and create a quote from there.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {quotes.map((quote) => (
              <Link
                key={quote.id}
                href={`/admin/quotes/${quote.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                data-testid={`row-quote-${quote.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{quote.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${STATUS_COLORS[quote.status] ?? ""}`}>
                        {quote.status}
                      </span>
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-extrabold text-slate-900">${Number(quote.totalAmount).toLocaleString()}</p>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
