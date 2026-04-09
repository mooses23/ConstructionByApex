import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Phone, Upload, Loader2 } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useCreateLead } from "@workspace/api-client-react";

const SERVICES = [
  "Kitchen Remodeling",
  "Bathroom Remodeling",
  "Basement Finishing",
  "Room Addition",
  "Deck / Patio Construction",
  "Window Installation",
  "Door Installation",
  "Flooring Installation",
  "Drywall & Framing",
  "General Repairs",
  "Other",
];

const TIMELINES = [
  "ASAP",
  "Within 1 month",
  "1–3 months",
  "3–6 months",
  "6+ months",
  "Flexible / Just exploring",
];

const CONTACT_METHODS = [
  { value: "phone", label: "Phone call" },
  { value: "text", label: "Text message" },
  { value: "email", label: "Email" },
];

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Valid email is required"),
  city: z.string().min(2, "City is required"),
  zipCode: z.string().min(5, "ZIP code is required"),
  serviceNeeded: z.string().min(1, "Please select a service"),
  projectDescription: z.string().min(20, "Please describe your project (at least 20 characters)"),
  preferredTimeline: z.string().min(1, "Please select a timeline"),
  preferredContactMethod: z.string().min(1, "Please select a contact method"),
});

type FormValues = z.infer<typeof schema>;

export default function QuotePage() {
  const [submitted, setSubmitted] = useState(false);
  const { mutate: createLead, isPending } = useCreateLead();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      city: "",
      zipCode: "",
      serviceNeeded: "",
      projectDescription: "",
      preferredTimeline: "",
      preferredContactMethod: "",
    },
  });

  function onSubmit(values: FormValues) {
    createLead(
      { data: { ...values, photoUrls: [] } },
      {
        onSuccess: () => setSubmitted(true),
        onError: () => {
          form.setError("root", { message: "Something went wrong. Please try calling us directly." });
        },
      }
    );
  }

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 pb-16 md:pb-0">
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">We received your request!</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            We'll reach out within one business day to discuss your project. If you need to talk sooner, call or text us directly.
          </p>
          <a href="tel:6145550182">
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-12 px-8">
              <Phone className="w-4 h-4 mr-2" />
              (614) 555-0182
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-0">
      <PageMeta
        title="Request a Free Quote"
        description="Request a free estimate from Construction By Apex. Tell us about your project — kitchen, bathroom, deck, addition, or any remodel — and we'll respond within one business day."
        path="/quote"
      />
      <div className="bg-slate-900 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Request a Free Quote</h1>
          <p className="text-slate-300">Tell us about your project. We'll review it and get back to you within one business day.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" data-testid="form-quote">
            {/* Contact Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">Your Contact Info</h2>

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John Smith" data-testid="input-fullName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(614) 000-0000" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="you@email.com" data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Columbus" data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="43085" data-testid="input-zipCode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="preferredContactMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Best way to reach you</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-contactMethod">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONTACT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Project Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">Project Details</h2>

              <FormField
                control={form.control}
                name="serviceNeeded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Needed</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-service">
                          <SelectValue placeholder="Select a service..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SERVICES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Describe your project</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Tell us what you're looking to accomplish — current condition, what you want, any constraints you're aware of..."
                        rows={5}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredTimeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Timeline</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-timeline">
                          <SelectValue placeholder="When do you want to get started?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIMELINES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-slate-50 rounded-lg border border-dashed border-slate-300 p-5 text-center">
                <Upload className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-medium">Photo upload</p>
                <p className="text-xs text-slate-400 mt-1">
                  You can send photos by text to (614) 555-0182 after submitting — we'll link them to your request.
                </p>
              </div>
            </div>

            {form.formState.errors.root && (
              <p className="text-red-500 text-sm text-center">{form.formState.errors.root.message}</p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-14 text-base"
              data-testid="button-submit"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Quote Request"
              )}
            </Button>

            <p className="text-center text-slate-400 text-xs">
              We'll respond within one business day. No spam, no pressure.
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
}
