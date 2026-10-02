"use client";

import { useSearchParams } from "next/navigation";
import { useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import {
  firstInvalidField,
  validateInquiryFields,
  type FieldErrors,
  type FieldName,
} from "@/lib/form-validation";

type ProductOption = {
  id?: number | string;
  slug: string;
  name: string;
};

type ServiceOption = {
  id: number;
  name: string;
  slug: string;
};

type InquiryFormProps = {
  products?: ProductOption[];
  services?: ServiceOption[];
  defaultProduct?: number | string;
  defaultService?: number;
  compact?: boolean;
};

/**
 * Every visible control is a controlled input.
 *
 * This is what makes "preserve the visitor's data if the submission fails" and
 * "reset only after a successful submission" the same piece of code: the DOM
 * holds no authoritative copy of the enquiry, so a failed request simply never
 * calls `reset()` and a successful one replaces the state object wholesale.
 */
type FormValues = {
  name: string;
  company: string;
  email: string;
  phone: string;
  whatsapp: string;
  location: string;
  product: string;
  service: string;
  quantity: string;
  warehouseSize: string;
  loadRequirement: string;
  message: string;
  website: string;
};

function emptyValues(defaultProduct?: number | string, defaultService?: number): FormValues {
  return {
    name: "",
    company: "",
    email: "",
    phone: "",
    whatsapp: "",
    location: "",
    product: defaultProduct === undefined ? "" : String(defaultProduct),
    service: defaultService === undefined ? "" : String(defaultService),
    quantity: "",
    warehouseSize: "",
    loadRequirement: "",
    message: "",
    website: "",
  };
}

/**
 * The message under one invalid field.
 *
 * Declared at module scope, not inside `InquiryForm`: a component defined during
 * render is a *new* component type on every render, which remounts the subtree
 * and discards its state. It also trips `react-hooks/static-components`.
 *
 * `id` is passed in rather than derived from a field name so the element the
 * message describes and the message itself cannot drift apart — the `aria-describedby`
 * on the input and the `id` here must be the same string.
 */
function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null;
  return (
    <span id={id} className="form-error" role="alert">
      {message}
    </span>
  );
}

