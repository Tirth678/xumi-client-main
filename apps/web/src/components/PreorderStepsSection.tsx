import { BadgeCheck, LogIn, PackageCheck } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const steps = [
  {
    icon: LogIn,
    title: "Sign in with Google",
    body: "One tap, no passwords. Your Google account is all we need to hold your place in the queue.",
  },
  {
    icon: PackageCheck,
    title: "Reserve your XUMI",
    body: "Confirm your shipping details and place the pre-order. Nothing is charged today.",
  },
  {
    icon: BadgeCheck,
    title: "Check your confirmation",
    body: "Open My Order any time to see whether your XUMI is confirmed or still waiting in review.",
  },
];

const PreorderStepsSection = () => {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-secondary">
      <ScrollReveal>
        <h2 className="text-center font-display text-3xl md:text-5xl font-bold mb-12">
          How pre-order <span className="text-brand">works</span>
        </h2>
      </ScrollReveal>

      <div className="container mx-auto grid grid-cols-1 gap-6 px-4 md:grid-cols-3">
        {steps.map((step, i) => (
          <ScrollReveal key={step.title} delay={i * 0.1}>
            <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <step.icon size={22} />
              </div>
              <p className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Step {i + 1}
              </p>
              <h3 className="mt-1 font-display text-xl font-bold">{step.title}</h3>
              <p className="mt-2 font-body text-sm text-muted-foreground">{step.body}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
};

export default PreorderStepsSection;
