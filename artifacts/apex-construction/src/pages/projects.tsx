import { useState } from "react";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useListProjects } from "@workspace/api-client-react";
import CtaSection from "@/components/CtaSection";

export default function ProjectsPage() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const { data, isLoading } = useListProjects(
    activeCategory ? { category: activeCategory } : {}
  );
  const projects = data?.projects ?? [];

  const allCategories = [
    "Kitchen Remodeling",
    "Basement Finishing",
    "Deck Construction",
    "Bathroom Remodeling",
    "Room Additions",
    "Window Installation",
    "Flooring Installation",
  ];

  return (
    <div className="pb-16 md:pb-0">
      <div className="bg-slate-900 py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Our Projects</h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            Real work done for real Ohio homeowners. Browse our completed projects.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap gap-2 mb-10">
          <Button
            size="sm"
            variant={activeCategory === undefined ? "default" : "outline"}
            className={activeCategory === undefined ? "bg-amber-500 text-black hover:bg-amber-600 font-bold" : "border-slate-300 text-slate-600 hover:border-amber-400"}
            onClick={() => setActiveCategory(undefined)}
          >
            All Projects
          </Button>
          {allCategories.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={activeCategory === cat ? "default" : "outline"}
              className={activeCategory === cat ? "bg-amber-500 text-black hover:bg-amber-600 font-bold" : "border-slate-300 text-slate-600 hover:border-amber-400"}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg">No projects found in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-xl overflow-hidden border border-slate-200 group shadow-sm hover:shadow-md transition-shadow bg-white"
                data-testid={`card-project-${project.id}`}
              >
                <div className="aspect-video overflow-hidden relative">
                  <img
                    src={project.imageUrl}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {project.beforeImageUrl && project.afterImageUrl && (
                    <Badge className="absolute top-2 right-2 bg-amber-500 text-black font-bold text-xs">
                      Before / After
                    </Badge>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{project.category}</Badge>
                    <span className="text-slate-400 text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{project.city}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1 text-base">{project.title}</h3>
                  <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">{project.summary}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CtaSection />
    </div>
  );
}
