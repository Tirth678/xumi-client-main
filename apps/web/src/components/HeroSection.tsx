import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motionEase } from "@/lib/motion";
import { XUMI, XUMI_PRICE_LABEL } from "@/data/productCatalog";

const HeroSection = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section id="home" className="relative min-h-screen overflow-hidden">
      <img
        src="/xumi-hero.png"
        alt="XUMI desk companion robot glowing under his logo on a wooden desk"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-hero-overlay" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-5"
            style={{
              background: `radial-gradient(circle, hsl(${i * 120}, 80%, 60%), transparent)`,
              width: `${300 + i * 150}px`,
              height: `${300 + i * 150}px`,
              left: `${10 + i * 20}%`,
              top: `${-20 + i * 30}%`,
            }}
            animate={{
              scale: reduceMotion ? 1 : [1, 1.15, 1],
              x: reduceMotion ? 0 : [0, 36, 0],
              y: reduceMotion ? 0 : [0, -24, 0],
            }}
            transition={{
              duration: 9 + i * 2,
              repeat: reduceMotion ? 0 : Infinity,
              ease: motionEase,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end min-h-screen px-6 md:px-16 pb-20 pt-28">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-1.5 font-body text-xs font-bold tracking-[0.18em] text-primary-foreground uppercase backdrop-blur"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          Pre-orders open
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: motionEase, type: "spring", stiffness: 80 }}
          className="font-display text-6xl md:text-8xl font-black tracking-tight text-primary-foreground uppercase"
        >
          <motion.span
            animate={{ y: reduceMotion ? 0 : [0, -4, 0] }}
            transition={{ duration: 3, repeat: reduceMotion ? 0 : Infinity, ease: motionEase }}
            className="inline-block"
          >
            {XUMI.name}
          </motion.span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
          className="mt-4 max-w-xl text-lg md:text-2xl text-primary-foreground/85 font-body"
        >
          Your personal tiny desk partner.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
          className="mt-8 flex flex-wrap items-center gap-4"
        >
          <Link
            to="/preorder"
            className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border-[4px] border-foreground bg-gradient-cta px-8 py-4 font-display text-base font-bold text-primary-foreground shadow-hero transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 md:text-lg"
          >
            Pre-order for {XUMI_PRICE_LABEL}
            <ArrowRight size={20} />
          </Link>
          <a
            href="#product"
            className="inline-flex min-h-14 items-center justify-center rounded-full border border-primary-foreground/40 px-8 py-4 font-display text-base font-bold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
          >
            Meet XUMI
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: reduceMotion ? 0 : [0, 10, 0] }}
            transition={{ duration: 1.6, repeat: reduceMotion ? 0 : Infinity }}
            className="w-6 h-10 rounded-full border-2 border-primary-foreground/40 flex justify-center pt-2"
          >
            <motion.div
              className="w-1 h-2 bg-primary-foreground/60 rounded-full"
              animate={{
                y: reduceMotion ? 0 : [0, 6, 0],
                opacity: reduceMotion ? 0.8 : [0.6, 1, 0.6],
              }}
              transition={{ duration: 1.6, repeat: reduceMotion ? 0 : Infinity }}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
