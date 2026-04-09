import { Link } from "wouter";
import { Phone, MessageSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CtaSection() {
  return (
    <section className="bg-slate-900 py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
          Ready to get started?
        </h2>
        <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
          Call, text, or request a quote online. We respond to every inquiry within one business day.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="tel:6145550182">
            <Button size="lg" className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-black font-bold text-base h-12 px-8">
              <Phone className="w-4 h-4 mr-2" />
              (614) 555-0182
            </Button>
          </a>
          <a href="sms:6145550182">
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-600 text-white hover:bg-slate-800 font-bold text-base h-12 px-8">
              <MessageSquare className="w-4 h-4 mr-2" />
              Text Us
            </Button>
          </a>
          <Link href="/quote">
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-600 text-white hover:bg-slate-800 font-bold text-base h-12 px-8">
              <FileText className="w-4 h-4 mr-2" />
              Get a Quote
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
