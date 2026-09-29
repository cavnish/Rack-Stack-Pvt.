"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react";

type ProductOption = {
  id?: number | string;
  slug: string;
  name: string;
};

type FormValues = {
  name: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  product: string;
  requirement: string;
  message: string;
  website: string;
};

function emptyValues(): FormValues {
  return {
    name: "",
    company: "",
    email: "",
    phone: "",
    location: "",
    product: "",
    requirement: "",
    message: "",
    website: "",
  };
}

export function ContactForm({ products = [] }: { products?: ProductOption[] }) {
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [succeeded, setSucceeded] = useState(false);
  const [fileName, setFileName] = useState("");
  const submittingRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function setField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleChange(field: keyof FormValues) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setField(field, event.target.value);
    };
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileName(file ? file.name : "");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    setError("");
    setSucceeded(false);

    if (values.website) return;

    if (!values.name.trim() || !values.email.trim() || !values.message.trim()) {
      setError("Please fill in your name, email and message.");
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    const payload = {
      name: values.name.trim(),
      company: values.company.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      subject: values.requirement.trim() || `Enquiry${values.product ? ` — ${values.product}` : ""}`,
      message: values.message.trim(),
      location: values.location.trim(),
      product: values.product,
      website: values.website,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setValues(emptyValues());
        setFileName("");
        if (fileRef.current) fileRef.current.value = "";
        setSucceeded(true);
        return;
      }

      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error || "Please check the form and try again.");
    } catch {
      setError("We could not reach our server. Please check your connection and try again.");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  if (succeeded) {
    return (
      <div className="border border-green-200 bg-green-50 px-6 py-10 text-center" role="status" aria-live="polite">
        <CheckCircle2 size={44} className="mx-auto text-green-700" aria-hidden="true" />
        <h3 className="mt-4 text-xl font-semibold tracking-tight text-green-950">
          Message Received.
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-green-800">
          Thank you. Our team will review your message and respond shortly.
        </p>
        <button
          type="button"
          className="btn-secondary mt-6"
          onClick={() => {
            setSucceeded(false);
            setError("");
          }}
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate aria-busy={loading}>
      <div>
        <label className="form-label" htmlFor="contact-name">Name *</label>
        <input
          id="contact-name"
          name="name"
          className="form-field"
          value={values.name}
          onChange={handleChange("name")}
          autoComplete="name"
          placeholder="Your name"
        />
      </div>
      <div>
        <label className="form-label" htmlFor="contact-company">Company</label>
        <input
          id="contact-company"
          name="company"
          className="form-field"
          value={values.company}
          onChange={handleChange("company")}
          autoComplete="organization"
          placeholder="Company name"
        />
      </div>
      <div>
        <label className="form-label" htmlFor="contact-email">Email *</label>
        <input
          id="contact-email"
          name="email"
          type="email"
          className="form-field"
          value={values.email}
          onChange={handleChange("email")}
          autoComplete="email"
          placeholder="name@company.com"
        />
      </div>
      <div>
        <label className="form-label" htmlFor="contact-phone">Phone</label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          className="form-field"
          value={values.phone}
          onChange={handleChange("phone")}
          autoComplete="tel"
          placeholder="+91 98765 43210"
        />
      </div>
      <div>
        <label className="form-label" htmlFor="contact-location">Location</label>
        <input
          id="contact-location"
          name="location"
          className="form-field"
          value={values.location}
          onChange={handleChange("location")}
          autoComplete="address-level2"
          placeholder="City / Area"
        />
      </div>
      {products.length > 0 ? (
        <div>
          <label className="form-label" htmlFor="contact-product">Product</label>
          <select
            id="contact-product"
            name="product"
            className="form-field"
            value={values.product}
            onChange={handleChange("product")}
          >
            <option value="">Select a product</option>
            {products.map((product) => (
              <option key={`${product.id ?? product.slug}-${product.slug}`} value={product.slug}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="sm:col-span-2">
        <label className="form-label" htmlFor="contact-requirement">Requirement</label>
        <input
          id="contact-requirement"
          name="requirement"
          className="form-field"
          value={values.requirement}
          onChange={handleChange("requirement")}
          placeholder="Brief requirement summary"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="form-label" htmlFor="contact-message">Message *</label>
        <textarea
          id="contact-message"
          name="message"
          className="form-field min-h-28 resize-y"
          value={values.message}
          onChange={handleChange("message")}
          placeholder="Tell us about your space, load, access or configuration needs."
        />
      </div>
      <div className="sm:col-span-2">
        <label className="form-label" htmlFor="contact-upload">Upload</label>
        <div className="flex items-center gap-3">
          <label
            htmlFor="contact-upload"
            className="btn-secondary cursor-pointer text-sm"
          >
            <Upload size={15} />
            {fileName ? "Change File" : "Attach File"}
          </label>
          <span className="truncate text-sm text-zinc-500">{fileName || "No file chosen"}</span>
          <input
            id="contact-upload"
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          />
        </div>
      </div>
      <input className="hidden" name="website" tabIndex={-1} value={values.website} onChange={handleChange("website")} />
      {error ? (
        <div className="form-error-summary flex items-start gap-2.5 p-3.5 text-sm sm:col-span-2" role="alert" aria-live="assertive">
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}
      <button type="submit" className="btn-primary sm:col-span-2" disabled={loading}>
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          "Submit"
        )}
      </button>
    </form>
  );
}
