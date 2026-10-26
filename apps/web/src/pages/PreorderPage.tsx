import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { createPreorder, getPreorderFor } from "@/lib/preorders";
import { getSafeErrorMessage } from "@/lib/apiErrors";
import { loginWithGoogle } from "@/lib/neonAuth";
import { XUMI, XUMI_IMAGE, XUMI_MRP_LABEL, XUMI_PRICE_LABEL } from "@/data/productCatalog";
import GoogleIcon from "@/components/GoogleIcon";

const preorderSchema = z.object({
  customerName: z.string().trim().min(2, "Please tell us your full name").max(80, "That name is too long"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(/^[+]?[\d\s-]{10,15}$/, "Please enter a valid phone number"),
  line1: z.string().trim().min(5, "Address is required").max(200, "That address is too long"),
  city: z.string().trim().min(2, "City is required").max(80, "That city name is too long"),
  state: z.string().trim().min(2, "State is required").max(80, "That state name is too long"),
  pincode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9\s-]{3,10}$/, "Please enter a valid PIN code"),
});

type PreorderFormData = z.infer<typeof preorderSchema>;

const PreorderPage = () => {
  useEffect(() => {
    document.title = "Pre-order XUMI | RoboCraft";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Reserve your XUMI desk partner. No payment today, free shipping, and you can check your confirmation any time."
      );
    }
  }, []);

  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const existingPreorder = isAuthenticated && user ? getPreorderFor(user.email) : null;

  const form = useForm<PreorderFormData>({
    resolver: zodResolver(preorderSchema),
    defaultValues: {
      customerName: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
      phone: "",
      line1: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  const handleSubmit = (data: PreorderFormData) => {
    if (!user) {
      toast.error("Please sign in to pre-order XUMI.");
      return;
    }

    setSubmitting(true);
    try {
      createPreorder({
        customerName: data.customerName,
        email: user.email,
        phone: data.phone,
        address: {
          line1: data.line1,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
        },
      });
      toast.success("Pre-order placed!", {
        description: "Check My order any time to see if it is confirmed.",
      });
      navigate("/account");
    } catch (error) {
      toast.error(getSafeErrorMessage(error, "We couldn't save your pre-order. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        toast.error(getSafeErrorMessage(new Error(result.error ?? ""), "Google sign-in failed."));
      }
    } catch (error) {
      toast.error(getSafeErrorMessage(error, "Google sign-in failed."));
    } finally {
      setSigningIn(false);
    }
  };

  const summary = (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="font-display text-xl font-bold mb-4">Your pre-order</h2>
      <div className="flex gap-4">
        <img
          src={XUMI_IMAGE}
          alt={XUMI.name}
          className="h-20 w-20 rounded-xl object-cover"
        />
        <div className="flex-1">
          <p className="font-display text-lg font-bold">{XUMI.name}</p>
          <p className="font-body text-sm text-muted-foreground">{XUMI.tagline}</p>
          <p className="mt-1 font-body text-sm">Qty 1</p>
        </div>
        <div className="text-right">
          <p className="font-display font-bold">{XUMI_PRICE_LABEL}</p>
          <p className="font-body text-xs text-muted-foreground line-through">{XUMI_MRP_LABEL}</p>
        </div>
      </div>

      <div className="mt-5 space-y-2 border-t border-border pt-4 font-body text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span className="text-accent">Free</span>
        </div>
        <div className="flex justify-between font-display text-lg font-bold">
          <span>Due today</span>
          <span className="text-accent">₹0</span>
        </div>
        <p className="flex items-start gap-2 pt-2 text-xs text-muted-foreground">
          <Truck size={14} className="mt-0.5 flex-shrink-0 text-accent" />
          {XUMI.shippingNote}. You pay nothing today — we only ask for shipping details.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div>
        <Navbar />
        <div className="h-16 md:h-20" />

        <div className="container mx-auto max-w-5xl px-4 py-10">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 font-body text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} /> Back to XUMI
          </Link>

          <h1 className="font-display text-3xl md:text-4xl font-black mb-2">Pre-order XUMI</h1>
          <p className="mb-8 font-body text-muted-foreground">
            One product, one launch. Reserve yours and we will confirm it by email.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !isAuthenticated || !user ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card"
            >
              <h2 className="font-display text-2xl font-bold">Sign in to continue</h2>
              <p className="mt-2 font-body text-sm text-muted-foreground">
                Pre-orders are tied to your Google account so you can check your confirmation later.
              </p>
              <button
                onClick={handleGoogleSignIn}
                disabled={signingIn}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background py-3 font-display text-sm font-bold text-foreground transition-all hover:bg-secondary active:scale-95 disabled:opacity-50"
              >
                {signingIn ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </button>
            </motion.div>
          ) : existingPreorder ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card"
            >
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-accent" />
              <h2 className="font-display text-2xl font-bold">You are already in the queue</h2>
              <p className="mt-2 font-body text-sm text-muted-foreground">
                Pre-order <span className="font-bold text-foreground">{existingPreorder.id}</span> for{" "}
                {existingPreorder.productName} is on file for {existingPreorder.email}.
              </p>
              <Link
                to="/account"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
              >
                View my order <ArrowRight size={16} />
              </Link>
            </motion.div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <h2 className="font-display mb-6 text-xl font-bold">Shipping details</h2>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full name</FormLabel>
                          <FormControl>
                            <Input placeholder="Alex Rider" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-1">
                      <FormLabel>Email</FormLabel>
                      <div className="rounded-xl border border-border bg-secondary/60 px-3.5 py-2.5 font-body text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+91 98765 43210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="line1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main Street, Apt 4B" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="Mumbai" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input placeholder="Maharashtra" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PIN code</FormLabel>
                          <FormControl>
                            <Input placeholder="400001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-2 flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-[3px] border-foreground bg-gradient-cta px-8 font-display text-lg font-bold text-primary-foreground shadow-hero transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                    >
                      {submitting ? <Loader2 size={20} className="animate-spin" /> : "Place pre-order"}
                    </button>
                    <p className="text-center font-body text-xs text-muted-foreground">
                      No payment is taken now. We will email you when your XUMI is confirmed.
                    </p>
                  </form>
                </Form>
              </div>

              <div className="lg:sticky lg:top-28 lg:self-start">{summary}</div>
            </div>
          )}
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default PreorderPage;
