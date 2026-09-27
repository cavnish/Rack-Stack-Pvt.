"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type SmartImageProps = ImageProps & {
  /**
   * Local asset used when `src` is missing or fails to load, e.g. a generated
   * file under public/assets. Keeps a broken CMS/Cloudinary URL from turning
   * into an empty box on a published page.
   */
  fallbackSrc?: string;
};

/** Local artwork shipped in public/, so a missing CMS image is never a blank box. */
export const DEFAULT_IMAGE_FALLBACK = "/illustrations/warehouse-storage.svg";

type AttemptState = { key: string; primaryFailed: boolean; fallbackFailed: boolean };

export function SmartImage({ src, alt, className, style, fill, onError, fallbackSrc, ...props }: SmartImageProps) {
  const currentKey = `${src ?? ""}|${fallbackSrc ?? ""}`;
  const [state, setState] = useState<AttemptState>({
    key: currentKey,
    primaryFailed: false,
    fallbackFailed: false,
  });

  // Clear the failure state while rendering when the source changes, so a new
  // image gets a fresh attempt without an extra commit or an effect.
  if (state.key !== currentKey) {
    setState({ key: currentKey, primaryFailed: false, fallbackFailed: false });
  }

  const primaryFailed = state.key === currentKey && state.primaryFailed;
  const fallbackFailed = state.key === currentKey && state.fallbackFailed;
  const requestedFallback = fallbackSrc ?? DEFAULT_IMAGE_FALLBACK;
  const usingFallback = (primaryFailed || !src) && Boolean(requestedFallback);
  const resolvedSrc = usingFallback ? requestedFallback : src;
  const fallbackPosition = fill ? "absolute inset-0" : "relative";

  if (!resolvedSrc || fallbackFailed) {
    return (
      <div
        className={`${fallbackPosition} flex h-full w-full min-w-0 items-center justify-center overflow-hidden bg-zinc-200 text-xs font-semibold uppercase tracking-widest text-zinc-500 ${className ?? ""}`}
        style={style}
        role="img"
        aria-label={alt}
      >
        Image unavailable
      </div>
    );
  }

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      {...props}
      fill={fill}
      className={className}
      style={style}
      onError={(event) => {
        if (usingFallback) {
          setState((previous) => ({ ...previous, fallbackFailed: true }));
          return;
        }
        onError?.(event);
        setState((previous) => ({ ...previous, primaryFailed: true }));
      }}
    />
  );
}
