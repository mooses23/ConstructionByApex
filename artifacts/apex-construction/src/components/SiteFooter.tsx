import { Link } from "wouter";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center">
                <span className="text-black font-black text-sm">A</span>
              </div>
              <span className="font-extrabold text-white text-lg leading-tight">
                Construction By Apex
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Quality residential and commercial construction across Central Ohio. Licensed, insured, and committed to doing the job right.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="tel:6145550182">
                <button className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded text-sm transition-colors">
                  Call Now
                </button>
              </a>
              <a href="sms:6145550182">
                <button className="border border-slate-600 hover:border-amber-500 text-slate-300 hover:text-amber-500 font-semibold px-4 py-2 rounded text-sm transition-colors">
                  Text Us
                </button>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Home", href: "/" },
                { label: "Services", href: "/services" },
                { label: "Projects", href: "/projects" },
                { label: "Reviews", href: "/reviews" },
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
                { label: "Get a Quote", href: "/quote" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-400 hover:text-amber-500 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <a href="tel:6145550182" className="text-slate-300 hover:text-amber-500">(614) 555-0182</a>
                  <p className="text-slate-500 text-xs">Call or text anytime</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <a href="mailto:info@constructionbyapex.com" className="text-slate-300 hover:text-amber-500 break-all">
                  info@constructionbyapex.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <span className="text-slate-400">Central Ohio — Columbus metro area</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-slate-400">
                  <p>Mon–Fri: 7am–6pm</p>
                  <p>Sat: 8am–2pm</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-slate-500 text-xs">
            &copy; {new Date().getFullYear()} Construction By Apex. All rights reserved.
          </p>
          <p className="text-slate-500 text-xs">Central Ohio's Trusted Contractor</p>
        </div>
      </div>
    </footer>
  );
}
