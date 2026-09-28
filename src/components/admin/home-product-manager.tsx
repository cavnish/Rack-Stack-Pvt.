"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  GripVertical,
  PencilLine,
  Plus,
  Power,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { ProductCard, type ProductCardProduct } from "@/components/site/product-card";
import { describeCategory, type HomeProductOption } from "@/lib/home-products";

type CardRow = {
  id: number;
  productId: number | null;
  slug: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  altText: string | null;
  category: string | null;
  href: string | null;
  ctaLabel: string | null;
  showQuoteButton: boolean;
  isActive: boolean;
  displayOrder: number;
};

const byOrder = (a: CardRow, b: CardRow) => a.displayOrder - b.displayOrder || a.id - b.id;
const ENDPOINT = "/api/admin/home-offer-cards";

/**
 * The card as the editor sees it: the stored overrides laid over the product.
 *
 * The live homepage resolves this in `resolveHomeProductCard`; the same
 * precedence is applied here so the preview cannot disagree with what ships.
 */
function previewFor(row: CardRow, products: readonly HomeProductOption[]): ProductCardProduct {
  const product = products.find((item) =>
    row.productId !== null && item.id === row.productId ? true : item.slug === row.slug,
  );
  const name = row.title || product?.name || row.slug || "Untitled";
  return {
    id: row.id,
    name,
    slug: product?.slug || row.slug || "",
    // The product owns its own URL. A card cannot point somewhere else, so the
    // preview can never link to a page the homepage will not actually open.
    href: product?.href || (row.slug ? `/products/${row.slug}` : "/products"),
    category: row.category || product?.category || "",
    shortDescription: row.description || product?.shortDescription || "",
    thumbnail: row.imageUrl || product?.image || "",
    alt: row.altText || name,
    showQuoteButton: row.showQuoteButton,
    ctaLabel: row.ctaLabel || undefined,
  };
}

const overrideFields = (row: CardRow) =>
  ([
    row.title && "title",
    row.description && "description",
    row.imageUrl && "image",
    row.category && "badge",
    row.altText && "alt text",
    row.ctaLabel && "button label",
  ].filter(Boolean) as string[]);

