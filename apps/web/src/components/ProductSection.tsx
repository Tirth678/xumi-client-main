import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollReveal from "./ScrollReveal";
import {
  XUMI,
  XUMI_DISCOUNT_PERCENT,
  XUMI_FEATURES,
  XUMI_GALLERY,
  XUMI_MRP_LABEL,
  XUMI_PRICE_LABEL,
} from "@/data/productCatalog";

const ProductSection = () => {
  const [selectedImg, setSelectedImg] = useState(0);

  return (
    <section id="product" className="py-16 md:py-24 bg-background">
      <ScrollReveal>
        <h2 className="text-center font-display text-3xl md:text-5xl font-bold mb-4">
          Meet <span className="text-brand italic">XUMI</span>
        </h2>
        <p className="mx-auto mb-12 max-w-xl px-4 text-center font-body text-muted-foreground">
          {XUMI.tagline}. One product, one launch — pre-orders are open now.
        </p>
      </ScrollReveal>

      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main image */}
        <ScrollReveal direction="left" className="lg:col-span-5">
          <motion.div
            key={selectedImg}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl overflow-hidden bg-secondary aspect-square flex items-center justify-center"
          >
            <img
              src={XUMI_GALLERY[selectedImg]}
              alt={XUMI.name}
              decoding="async"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </ScrollReveal>

        {/* Thumbnails */}
        <div className="lg:col-span-2 flex lg:flex-col gap-3 overflow-x-auto no-scrollbar">
          {XUMI_GALLERY.map((thumb, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedImg(i)}
              aria-label={`Show XUMI view ${i + 1}`}
              aria-pressed={selectedImg === i}
              className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                selectedImg === i ? "border-accent scale-105" : "border-border hover:border-muted-foreground"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`}
            >
              <img
                src={thumb}
                alt=""
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                className="w-full h-full object-cover"
              />
            </motion.button>
          ))}
        </div>

        {/* Details */}
        <ScrollReveal direction="right" className="lg:col-span-5 flex flex-col justify-center">
          <span className="mb-3 w-fit rounded-full bg-accent/20 px-3 py-1 font-body text-[11px] font-bold uppercase tracking-widest text-accent">
            Pre-order
          </span>
          <h3 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight">
            {XUMI.name}
          </h3>
          <p className="mt-3 font-body text-muted-foreground">{XUMI.description}</p>

          <div className="mt-6">
            <span className="font-display text-4xl font-bold">{XUMI_PRICE_LABEL}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground line-through">{XUMI_MRP_LABEL}</span>
              <span className="text-brand font-semibold">{XUMI_DISCOUNT_PERCENT}% off</span>
            </div>
            <p className="mt-2 flex items-center gap-2 font-body text-sm text-muted-foreground">
              <Truck size={16} className="text-accent" />
              {XUMI.shipping} · no payment today
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <Link
              to="/preorder"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border-[4px] border-foreground bg-gradient-cta px-8 py-4 font-display text-lg font-bold text-primary-foreground shadow-hero transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 md:px-12 md:py-5 md:text-xl"
            >
              Pre-order XUMI <ArrowRight size={20} />
            </Link>
          </div>

          <div className="mt-8 p-6 rounded-2xl border border-border">
            <h4 className="font-display font-bold text-lg mb-4">What XUMI does</h4>
            <ul className="space-y-2">
              {XUMI_FEATURES.map((feature, i) => (
                <ScrollReveal key={feature} delay={i * 0.05}>
                  <li className="flex items-center gap-2">
                    <Check size={18} className="text-accent flex-shrink-0" />
                    <span className="font-body">{feature}</span>
                  </li>
                </ScrollReveal>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default ProductSection;
