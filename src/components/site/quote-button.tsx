"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, CheckCircle2, FileText, Loader2, X } from "lucide-react";
import {
  catalogueCategoryNames,
  catalogueProducts,
  type CatalogueProduct,
} from "@/lib/catalogue";

const EASE = [0.22, 1, 0.36, 1] as const;
const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type QuoteButtonProps = {
  product?: CatalogueProduct;
  label?: string;
  className?: string;
};

type InquiryPayload = {
  name: string;
  company: string;
  phone: string;
  email: string;
  quantity: string;
  location: string;
  city: string;
  requirement: string;
  message: string;
  sourcePage: string;
  productSlug: string;
  productName: string;
};

function getFieldValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export function QuoteButton({ product, label = "Request a Quote", className = "btn-primary" }: QuoteButtonProps) {
  const formId = useId();
  const titleId = `${formId}-title`;
  const descriptionId = `${formId}-description`;
  const errorId = `${formId}-error`;
  const reducedMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProductSlug, setSelectedProductSlug] = useState(product?.slug ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [succeeded, setSucceeded] = useState(false);

  const productOptions =
    product && !catalogueProducts.some((item) => item.slug === product.slug)
      ? [product, ...catalogueProducts]
      : catalogueProducts;
  const productGroups = Array.from(new Set(productOptions.map((item) => item.category))).map((category) => ({
    category,
    products: productOptions.filter((item) => item.category === category),
  }));

  const closeDialog = useCallback(() => {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setIsOpen(false);
    setLoading(false);
    setError("");
    setSucceeded(false);
    setSelectedProductSlug(product?.slug ?? "");
    formRef.current?.reset();
  }, [product?.slug]);

  useEffect(() => {
    return () => requestControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const getFocusableElements = () => {
      if (!dialogRef.current) return [];
      return Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector));
    };

    const focusFrame = window.requestAnimationFrame(() => {
      const firstField = dialogRef.current?.querySelector<HTMLElement>("input, select, textarea");
      (firstField ?? getFocusableElements()[0])?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
        return;
      }

      if (event.key !== "Tab") return;
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [closeDialog, isOpen]);

  function openDialog() {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setSelectedProductSlug(product?.slug ?? "");
    setLoading(false);
    setError("");
    setSucceeded(false);
    setIsOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const selectedProduct = productOptions.find((item) => item.slug === selectedProductSlug);
    if (!selectedProduct) {
      setError("Select a product before submitting the enquiry.");
      return;
    }

    const name = getFieldValue(formData, "name");
    const company = getFieldValue(formData, "company");
    const phone = getFieldValue(formData, "phone");
    const email = getFieldValue(formData, "email");
    const quantity = getFieldValue(formData, "quantity");
    const location = getFieldValue(formData, "location");
    const message = getFieldValue(formData, "message");
    const requirement = message || `Quote request for ${selectedProduct.name}`;
    const messageDetails = [
      quantity ? `Quantity: ${quantity}` : "",
      message ? `Requirement: ${message}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const payload: InquiryPayload = {
      name,
      company,
      phone,
      email,
      quantity,
      location,
      city: location,
      requirement,
      message: messageDetails,
      sourcePage: window.location.pathname,
      productSlug: selectedProduct.slug,
      productName: selectedProduct.name,
    };

    const controller = new AbortController();
    requestControllerRef.current = controller;
    setLoading(true);

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const responseBody = (await response.json().catch(() => null)) as { error?: unknown } | null;

      if (!response.ok) {
        const messageFromResponse =
          typeof responseBody?.error === "string"
            ? responseBody.error
            : "Please check the form and try again.";
        throw new Error(messageFromResponse);
      }

      setSucceeded(true);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setError(requestError instanceof Error ? requestError.message : "Please check the form and try again.");
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
        setLoading(false);
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className={className}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <FileText size={16} aria-hidden="true" /> {label}
      </button>

      {isOpen
        ? createPortal(
            <motion.div
              className="fixed inset-0 z-[100] flex items-end justify-center bg-zinc-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-5"
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reducedMotion ? 0 : 0.22 }}
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeDialog();
              }}
            >
              <motion.div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                tabIndex={-1}
                className="max-h-[94dvh] w-full max-w-3xl overflow-y-auto border border-zinc-300 bg-white shadow-2xl"
                initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.32, ease: EASE }}
              >
                <div className="flex items-start justify-between gap-6 border-b border-zinc-200 px-5 py-5 sm:px-8">
                  <div>
                    <p className="eyebrow">Product enquiry</p>
                    <h2 id={titleId} className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                      Request a quote
                    </h2>
                    <p id={descriptionId} className="mt-2 text-sm leading-6 text-zinc-600">
                      Share the product and requirement details for your project.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="grid h-11 w-11 shrink-0 place-items-center border border-zinc-300 text-zinc-800 transition-colors hover:border-zinc-950 hover:bg-zinc-950 hover:text-white"
                    aria-label="Close quote form"
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {succeeded ? (
                    <motion.div
                      key="success"
                      className="px-5 py-14 text-center sm:px-8"
                      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      role="status"
                      aria-live="polite"
                    >
                      <CheckCircle2 size={48} className="mx-auto text-green-700" aria-hidden="true" />
                      <h3 className="mt-5 text-2xl font-semibold text-zinc-950">Request submitted</h3>
                      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600">
                        Your product enquiry has been submitted successfully.
                      </p>
                      <button type="button" onClick={closeDialog} className="btn-secondary mt-7">
                        Close
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      ref={formRef}
                      onSubmit={handleSubmit}
                      className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-8 sm:py-8"
                      aria-busy={loading}
                      initial={reducedMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div>
                        <label className="form-label" htmlFor={`${formId}-name`}>
                          Name *
                        </label>
                        <input
                          id={`${formId}-name`}
                          name="name"
                          className="form-field"
                          type="text"
                          minLength={2}
                          maxLength={100}
                          autoComplete="name"
                          required
                        />
                      </div>
                      <div>
                        <label className="form-label" htmlFor={`${formId}-company`}>
                          Company Name *
                        </label>
                        <input
                          id={`${formId}-company`}
                          name="company"
                          className="form-field"
                          type="text"
                          minLength={2}
                          maxLength={150}
                          autoComplete="organization"
                          required
                        />
                      </div>
                      <div>
                        <label className="form-label" htmlFor={`${formId}-phone`}>
                          Mobile Number *
                        </label>
                        <input
                          id={`${formId}-phone`}
                          name="phone"
                          className="form-field"
                          type="tel"
                          minLength={7}
                          maxLength={30}
                          inputMode="tel"
                          autoComplete="tel"
                          required
                        />
                      </div>
                      <div>
                        <label className="form-label" htmlFor={`${formId}-email`}>
                          Email *
                        </label>
                        <input
                          id={`${formId}-email`}
                          name="email"
                          className="form-field"
                          type="email"
                          autoComplete="email"
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="form-label" htmlFor={`${formId}-product`}>
                          Product *
                        </label>
                        <select
                          id={`${formId}-product`}
                          name="productSlug"
                          className="form-field"
                          value={selectedProductSlug}
                          onChange={(event) => {
                            setSelectedProductSlug(event.target.value);
                            setError("");
                          }}
                          required
                        >
                          <option value="">Select a product</option>
                          {productGroups.map((group) => (
                            <optgroup key={group.category} label={catalogueCategoryNames[group.category]}>
                              {group.products.map((item) => (
                                <option key={item.slug} value={item.slug}>
                                  {item.name}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-label" htmlFor={`${formId}-quantity`}>
                          Quantity
                        </label>
                        <input
                          id={`${formId}-quantity`}
                          name="quantity"
                          className="form-field"
                          type="text"
                          placeholder="Example: 10 units"
                        />
                      </div>
                      <div>
                        <label className="form-label" htmlFor={`${formId}-location`}>
                          Location
                        </label>
                        <input
                          id={`${formId}-location`}
                          name="location"
                          className="form-field"
                          type="text"
                          maxLength={100}
                          autoComplete="address-level2"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="form-label" htmlFor={`${formId}-message`}>
                          Requirement / Message *
                        </label>
                        <textarea
                          id={`${formId}-message`}
                          name="message"
                          className="form-field min-h-32 resize-y"
                          minLength={3}
                          maxLength={3000}
                          placeholder="Tell us about the application, available space or configuration you need."
                          required
                        />
                      </div>

                      {error ? (
                        <div
                          id={errorId}
                          role="alert"
                          className="flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-900 sm:col-span-2"
                        >
                          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                          <span>{error}</span>
                        </div>
                      ) : null}

                      <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 pt-5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-end">
                        <button type="button" onClick={closeDialog} className="btn-secondary" disabled={loading}>
                          Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                          {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <FileText size={16} aria-hidden="true" />}
                          {loading ? "Submitting" : "Submit Enquiry"}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>,
            document.body,
          )
        : null}
    </>
  );
}