export function HomeProductsManager({
  initialCards,
  products,
  role,
}: {
  initialCards: CardRow[];
  products: HomeProductOption[];
  role: string;
}) {
  const router = useRouter();
  const [cards, setCards] = useState<CardRow[]>(() => [...initialCards].sort(byOrder));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [choice, setChoice] = useState("");
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const canDelete = role === "SUPER_ADMIN" || role === "ADMIN";

  const activeCount = cards.filter((card) => card.isActive).length;
  const byId = useMemo(() => new Map(products.map((product) => [product.id ?? `slug:${product.slug}`, product])), [products]);
  const usedKeys = useMemo(
    () => new Set(cards.map((card) => (card.productId !== null ? card.productId : `slug:${card.slug}`))),
    [cards],
  );
  const candidates = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return products
      .filter((product) => !usedKeys.has(product.id ?? `slug:${product.slug}`))
      .filter((product) =>
        !needle
          ? true
          : `${product.name} ${product.slug} ${describeCategory(product.category)}`.toLowerCase().includes(needle),
      );
  }, [products, search, usedKeys]);

  async function saveRow(row: CardRow, patch: Partial<CardRow> = {}) {
    const next = { ...row, ...patch };
    const response = await fetch(`${ENDPOINT}/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    return { ok: response.ok, next };
  }

  async function add() {
    setError("");
    setMessage("");
    const product = byId.get(choice);
    if (!product) {
      setError("Choose a product to add.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          slug: product.slug,
          displayOrder: cards.length ? Math.max(...cards.map((card) => card.displayOrder)) + 1 : 1,
          isActive: true,
          showQuoteButton: true,
        }),
      });
      const created = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(created.error || "Unable to add this product.");
        return;
      }
      setCards((current) => [...current, created].sort(byOrder));
      setChoice("");
      setSearch("");
      setShowAdd(false);
      setMessage(`Added ${product.name} to the homepage.`);
      router.refresh();
    } catch {
      setError("Network error while adding. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(card: CardRow, patch: Partial<CardRow>, note: string) {
    setError("");
    setMessage("");
    const { ok, next } = await saveRow(card, patch);
    if (!ok) {
      setError("Unable to save this change.");
      return;
    }
    setCards((current) => current.map((row) => (row.id === card.id ? next : row)));
    setMessage(note);
    router.refresh();
  }

  async function clearOverrides(card: CardRow) {
    if (!confirm("Clear every override on this card? It will follow its product exactly.")) return;
    await toggle(
      card,
      { title: null, description: null, imageUrl: null, imagePublicId: null, altText: null, category: null, href: null, ctaLabel: null },
      "Cleared overrides. The card now follows its product.",
    );
  }

  /**
   * Commits a new order. Only the rows whose position actually changed are sent,
   * so a drag of one card in a long list is one or two requests, not all of them.
   */
  async function commitOrder(ordered: CardRow[], previous: CardRow[]) {
    setError("");
    const before = new Map(previous.map((row) => [row.id, row]));
    setCards(ordered);
    const changed = ordered.filter((row) => before.get(row.id)?.displayOrder !== row.displayOrder);
    if (!changed.length) return;
    const results = await Promise.all(changed.map((row) => saveRow(row)));
    if (results.some((result) => !result.ok)) {
      setError("Unable to save the new order. It has been put back.");
      setCards(previous);
      return;
    }
    setMessage("Order saved.");
    router.refresh();
  }

  function move(card: CardRow, delta: number) {
    const ordered = [...cards].sort(byOrder);
    const index = ordered.findIndex((row) => row.id === card.id);
    const target = index + delta;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    void commitOrder(next.map((row, position) => ({ ...row, displayOrder: position + 1 })), ordered);
  }

  function dropOn(target: CardRow) {
    const ordered = [...cards].sort(byOrder);
    const from = ordered.findIndex((row) => row.id === draggingId);
    const to = ordered.findIndex((row) => row.id === target.id);
    setDraggingId(null);
    if (draggingId === null || from < 0 || to < 0 || from === to) return;
    const next = [...ordered];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    void commitOrder(next.map((row, position) => ({ ...row, displayOrder: position + 1 })), ordered);
  }

  async function remove(card: CardRow) {
    const name = card.title || byId.get(card.productId ?? `slug:${card.slug}`)?.name || card.slug;
    if (!confirm(`Remove "${name}" from the homepage? The product itself is not deleted.`)) return;
    setError("");
    setMessage("");
    const response = await fetch(`${ENDPOINT}/${card.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Unable to remove this card.");
      return;
    }
    setCards((current) => current.filter((row) => row.id !== card.id));
    setMessage(`Removed ${name} from the homepage. The product is untouched.`);
    router.refresh();
  }

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[.65rem] font-bold uppercase tracking-widest text-red-600">Homepage</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">Home Products</h1>
          <p className="mt-1 text-xs font-semibold text-zinc-600">
            {cards.length} card{cards.length === 1 ? "" : "s"} · {activeCount} showing in &ldquo;What We Offer&rdquo;
          </p>
        </div>
        <button
          onClick={() => setShowAdd((value) => !value)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-800"
        >
          <Plus size={15} /> {showAdd ? "Close" : "Add product"}
        </button>
      </div>

      <p className="mt-3 max-w-3xl text-xs leading-5 text-zinc-600">
        These cards are pointers, not copies. Each one shows a real product and follows it automatically; the fields you override here are listed under each card. Drag a card to reorder it, and the homepage updates immediately.
      </p>

      {error ? <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p> : null}
      {message ? (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs font-semibold text-green-800">
          <CheckCircle2 size={14} /> {message}
        </p>
      ) : null}

      {showAdd ? (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-zinc-900">Add a product to the homepage</p>
          <p className="mt-1 text-xs text-zinc-600">
            Catalogue products and CMS products are both listed. Hidden or unpublished products are not shown here.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
            <div>
              <label htmlFor="home-product-search" className="mb-1 block text-[.65rem] font-bold text-zinc-600">SEARCH</label>
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  id="home-product-search"
                  className="admin-field pl-8"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name or category"
                />
              </div>
            </div>
            <div>
              <label htmlFor="home-product-choice" className="mb-1 block text-[.65rem] font-bold text-zinc-600">PRODUCT</label>
              <select id="home-product-choice" className="admin-field" value={choice} onChange={(event) => setChoice(event.target.value)}>
                <option value="">Choose a product…</option>
                {candidates.map((product) => (
                  <option key={product.id ?? `slug:${product.slug}`} value={product.id ?? `slug:${product.slug}`}>
                    {product.name} · {describeCategory(product.category)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={add}
                disabled={busy || !choice}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Plus size={15} /> {busy ? "Adding…" : "Add to homepage"}
              </button>
            </div>
          </div>
          {candidates.length === 0 ? (
            <p className="mt-3 text-xs font-semibold text-zinc-500">
              {search ? "No product matches that search." : "Every product is already on the homepage."}
            </p>
          ) : null}
        </div>
      ) : null}

      <ul className="mt-6 grid gap-4">
        {cards.length === 0 ? (
          <li className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center text-sm text-zinc-600">
            No products on the homepage yet. Add one to populate &ldquo;What We Offer&rdquo;.
          </li>
        ) : (
          cards.sort(byOrder).map((card, index) => {
            const overrides = overrideFields(card);
            const product = byId.get(card.productId ?? `slug:${card.slug}`);
            return (
              <li
                key={card.id}
                draggable
                onDragStart={() => setDraggingId(card.id)}
                onDragEnd={() => setDraggingId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => dropOn(card)}
                className={`rounded-xl border bg-white p-4 shadow-sm transition-shadow ${
                  card.isActive ? "border-zinc-200" : "border-dashed border-zinc-300 opacity-70"
                } ${draggingId === card.id ? "ring-2 ring-red-500" : ""}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row">
                  <div className="flex items-start gap-2 lg:w-56 lg:shrink-0 lg:flex-col">
                    <span
                      className="mt-1 inline-flex cursor-grab items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1.5 text-[.6rem] font-bold text-zinc-500 active:cursor-grabbing"
                      title="Drag to reorder"
                    >
                      <GripVertical size={13} /> {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 grow">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {card.title || product?.name || card.slug}
                      </p>
                      <p className="mt-0.5 truncate text-[.68rem] text-zinc-500">
                        {product?.name ? (card.title ? `Product: ${product.name}` : "Following the product") : "Product not found"}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 grow">
                    <div className="max-w-sm">
                      <ProductCard product={previewFor(card, products)} index={index} />
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 lg:w-64">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => toggle(card, { isActive: !card.isActive }, card.isActive ? "Card hidden from the homepage." : "Card is now live on the homepage.")}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[.6rem] font-bold ${
                          card.isActive ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {card.isActive ? <Eye size={11} /> : <EyeOff size={11} />}
                        {card.isActive ? "Showing" : "Hidden"}
                      </button>
                      <button
                        onClick={() => toggle(card, { showQuoteButton: !card.showQuoteButton }, card.showQuoteButton ? "Quote button hidden on this card." : "Quote button shown on this card.")}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[.6rem] font-bold ${
                          card.showQuoteButton ? "bg-zinc-100 text-zinc-700" : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        <Power size={11} /> Quote button {card.showQuoteButton ? "on" : "off"}
                      </button>
                    </div>

                    <div className="text-[.65rem] leading-5 text-zinc-600">
                      {overrides.length ? (
                        <p>
                          <span className="font-bold text-zinc-800">Overrides:</span> {overrides.join(", ")}
                        </p>
                      ) : (
                        <p className="text-green-700">No overrides &mdash; follows the product exactly.</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      <button title="Move up" onClick={() => move(card, -1)} disabled={index === 0} className="grid h-9 w-9 place-items-center rounded text-zinc-600 hover:bg-zinc-100 disabled:opacity-30">
                        <ArrowUp size={15} />
                      </button>
                      <button title="Move down" onClick={() => move(card, 1)} disabled={index === cards.length - 1} className="grid h-9 w-9 place-items-center rounded text-zinc-600 hover:bg-zinc-100 disabled:opacity-30">
                        <ArrowDown size={15} />
                      </button>
                      {overrides.length ? (
                        <button title="Clear all overrides" onClick={() => clearOverrides(card)} className="grid h-9 w-9 place-items-center rounded text-zinc-600 hover:bg-zinc-100">
                          <RotateCcw size={15} />
                        </button>
                      ) : null}
                      <Link
                        title="Edit card details"
                        href={`/admin/home-offer-cards/${card.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded px-2 py-2 text-[.65rem] font-bold text-zinc-700 hover:bg-zinc-100"
                      >
                        <PencilLine size={15} /> Edit
                      </Link>
                      {canDelete ? (
                        <button title="Remove from homepage" onClick={() => remove(card)} className="grid h-9 w-9 place-items-center rounded text-zinc-600 hover:bg-red-50 hover:text-red-600">
                          <Trash2 size={15} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <p className="mt-4 flex items-center gap-1.5 text-[.65rem] text-zinc-500">
        <Edit3 size={12} /> Use Edit for the card&rsquo;s own title, description, image and link, or to upload a different picture.
      </p>
    </section>
  );
}
