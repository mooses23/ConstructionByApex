import { Phone, Mail, MessageSquare, MapPin, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const SERVICE_AREA = [
  "Columbus", "Westerville", "Dublin", "Gahanna", "Hilliard",
  "Grove City", "Reynoldsburg", "Pickerington", "Canal Winchester", "Lancaster"
];

export default function ContactPage() {
  return (
    <div className="pb-16 md:pb-0">
      <div className="bg-slate-900 py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Get in Touch</h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            Call, text, or email — we respond to every inquiry within one business day.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Contact Information</h2>

            <div className="space-y-5">
              <a href="tel:6145550182" className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors group">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-amber-700">Call Us</p>
                  <p className="text-slate-600 text-sm">(614) 555-0182</p>
                  <p className="text-slate-400 text-xs mt-0.5">Mon–Fri 7am–6pm, Sat 8am–2pm</p>
                </div>
              </a>

              <a href="sms:6145550182" className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors group">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Text Us</p>
                  <p className="text-slate-600 text-sm">(614) 555-0182</p>
                  <p className="text-slate-400 text-xs mt-0.5">We respond to texts same business day</p>
                </div>
              </a>

              <a href="mailto:info@constructionbyapex.com" className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors group">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Email Us</p>
                  <p className="text-slate-600 text-sm">info@constructionbyapex.com</p>
                  <p className="text-slate-400 text-xs mt-0.5">We respond within one business day</p>
                </div>
              </a>
            </div>

            <div className="mt-8 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900">Business Hours</h3>
              </div>
              <div className="text-sm space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Monday – Friday</span>
                  <span className="font-semibold">7:00 AM – 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span className="font-semibold">8:00 AM – 2:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="font-semibold text-slate-400">Closed</span>
                </div>
              </div>
            </div>

            <div className="mt-5 p-5 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 text-sm">Emergency Service</p>
                  <p className="text-slate-600 text-xs mt-1">
                    For urgent structural or safety issues, call or text any time. We'll do our best to respond quickly.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900">Service Area</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SERVICE_AREA.map((city) => (
                  <span key={city} className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded font-medium">
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Send a Message</h2>
            <p className="text-slate-500 text-sm mb-6">
              For a detailed quote, <a href="/quote" className="text-amber-500 hover:underline font-semibold">use our quote request form</a>. For general questions, use this form.
            </p>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact-name">Name</Label>
                  <Input id="contact-name" placeholder="Your name" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="contact-phone">Phone</Label>
                  <Input id="contact-phone" placeholder="(614) 000-0000" className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="contact-email">Email</Label>
                <Input id="contact-email" type="email" placeholder="you@example.com" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="contact-message">Message</Label>
                <Textarea id="contact-message" placeholder="What can we help with?" rows={5} className="mt-1" />
              </div>
              <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-12">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
