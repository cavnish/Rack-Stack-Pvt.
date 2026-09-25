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
      className="inline-flex items-center gap-0 shrink-0"
      aria-label="Rack & Stack home"
    >
      {/* Logo Icon */}
      <span
        className={`
          relative block shrink-0 overflow-hidden
          ${compact ? "h-10 w-10" : "h-12 w-12 lg:h-14 lg:w-14"}
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

      {/* Company Name */}
      {!compact && (
        <span className="leading-none whitespace-nowrap">
          <strong
            className={`
              block text-[1.05rem] lg:text-[1.12rem]
              font-extrabold tracking-[0.12em]
              ${light ? "text-white" : "text-zinc-950"}
            `}
          >
            RACK &amp; STACK
          </strong>

          <span
            className={`
              mt-1.5 block
              text-[0.58rem] lg:text-[0.62rem]
              font-semibold tracking-[0.19em]
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