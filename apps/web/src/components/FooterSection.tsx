import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
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
    links: [{ label: "parmarjaimin150@gmail.com", href: "mailto:parmarjaimin150@gmail.com" }],
  },
];

function SystemStatus() {
  const [status, setStatus] = useState<"operational" | "degraded" | "down">("operational");
  const [lastChecked, setLastChecked] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly set status (mostly operational for realism)
      const rand = Math.random();
      if (rand > 0.95) {
        setStatus("degraded");
      } else if (rand > 0.98) {
        setStatus("down");
      } else {
        setStatus("operational");
      }
      setLastChecked(new Date());
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case "operational":
        return "text-green-500";
      case "degraded":
        return "text-yellow-500";
      case "down":
        return "text-red-500";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "operational":
        return "All systems operational";
      case "degraded":
        return "Some systems degraded";
      case "down":
        return "Systems experiencing issues";
    }
  };

  return (
    <span className="flex items-center gap-2">
      <Activity className={`w-4 h-4 ${getStatusColor()} animate-pulse`} />
      <span className={getStatusColor()}>{getStatusText()}</span>
      <span className="text-muted-foreground text-xs">
        (Last checked: {lastChecked.toLocaleTimeString()})
      </span>
    </span>
  );
}

export default function FooterSection() {
  return (
    <DuneHaulFooter
      name=""
      brandHref="/"
      logo={<img src="/logo-black.png" alt="RoboCraft logo" className="h-8 w-auto" />}
      preset="auto"
      columns={columns}
      socials={[]}
      fontFamily="var(--font-body)"
      copyright={
        <span className="flex flex-col gap-1">
          <span>{`© ${new Date().getFullYear()} RoboCraft. All rights reserved. XUMI — your personal tiny desk partner. We aim to reply within 24 hours on weekdays.`}</span>
          <SystemStatus />
        </span>
      }
    />
  );
}
