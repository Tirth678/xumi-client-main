"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface FeatureItem {
  title: string;
  alt?: string;
  content: string | React.ReactNode;
}

function FeatureMedia({ content, alt }: Pick<FeatureItem, "content" | "alt">) {
  if (typeof content !== "string") {
    return <div className="h-full w-full">{content}</div>;
  }
  if (/\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(content)) {
    return <video src={content} autoPlay muted loop playsInline aria-label={alt} className="h-full w-full object-cover" />;
  }
  if (/\.(jpg|jpeg|png|webp|gif|avif|svg)(?:[?#].*)?$/i.test(content) || /unsplash|images\./i.test(content)) {
    return <img src={content} alt={alt ?? ""} decoding="async" className="h-full w-full object-cover" />;
  }
  return <div className="flex h-full w-full items-center justify-center p-8"><p className="text-sm leading-relaxed text-muted-foreground">{content}</p></div>;
}

export default function FeaturesWithPanel({
  items,
  title = "What XUMI does",
  children,
}: {
  items: FeatureItem[];
  title?: string;
  children?: React.ReactNode;
}) {
  const [active, setActive] = React.useState(0);
  const reducedMotion = useReducedMotion();
  const headingId = React.useId();
  const duration = reducedMotion ? 0 : 0.35;
  const selected = items[active] ?? items[0];

  if (!selected) return null;

  return (
    <section id="features" aria-labelledby={headingId} className="relative w-full bg-background py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-start lg:gap-16">
          <div>
            <h2 id={headingId} className="mb-10 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">{title}</h2>
            <ul className="flex flex-col gap-1">
              {items.map((item, index) => (
                <motion.li
                  key={item.title}
                  initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration, delay: reducedMotion ? 0 : index * 0.07 }}
                  className={cn("rounded-xl ring-1 transition-colors", active === index ? "ring-foreground" : "ring-transparent")}
                >
                  <button
                    type="button"
                    onClick={() => setActive(index)}
                    aria-pressed={active === index}
                    className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <span aria-hidden="true" className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors", active === index ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>{index + 1}</span>
                    <span className={cn("font-body text-sm font-medium transition-colors", active === index ? "text-foreground" : "text-muted-foreground")}>{item.title}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {active === index && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration }} className="w-full overflow-hidden lg:hidden">
                        <div className="px-4 pb-4">
                          <Card className="relative aspect-[4/3] w-full overflow-hidden p-0">
                            <div className="absolute inset-0"><FeatureMedia content={item.content} alt={item.alt} /></div>
                          </Card>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              ))}
            </ul>
            {children}
          </div>
          <div className="sticky top-24 hidden lg:block">
            <Card className="relative aspect-[4/3] w-full overflow-hidden p-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={selected.title} initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }} transition={{ duration }} className="absolute inset-0">
                  <FeatureMedia content={selected.content} alt={selected.alt} />
                </motion.div>
              </AnimatePresence>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