export function InquiryForm({
  products = [],
  services = [],
  defaultProduct,
  defaultService,
  compact = false,
}: InquiryFormProps) {
  /*
   * `?product=` / `?service=` deep links are resolved here rather than in the
   * server page.
   *
   * The page used to `await searchParams` to turn those two slugs into ids, which
   * made `/request-a-quote` dynamic: it re-rendered on every visit and its data
   * fetch fell back to the database. The only thing the query string decided was
   * which two dropdowns start pre-selected, and this component already holds both
   * option lists, so it can do that lookup itself. Explicit `defaultProduct` /
   * `defaultService` props still win, which keeps any other caller unaffected.
   */
  const searchParams = useSearchParams();
  const productFromUrl = searchParams.get("product");
  const serviceFromUrl = searchParams.get("service");
  const resolvedProduct =
    defaultProduct ??
    (productFromUrl ? products.find((product) => product.slug === productFromUrl)?.id : undefined);
  const resolvedService =
    defaultService ??
    (serviceFromUrl ? services.find((service) => service.slug === serviceFromUrl)?.id : undefined);

  const [values, setValues] = useState<FormValues>(() => emptyValues(resolvedProduct, resolvedService));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [succeeded, setSucceeded] = useState(false);

  /**
   * Synchronous duplicate-submission guard.
   *
   * `loading` is React state, so it is not yet `true` when a second click's
   * handler runs in the same tick — two rapid clicks can both pass a
   * `if (loading) return` check. A ref is written immediately, so the second
   * submit is rejected before it can produce a second POST. `disabled={loading}`
   * alone does not cover this.
   */
  const submittingRef = useRef(false);

  const formId = useId();
  const controlId = (field: string) => `${formId}-${field}`;
  const errorId = (field: FieldName) => `${controlId(field)}-error`;

  function setField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  /**
   * Clears a field's error as soon as the visitor edits it.
   *
   * Re-validating on every keystroke instead would flag a half-typed email
   * ("a@b") as invalid while it is being typed, so the error is only *removed*
   * here; the full check still runs on submit.
   */
  function handleChange(field: keyof FormValues) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setField(field, event.target.value);
      setFieldErrors((current) => {
        if (!current[field as FieldName]) return current;
        const next = { ...current };
        delete next[field as FieldName];
        return next;
      });
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    setError("");
    setSucceeded(false);

    const errors = validateInquiryFields(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please correct the highlighted fields and try again.");
      // Move focus to the first problem so a keyboard or screen-reader user is
      // not left at the submit button with no indication of what to fix.
      const first = firstInvalidField(errors);
      if (first) document.getElementById(controlId(first))?.focus();
      return;
    }

    setFieldErrors({});
    submittingRef.current = true;
    setLoading(true);

    const selectedProduct = products.find((product) => String(product.id ?? product.slug) === values.product);
    const selectedService = services.find((service) => String(service.id) === values.service);
    const productName = selectedProduct?.name;
    const location = values.location.trim();

    const payload = {
      name: values.name.trim(),
      company: values.company.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      whatsapp: values.whatsapp.trim(),
      city: location,
      location,
      quantity: values.quantity.trim(),
      productId: typeof selectedProduct?.id === "number" ? selectedProduct.id : undefined,
      productSlug: selectedProduct?.slug,
      productName,
      serviceId: selectedService?.id,
      requirement:
        values.message.trim() ||
        (productName ? `Quote request for ${productName}` : "Storage and material-handling requirement"),
      message: values.message.trim(),
      warehouseSize: values.warehouseSize.trim(),
      loadRequirement: values.loadRequirement.trim(),
      website: values.website,
      sourcePage: window.location.pathname,
    };

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Only now is it safe to discard what the visitor typed.
        setValues(emptyValues(resolvedProduct, resolvedService));
        setSucceeded(true);
        return;
      }

      const body = (await response.json().catch(() => null)) as
        | { error?: unknown; fields?: Record<string, string[]> }
        | null;

      // 422 carries per-field messages from the server schema. Mapping them onto
      // the same inputs the client validated keeps a single error presentation
      // whether the problem was caught here or on the server.
      if (response.status === 422 && body?.fields) {
        const mapped: FieldErrors = {};
        for (const [field, messages] of Object.entries(body.fields)) {
          if (field in values && messages?.[0]) mapped[field as FieldName] = messages[0];
        }
        if (Object.keys(mapped).length > 0) setFieldErrors(mapped);
      }

      const detail = typeof body?.error === "string" ? body.error : "";
      if (response.status === 429) {
        setError("Too many enquiries have been sent from this connection. Please try again in a few minutes, or contact us directly.");
      } else if (response.status === 403) {
        setError("Your session could not be verified. Please refresh the page and try again.");
      } else if (response.status >= 500) {
        setError("Our system is temporarily unavailable. Your details are still here — please try again shortly.");
      } else {
        setError(detail || "Please check your details and try again.");
      }
    } catch {
      setError("We could not reach our server. Your details are still here — please check your connection and try again.");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  const fullWidth = compact ? "" : "min-[380px]:col-span-2";

  function fieldProps(field: FieldName, extraClass = "") {
    const invalid = Boolean(fieldErrors[field]);
    return {
      id: controlId(field),
      name: field,
      value: values[field],
      onChange: handleChange(field),
      "aria-invalid": invalid || undefined,
      "aria-describedby": invalid ? errorId(field) : undefined,
      className: `form-field form-field-compact${extraClass}${invalid ? " form-field-invalid" : ""}`,
    };
  }

  if (succeeded) {
    return (
      <div
        className={`${fullWidth} border border-zinc-200 bg-white px-6 py-10 text-center`}
        role="status"
        aria-live="polite"
        data-testid="inquiry-success"
      >
        <CheckCircle2 size={44} className="mx-auto text-green-700" aria-hidden="true" />
        <h3 className="mt-4 text-xl font-semibold tracking-tight text-zinc-950">
          Thank you! Your enquiry has been submitted successfully.
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
          Our team will contact you shortly. We have also emailed a confirmation to the address you provided.
        </p>
        <button
          type="button"
          className="btn-secondary mt-6"
          onClick={() => {
            setSucceeded(false);
            setError("");
          }}
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    /*
     * Field names, validation and the submitted payload are untouched — only the
     * box model and the row rhythm are tighter. `gap-y-3.5` against `gap-x-4`
     * keeps columns close without letting stacked rows drift apart, and the
     * three optional detail fields share one row on desktop so the form is a row
     * shorter than before at every breakpoint above `sm`.
     */
    <form
      onSubmit={submit}
      className={`grid gap-x-3 gap-y-3 ${compact ? "" : "min-[380px]:grid-cols-2"}`}
      noValidate
      aria-busy={loading}
    >
      <div>
        <label className="form-label form-label-compact" htmlFor={controlId("name")}>Name *</label>
        <input {...fieldProps("name")} autoComplete="name" placeholder="Your name" />
        <FieldError id={errorId("name")} message={fieldErrors.name} />
      </div>
      <div>
        <label className="form-label form-label-compact" htmlFor={controlId("company")}>Company *</label>
        <input {...fieldProps("company")} autoComplete="organization" placeholder="Company name" />
        <FieldError id={errorId("company")} message={fieldErrors.company} />
      </div>
      <div>
        <label className="form-label form-label-compact" htmlFor={controlId("email")}>Email *</label>
        <input {...fieldProps("email")} type="email" autoComplete="email" placeholder="name@company.com" />
        <FieldError id={errorId("email")} message={fieldErrors.email} />
      </div>
      <div>
        <label className="form-label form-label-compact" htmlFor={controlId("phone")}>Phone *</label>
        <input {...fieldProps("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" />
        <FieldError id={errorId("phone")} message={fieldErrors.phone} />
      </div>
      {!compact ? (
        <>
          <div>
            <label className="form-label form-label-compact" htmlFor={controlId("whatsapp")}>WhatsApp</label>
            <input {...fieldProps("whatsapp")} type="tel" inputMode="tel" autoComplete="tel" placeholder="Optional" />
            <FieldError id={errorId("whatsapp")} message={fieldErrors.whatsapp} />
          </div>
          <div>
            <label className="form-label form-label-compact" htmlFor={controlId("location")}>Location</label>
            <input {...fieldProps("location")} autoComplete="address-level2" placeholder="City" />
            <FieldError id={errorId("location")} message={fieldErrors.location} />
          </div>
        </>
      ) : null}
      {products.length > 0 ? (
        <div className={fullWidth}>
          <label className="form-label form-label-compact" htmlFor={controlId("product")}>Product</label>
          <select
            id={controlId("product")}
            name="product"
            className="form-field form-field-compact"
            value={values.product}
            onChange={handleChange("product")}
          >
            <option value="">Select a product</option>
            {products.map((product) => (
              <option key={`${product.id ?? product.slug}-${product.slug}`} value={String(product.id ?? product.slug)}>{product.name}</option>
            ))}
          </select>
        </div>
      ) : null}
      {services.length > 0 ? (
        <div className={fullWidth}>
          <label className="form-label form-label-compact" htmlFor={controlId("service")}>Service</label>
          <select
            id={controlId("service")}
            name="service"
            className="form-field form-field-compact"
            value={values.service}
            onChange={handleChange("service")}
          >
            <option value="">Select a service</option>
            {services.map((service) => <option key={service.id} value={String(service.id)}>{service.name}</option>)}
          </select>
        </div>
      ) : null}
      {/*
        Quantity, available space and load requirement are the three optional
        detail fields, so they share one three-up row on desktop. On tablet they
        drop to two columns and on mobile to one, so no field is ever squeezed.
      */}
      {!compact ? (
        <div className={`${fullWidth} grid gap-x-4 gap-y-3.5 sm:grid-cols-3`}>
          <div>
            <label className="form-label form-label-compact" htmlFor={controlId("quantity")}>Quantity</label>
            <input
              id={controlId("quantity")}
              name="quantity"
              className="form-field form-field-compact"
              value={values.quantity}
              onChange={handleChange("quantity")}
              placeholder="e.g. 1 set"
            />
          </div>
          <div>
            <label className="form-label form-label-compact" htmlFor={controlId("warehouseSize")}>Available space</label>
            <input
              id={controlId("warehouseSize")}
              name="warehouseSize"
              className="form-field form-field-compact"
              value={values.warehouseSize}
              onChange={handleChange("warehouseSize")}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="form-label form-label-compact" htmlFor={controlId("loadRequirement")}>Load requirement</label>
            <input
              id={controlId("loadRequirement")}
              name="loadRequirement"
              className="form-field form-field-compact"
              value={values.loadRequirement}
              onChange={handleChange("loadRequirement")}
              placeholder="Optional"
            />
          </div>
        </div>
      ) : null}
      <div className={fullWidth}>
        <label className="form-label form-label-compact" htmlFor={controlId("message")}>Requirement / Message *</label>
        <textarea
          {...fieldProps("message", "min-h-24 resize-y ")}
          placeholder="Tell us about the space, load, access or configuration you need."
        />
        <FieldError id={errorId("message")} message={fieldErrors.message} />
      </div>
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={controlId("website")}>Website</label>
        <input
          id={controlId("website")}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={handleChange("website")}
        />
      </div>
      {error ? (
        <div
          className={`${fullWidth} form-error-summary flex items-start gap-2.5 p-3.5 text-sm`}
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}
      <div className={fullWidth}>
        <button type="submit" className="btn-primary btn-compact w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Sending…
            </>
          ) : (
            "Send enquiry"
          )}
        </button>
      </div>
    </form>
  );
}
