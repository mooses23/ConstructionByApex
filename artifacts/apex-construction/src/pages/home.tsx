import { Link } from "wouter";
import { Phone, MessageSquare, FileText, Shield, Clock, Star, CheckCircle, MapPin, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useListServices, useListProjects, useListTestimonials } from "@workspace/api-client-react";
import CtaSection from "@/components/CtaSection";

const SERVICE_AREA = [
  "Columbus", "Westerville", "Dublin", "Gahanna", "Hilliard",
  "Grove City", "Reynoldsburg", "Pickerington", "Canal Winchester", "Lancaster"
];

const TRUST_ITEMS = [
  { icon: Shield, label: "Licensed & Insured", desc: "Full general liability coverage on every job." },
  { icon: Clock, label: "Fast Response", desc: "We get back to every inquiry within one business day." },
  { icon: Star, label: "Quality Workmanship", desc: "We don't cut corners. Every job is done to last." },
  { icon: CheckCircle, label: "Clean Communication", desc: "You always know what's happening and when." },
];

export default function HomePage() {
  const { data: servicesData, isLoading: servicesLoading } = useListServices();
  const { data: projectsData, isLoading: projectsLoading } = useListProjects({ limit: 3 } as never);
  const { data: testimonialsData, isLoading: testimonialsLoading } = useListTestimonials();

  const services = servicesData?.services?.slice(0, 6) ?? [];
  const projects = projectsData?.projects?.slice(0, 3) ?? [];
  const testimonials = testimonialsData?.testimonials?.filter((t) => t.featured)?.slice(0, 3) ?? [];

  return (
    <div className="pb-16 md:pb-0">
      {/* Hero */}
      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 opacity-90" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=60')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <Badge className="bg-amber-500 text-black font-bold mb-4 text-xs tracking-widest uppercase">
              Central Ohio Contractor
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
              Built Right.<br />
              <span className="text-amber-500">Built to Last.</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-xl">
              Construction By Apex handles residential remodels, additions, decks, and repairs throughout Central Ohio. One contractor. No runaround. Quality you can see.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="tel:6145550182">
                <Button size="lg" className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-black font-bold h-14 px-8 text-base">
                  <Phone className="w-5 h-5 mr-2" />
                  Call (614) 555-0182
                </Button>
              </a>
              <a href="sms:6145550182">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-500 text-white hover:bg-slate-800 font-bold h-14 px-8 text-base">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Text Us
                </Button>
              </a>
              <Link href="/quote">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto text-slate-300 hover:text-white hover:bg-slate-800 font-bold h-14 px-8 text-base">
                  <FileText className="w-5 h-5 mr-2" />
                  Request a Quote
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="bg-white border-b border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_ITEMS.map((item) => (
              <div key={item.label} className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-3">
                  <item.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{item.label}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">What We Build</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              From full remodels to targeted repairs — we handle it all with the same level of care.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {servicesLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))
              : services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-xl border border-slate-200 p-6 hover:border-amber-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition-colors">{service.title}</h3>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-2">{service.description}</p>
                    <p className="text-xs text-slate-400 italic line-clamp-1">{service.idealFor}</p>
                    <Link href="/quote">
                      <button className="mt-4 text-amber-500 hover:text-amber-600 text-sm font-semibold flex items-center gap-1 transition-colors">
                        Get a quote <ChevronRight className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/services">
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:border-amber-500 hover:text-amber-600">
                View All Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">Recent Projects</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Real work, real Ohio homes. See what a project with Apex looks like.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projectsLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))
              : projects.map((project) => (
                  <div key={project.id} className="rounded-xl overflow-hidden border border-slate-200 group shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">{project.category}</Badge>
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{project.city}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">{project.title}</h3>
                      <p className="text-slate-500 text-sm line-clamp-2">{project.summary}</p>
                    </div>
                  </div>
                ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/projects">
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:border-amber-500 hover:text-amber-600">
                View All Projects
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">What Clients Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonialsLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
              : testimonials.map((t) => (
                  <div key={t.id} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed mb-4 italic">"{t.content}"</p>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{t.authorName}</p>
                      <p className="text-slate-400 text-xs">{t.authorCity} &middot; {t.serviceType}</p>
                    </div>
                  </div>
                ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/reviews">
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:border-amber-500 hover:text-amber-600">
                Read More Reviews
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Service Area */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-extrabold text-slate-900">Serving Central Ohio</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {SERVICE_AREA.map((city) => (
              <Badge key={city} variant="secondary" className="text-xs font-medium px-3 py-1">
                {city}
              </Badge>
            ))}
          </div>
          <p className="text-slate-500 text-sm mt-4">Not sure if we serve your area? Give us a call.</p>
        </div>
      </section>

      <CtaSection />
    </div>
  );
}
