import { useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Plus, Trash2, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetQuote, useUpdateQuote, getGetQuoteQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type LineItem = { description: string; quantity: number; unitPrice: number };

export default function AdminQuoteDetail() {
  const [, params] = useRoute("/admin/quotes/:id");
  const id = Number(params?.id);
  const queryClient = useQueryClient();

  const { data: quote, isLoading } = useGetQuote(id, {
    query: { enabled: !!id, queryKey: getGetQuoteQueryKey(id) },
  });

  const { mutate: updateQuote, isPending } = useUpdateQuote();

  const [items, setItems] = useState<LineItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  if (quote && !initialized) {
    setItems(quote.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })));
    setInitialized(true);
  }

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  function handleSave(status?: string) {
    updateQuote(
      {
        id,
        data: {
          ...(status ? { status: status as "draft" | "sent" | "accepted" | "declined" } : {}),
          items: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetQuoteQueryKey(id) });
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p>Quote not found</p>
        <Link href="/admin/quotes" className="text-amber-500 text-sm mt-2 inline-block">Back to quotes</Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/quotes" className="flex items-center gap-1 text-slate-500 hover:text-amber-500 text-sm mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Quotes
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{quote.title}</h1>
          <p className="text-slate-500 text-sm mt-1">Quote #{quote.id} · Created {new Date(quote.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={quote.status}
            onValueChange={(status) => handleSave(status)}
            disabled={isPending}
          >
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["draft", "sent", "accepted", "declined"].map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="border-slate-200 text-slate-600"
          >
            <Printer className="w-3 h-3 mr-1" /> Print
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave()}
            disabled={isPending}
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-extrabold text-slate-900">Line Items</h2>
          <Button size="sm" variant="outline" onClick={addItem} className="border-slate-200 text-slate-600 hover:border-amber-400">
            <Plus className="w-3 h-3 mr-1" /> Add Item
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left text-xs text-slate-500 font-semibold pb-3 pr-4">Description</th>
                <th className="text-right text-xs text-slate-500 font-semibold pb-3 px-4 w-24">Qty</th>
                <th className="text-right text-xs text-slate-500 font-semibold pb-3 px-4 w-32">Unit Price</th>
                <th className="text-right text-xs text-slate-500 font-semibold pb-3 pl-4 w-32">Total</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="py-2 pr-4">
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                      placeholder="Describe the work..."
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm text-right w-20"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm text-right w-28"
                    />
                  </td>
                  <td className="py-2 pl-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                    ${(item.quantity * item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 pl-2">
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-slate-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">
            No line items yet. Add items above.
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <div className="bg-slate-50 rounded-lg p-4 min-w-48">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-500 text-sm">Subtotal</span>
              <span className="font-semibold text-slate-900">
                ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="font-extrabold text-slate-900">Total</span>
              <span className="font-extrabold text-xl text-slate-900">
                ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {quote.notes && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-700 text-sm mb-2">Notes</h3>
          <p className="text-slate-600 text-sm leading-relaxed">{quote.notes}</p>
        </div>
      )}
    </div>
  );
}
