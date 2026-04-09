import { Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useListTestimonials } from "@workspace/api-client-react";
import CtaSection from "@/components/CtaSection";
import PageMeta from "@/components/PageMeta";

export default function ReviewsPage() {
  const { data, isLoading } = useListTestimonials();
  const testimonials = data?.testimonials ?? [];

  return (
    <div className="pb-16 md:pb-0">
      <PageMeta
        title="Reviews"
        description="See what Central Ohio homeowners say about working with Construction By Apex — honest reviews from real clients across Columbus, Westerville, Dublin, and more."
        path="/reviews"
      />
      <div className="bg-slate-900 py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">What Our Clients Say</h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            We let the work speak for itself. Here's what Ohio homeowners say after working with Apex.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-5">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className={`bg-white rounded-xl border p-7 shadow-sm ${t.featured ? "border-amber-300 shadow-amber-50" : "border-slate-200"}`}
                data-testid={`card-testimonial-${t.id}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    <p className="font-extrabold text-slate-900 text-base">{t.authorName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-400 text-sm">{t.authorCity}</span>
                      <span className="text-slate-300">&middot;</span>
                      <Badge variant="secondary" className="text-xs">{t.serviceType}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < t.rating ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-slate-700 leading-relaxed">"{t.content}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <CtaSection />
    </div>
  );
}
