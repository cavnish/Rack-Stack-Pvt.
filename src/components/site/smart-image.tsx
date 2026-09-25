"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

export function SmartImage({
  src,
  alt,
  className,
  style,
  fill,
  onError,
  ...props
}: ImageProps) {
  const [failedSrc, setFailedSrc] = useState<ImageProps["src"] | null>(null);
  const failed = failedSrc === src;
  const fallbackPosition = fill ? "absolute inset-0" : "relative";

  if (failed || !src) {
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
      src={src}
      alt={alt}
      {...props}
      fill={fill}
      className={className}
      style={style}
      onError={(event) => {
        onError?.(event);
        setFailedSrc(src);
      }}
    />
  );
}
