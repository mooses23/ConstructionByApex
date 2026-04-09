import { Shield, Star, Clock, Users } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import CtaSection from "@/components/CtaSection";

const VALUES = [
  {
    icon: Shield,
    title: "Show up when we say we will",
    desc: "Your time matters. If we say we'll be there at 8, we're there at 8. If something changes, we call — we don't disappear.",
  },
  {
    icon: Star,
    title: "Do the job right",
    desc: "We don't take shortcuts. Every piece of framing, every tile, every coat of drywall compound — done correctly, the first time.",
  },
  {
    icon: Clock,
    title: "Communicate clearly",
    desc: "We tell you what we're doing, what's coming next, and when you can expect it. No mysteries, no surprises at the end.",
  },
  {
    icon: Users,
    title: "Treat your home like ours",
    desc: "We clean up every day, protect your surfaces and floors, and leave the job site in better shape than we found it.",
  },
];

export default function AboutPage() {
  return (
    <div className="pb-16 md:pb-0">
      <div className="bg-slate-900 py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">About Apex</h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            A local Ohio contractor who does what he says, does it right, and keeps you in the loop.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-slate max-w-none">
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-6 mb-10">
            <p className="text-slate-800 text-lg leading-relaxed font-medium italic">
              "I started Construction By Apex because I got tired of seeing homeowners get let down by contractors who overpromise, underdeliver, and disappear when things get complicated. I wanted to build something different — a business where the work is done right, communication is straightforward, and the people who hire me can trust what I say."
            </p>
            <p className="text-slate-600 mt-3 font-bold">— Owner, Construction By Apex</p>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 mb-4">What We Do</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Construction By Apex handles residential and small commercial construction work throughout Central Ohio — Columbus, Westerville, Dublin, Gahanna, Hilliard, and the surrounding areas.
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            That means kitchen and bathroom remodels, room additions, basement finishing, deck construction, flooring, windows and doors, drywall, and general repairs. We're not a specialty shop — we're a general contractor who handles the full scope of a project so you don't have to coordinate three different trades.
          </p>
          <p className="text-slate-600 leading-relaxed mb-8">
            We work on one project at a time or a small number of projects at once. That's intentional. It means you get attention — not a crew stretched thin across a dozen jobs.
          </p>

          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">How We Operate</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
            {VALUES.map((v) => (
              <div key={v.title} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                  <v.icon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1 text-sm">{v.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 mb-4">Who We Work With</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Most of our clients are homeowners who've been in their house for a while and are ready to make improvements. They know what they want, they have a budget in mind, and they're looking for someone they can trust to deliver — not someone who treats their home like a commodity.
          </p>
          <p className="text-slate-600 leading-relaxed mb-8">
            We also take on small commercial work for property owners who need the same level of reliability and quality.
          </p>

          <div className="bg-slate-900 rounded-xl p-8 text-center">
            <h3 className="text-white font-extrabold text-2xl mb-3">Ready to talk about your project?</h3>
            <p className="text-slate-300 mb-6">Tell us what you're working on and we'll get back to you within one business day.</p>
            <Link href="/quote">
              <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 h-12">
                Request a Free Quote
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <CtaSection />
    </div>
  );
}
