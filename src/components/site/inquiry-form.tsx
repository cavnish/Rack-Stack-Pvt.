"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ProductOption = {
  id?: number | string;
  slug: string;
  name: string;
};

type ServiceOption = {
  id: number;
  name: string;
};

type InquiryFormProps = {
  products?: ProductOption[];
  services?: ServiceOption[];
  defaultProduct?: number | string;
  defaultService?: number;
  compact?: boolean;
};

export function InquiryForm({ products = [], services = [], defaultProduct, defaultService, compact = false }: InquiryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const productValue = String(form.get("product") ?? "");
    const selectedProduct = products.find((product) => String(product.id ?? product.slug) === productValue);
    const serviceValue = String(form.get("service") ?? "");
    const selectedService = services.find((service) => String(service.id) === serviceValue);
    const message = String(form.get("message") ?? "").trim();
    const productId = typeof selectedProduct?.id === "number" ? selectedProduct.id : undefined;
    const productSlug = selectedProduct?.slug;
    const productName = selectedProduct?.name;
    const location = String(form.get("location") ?? "").trim() || String(form.get("city") ?? "").trim();

    const payload = {
      name: String(form.get("name") ?? ""),
      company: String(form.get("company") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      whatsapp: String(form.get("whatsapp") ?? ""),
      city: location,
      location,
      quantity: String(form.get("quantity") ?? ""),
      product: productValue,
      productId,
      productSlug,
      productName,
      serviceId: selectedService?.id,
      requirement: message || (productName ? `Quote request for ${productName}` : "Storage and material-handling requirement"),
      message,
      warehouseSize: String(form.get("warehouseSize") ?? ""),
      loadRequirement: String(form.get("loadRequirement") ?? ""),
      website: String(form.get("website") ?? ""),
      sourcePage: window.location.pathname,
    };

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        router.push("/thank-you");
        return;
      }
      const body = await response.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Please check the form and try again.");
    } catch {
      setError("We could not send your request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className={`grid gap-5 ${compact ? "" : "sm:grid-cols-2"}`} noValidate>
      <div>
        <label className="form-label" htmlFor="inq-name">Name *</label>
        <input className="form-field" id="inq-name" name="name" required minLength={2} autoComplete="name" />
      </div>
      <div>
        <label className="form-label" htmlFor="inq-company">Company *</label>
        <input className="form-field" id="inq-company" name="company" required minLength={2} autoComplete="organization" />
      </div>
      <div>
        <label className="form-label" htmlFor="inq-email">Email *</label>
        <input className="form-field" id="inq-email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label className="form-label" htmlFor="inq-phone">Phone *</label>
        <input className="form-field" id="inq-phone" name="phone" type="tel" required minLength={7} autoComplete="tel" />
      </div>
      {!compact ? (
        <>
          <div>
            <label className="form-label" htmlFor="inq-whatsapp">WhatsApp</label>
            <input className="form-field" id="inq-whatsapp" name="whatsapp" type="tel" autoComplete="tel" />
          </div>
          <div>
            <label className="form-label" htmlFor="inq-location">Location</label>
            <input className="form-field" id="inq-location" name="location" autoComplete="address-level2" />
          </div>
        </>
      ) : null}
      {products.length > 0 ? (
        <div className={compact ? "" : "sm:col-span-2"}>
          <label className="form-label" htmlFor="inq-product">Product</label>
          <select className="form-field" id="inq-product" name="product" defaultValue={defaultProduct === undefined ? "" : String(defaultProduct)}>
            <option value="">Select a product</option>
            {products.map((product) => (
              <option key={`${product.id ?? product.slug}-${product.slug}`} value={String(product.id ?? product.slug)}>{product.name}</option>
            ))}
          </select>
        </div>
      ) : null}
      {services.length > 0 ? (
        <div className={compact ? "" : "sm:col-span-2"}>
          <label className="form-label" htmlFor="inq-service">Service</label>
          <select className="form-field" id="inq-service" name="service" defaultValue={defaultService === undefined ? "" : String(defaultService)}>
            <option value="">Select a service</option>
            {services.map((service) => <option key={service.id} value={String(service.id)}>{service.name}</option>)}
          </select>
        </div>
      ) : null}
      {!compact ? (
        <div>
          <label className="form-label" htmlFor="inq-quantity">Quantity</label>
          <input className="form-field" id="inq-quantity" name="quantity" placeholder="e.g. 1 set" />
        </div>
      ) : null}
      <div className={compact ? "" : "sm:col-span-2"}>
        <label className="form-label" htmlFor="inq-message">Requirement / Message *</label>
        <textarea className="form-field min-h-32 resize-y" id="inq-message" name="message" required minLength={3} placeholder="Tell us about the space, load, access or configuration you need." />
      </div>
      {!compact ? (
        <>
          <div>
            <label className="form-label" htmlFor="inq-warehouse-size">Available space</label>
            <input className="form-field" id="inq-warehouse-size" name="warehouseSize" placeholder="Optional" />
          </div>
          <div>
            <label className="form-label" htmlFor="inq-load">Load requirement</label>
            <input className="form-field" id="inq-load" name="loadRequirement" placeholder="Optional" />
          </div>
        </>
      ) : null}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="inq-website">Website</label>
        <input id="inq-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {error ? <p className={compact ? "text-sm font-semibold text-red-700" : "sm:col-span-2 text-sm font-semibold text-red-700"} role="alert">{error}</p> : null}
      <div className={compact ? "" : "sm:col-span-2"}>
        <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? "Sending…" : "Send enquiry"}</button>
      </div>
    </form>
  );
}
