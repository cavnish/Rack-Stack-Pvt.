import Image from "next/image";
import Link from "next/link";

export function Logo({
  href = "/",
  light = false,
  compact = false,
  iconBackground = "bg-white",
}: {
  href?: string;
  light?: boolean;
  compact?: boolean;
  iconBackground?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1.5 md:gap-0"
      aria-label="Rack & Stack home"
    >
      {/* Logo Icon */}
      <span
        className={`
          relative block shrink-0 overflow-hidden
          ${compact ? "h-10 w-10" : "h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14"}
        `}
        aria-hidden="true"
      >
        {light && (
          <span className={`absolute inset-0 ${iconBackground}`} />
        )}

        <Image
          src="/logo.png"
          alt=""
          width={700}
          height={700}
          priority
          unoptimized
          className="relative z-10 h-full w-full object-contain"
          draggable={false}
        />
      </span>

      {/* Company Name — the lockup is never withheld at any width. The wordmark
          is scaled down below md so the whole lockup still reads at ~110-145px on
          a phone, rather than the old behaviour of dropping the name entirely and
          leaving a bare icon that was easy to mistake for a missing logo. */}
      {!compact && (
        <span className="block min-w-0 leading-none whitespace-nowrap">
          <strong
            className={`
              block text-[0.68rem] md:text-[1.05rem] lg:text-[1.12rem]
              font-extrabold tracking-[0.1em] md:tracking-[0.12em]
              ${light ? "text-white" : "text-zinc-950"}
            `}
          >
            RACK &amp; STACK
          </strong>

          <span
            className={`
              mt-1.5 block
              text-[0.5rem] md:text-[0.58rem] lg:text-[0.62rem]
              font-semibold tracking-[0.14em] md:tracking-[0.19em]
              ${light ? "text-white/60" : "text-zinc-500"}
            `}
          >
            STORAGE SYSTEMS
          </span>
        </span>
      )}
    </Link>
  );
}