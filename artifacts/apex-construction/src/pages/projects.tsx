import { useState } from "react";
import { MapPin, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useListProjects } from "@workspace/api-client-react";
import CtaSection from "@/components/CtaSection";
import PageMeta from "@/components/PageMeta";

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
      <PageMeta
        title="Projects"
        description="Browse completed construction projects by Construction By Apex — kitchen remodels, decks, basements, additions, and more across Central Ohio."
        path="/projects"
      />
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
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-700 text-lg mb-2">No projects in this category yet</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">We're always adding new work. Check back soon or browse all of our completed projects.</p>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
              onClick={() => setActiveCategory(undefined)}
            >
              View All Projects
            </Button>
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
