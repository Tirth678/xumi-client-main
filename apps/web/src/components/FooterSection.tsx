import { Bot } from "lucide-react";
import DuneHaulFooter, { type DuneHaulColumn } from "@/components/ui/dune-haul-footer";

const columns: DuneHaulColumn[] = [
  {
    title: "XUMI",
    links: [
      { label: "Meet XUMI", href: "/#product" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pre-order", href: "/preorder" },
    ],
  },
  {
    title: "Your account",
    links: [
      { label: "My order", href: "/account" },
      { label: "Sign in", href: "/login" },
    ],
  },
  {
    title: "Contact",
    links: [{ label: "support@robocraft.com", href: "mailto:support@robocraft.com" }],
  },
];

export default function FooterSection() {
  return (
    <DuneHaulFooter
      name="RoboCraft"
      brandHref="/"
      logo={<Bot className="dhf-mark text-accent" aria-hidden="true" />}
      preset="auto"
      columns={columns}
      socials={[]}
      fontFamily="var(--font-body)"
      copyright={`© ${new Date().getFullYear()} RoboCraft. All rights reserved. XUMI — your personal tiny desk partner. We aim to reply within 24 hours on weekdays.`}
    />
  );
}
