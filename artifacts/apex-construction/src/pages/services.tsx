import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useListServices } from "@workspace/api-client-react";
import CtaSection from "@/components/CtaSection";
import PageMeta from "@/components/PageMeta";

export default function ServicesPage() {
  const { data, isLoading } = useListServices();
  const services = data?.services ?? [];

  const categories = Array.from(new Set(services.map((s) => s.category)));

  return (
    <div className="pb-16 md:pb-0">
      <PageMeta
        title="Services"
        description="Kitchen remodeling, bathroom remodels, deck construction, basement finishing, room additions, and more — Construction By Apex handles it all in Central Ohio."
        path="/services"
      />
      <div className="bg-slate-900 py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Our Services</h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            We handle the full scope so you don't have to. From kitchens and baths to decks and doors — quality work on every job.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : (
          categories.map((category) => (
            <div key={category} className="mb-12">
              <h2 className="text-xl font-extrabold text-slate-900 mb-5 flex items-center gap-2">
                <span className="w-1 h-6 bg-amber-500 rounded-full inline-block" />
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {services
                  .filter((s) => s.category === category)
                  .map((service) => (
                    <div
                      key={service.id}
                      className="bg-white rounded-xl border border-slate-200 p-6 hover:border-amber-300 hover:shadow-md transition-all"
                      data-testid={`card-service-${service.id}`}
                    >
                      <h3 className="font-extrabold text-slate-900 text-lg mb-2">{service.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed mb-3">{service.description}</p>
                      <div className="flex items-start gap-2 mb-4">
                        <Badge variant="outline" className="text-xs shrink-0 mt-0.5">Best for</Badge>
                        <p className="text-slate-500 text-xs leading-relaxed">{service.idealFor}</p>
                      </div>
                      <Link href="/quote">
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                          Get a Quote <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>

      <CtaSection />
    </div>
  );
}
