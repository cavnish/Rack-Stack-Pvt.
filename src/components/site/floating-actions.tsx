import { Phone } from "lucide-react";
import { phoneHref, whatsappHref } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/site/social-icons";

/**
 * The floating contact actions in the bottom-right corner.
 *
 * Mobile shows WhatsApp and nothing else. There used to be a phone button here
 * that was `md:hidden`, i.e. mobile-only, which meant a phone carried two
 * competing round buttons plus the product page's own fixed action bar — and on a
 * product page that bar reserves `pr-28` for this cluster, so every extra button
 * pushed the FABs into it. The phone action is still one tap away from the header
 * and the contact page, so on a phone the single WhatsApp button is both the
 * smaller target set and the less cluttered one.
 *
 * From `md` up there is room for both, so the phone button is `hidden md:grid`.
 *
 * `z-50` keeps the cluster above the product action bar (`z-40`), and the bar
 * reserves its right-hand padding, so the FAB never sits on top of a button.
 */
export function FloatingActions({ phone, whatsapp }: { phone: string; whatsapp: string }) {
  return (
    <div className="mp-fab fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <a
        href={phoneHref(phone)}
        aria-label="Call Rack and Stack"
        className="hidden h-12 w-12 place-items-center rounded-full bg-zinc-900 text-white shadow-xl md:grid"
      >
        <Phone size={18} />
      </a>
      <a
        href={whatsappHref(whatsapp)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Message Rack and Stack on WhatsApp"
        className="relative grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-xl"
      >
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-25" />
        <WhatsAppIcon size={24} className="relative" />
      </a>
    </div>
  );
}
