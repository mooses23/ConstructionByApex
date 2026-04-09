import { Phone, MessageSquare } from "lucide-react";

export default function MobileCTA() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
      <div className="grid grid-cols-2 gap-0">
        <a
          href="tel:6145550182"
          className="flex items-center justify-center gap-2 py-4 bg-slate-900 text-white font-bold text-sm active:bg-slate-800 transition-colors"
          data-testid="button-mobile-call"
        >
          <Phone className="w-4 h-4" />
          Call Now
        </a>
        <a
          href="sms:6145550182"
          className="flex items-center justify-center gap-2 py-4 bg-amber-500 text-black font-bold text-sm active:bg-amber-600 transition-colors"
          data-testid="button-mobile-text"
        >
          <MessageSquare className="w-4 h-4" />
          Text Us
        </a>
      </div>
    </div>
  );
}
