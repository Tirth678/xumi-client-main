import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Info,
  Loader2,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  Sparkles,
  Truck,
  UserCheck,
} from "lucide-react";
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
import { createPreorder, getActivePreorder, getPreorders, type Preorder } from "@/lib/preorders";
import { getSafeErrorMessage } from "@/lib/apiErrors";
import { loginWithGoogle, refreshAccessToken } from "@/lib/neonAuth";
import { XUMI, XUMI_IMAGE } from "@/data/productCatalog";
import GoogleIcon from "@/components/GoogleIcon";

const PRODUCT_EDITIONS = [
  { id: "Classic Matte White", label: "Classic Matte White", badge: "Most Popular", color: "bg-stone-100 border-stone-300" },
  { id: "Midnight Obsidian", label: "Midnight Obsidian", badge: "Stealth", color: "bg-zinc-900 border-zinc-700 text-white" },
  { id: "Cyber Slate", label: "Cyber Slate", badge: "Limited", color: "bg-slate-700 border-slate-500 text-white" },
] as const;

const preorderSchema = z.object({
  customerName: z.string().trim().min(2, "Please tell us your full name").max(80, "That name is too long"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(/^[+]?[\d\s-]{10,15}$/, "Please enter a valid phone number"),
  edition: z.string().min(1, "Please choose an edition").default("Classic Matte White"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(5, "Maximum 5 units per pre-order").default(1),
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

  const { user, token, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const [existingPreorder, setExistingPreorder] = useState<Preorder | null>(null);
  const [loadingPreorder, setLoadingPreorder] = useState(false);

  useEffect(() => {
    if (!token) {
      setExistingPreorder(null);
      return;
    }
    let active = true;
    setLoadingPreorder(true);
    getPreorders(token)
      .then((orders) => {
        if (active) setExistingPreorder(getActivePreorder(orders));
      })
      .catch((error) => {
        if (active) toast.error(getSafeErrorMessage(error, "We couldn't load your pre-order."));
      })
      .finally(() => {
        if (active) setLoadingPreorder(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const form = useForm<PreorderFormData>({
    resolver: zodResolver(preorderSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      edition: "Classic Matte White",
      quantity: 1,
      line1: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  // Automatically auto-fill user details (Name, Email, and previously saved details) once loaded
  useEffect(() => {
    if (!user) return;

    const computedName =
      user.name?.trim() ||
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      localStorage.getItem("xumi_customer_name") ||
      "";
    const savedPhone = localStorage.getItem("xumi_customer_phone") || "";
    const savedLine1 = localStorage.getItem("xumi_address_line1") || "";
    const savedCity = localStorage.getItem("xumi_address_city") || "";
    const savedState = localStorage.getItem("xumi_address_state") || "";
    const savedPincode = localStorage.getItem("xumi_address_pincode") || "";

    const currentValues = form.getValues();
    form.reset({
      ...currentValues,
      customerName: currentValues.customerName || computedName,
      phone: currentValues.phone || savedPhone,
      line1: currentValues.line1 || savedLine1,
      city: currentValues.city || savedCity,
      state: currentValues.state || savedState,
      pincode: currentValues.pincode || savedPincode,
    });
  }, [user, form]);

  const selectedQuantity = form.watch("quantity") || 1;
  const selectedEdition = form.watch("edition") || "Classic Matte White";

  const totalAmount = XUMI.price * selectedQuantity;
  const totalMrp = XUMI.originalPrice * selectedQuantity;
  const totalSavings = totalMrp - totalAmount;

  const handleSubmit = async (data: PreorderFormData) => {
    let activeToken = token;
    if (!activeToken) {
      activeToken = await refreshAccessToken();
    }
    if (!user || !activeToken) {
      toast.error("Please sign in to pre-order XUMI.");
      return;
    }

    setSubmitting(true);
    try {
      // Remember non-sensitive preferences for future auto-fill
      try {
        localStorage.setItem("xumi_customer_name", data.customerName);
        localStorage.setItem("xumi_customer_phone", data.phone);
        localStorage.setItem("xumi_address_line1", data.line1);
        localStorage.setItem("xumi_address_city", data.city);
        localStorage.setItem("xumi_address_state", data.state);
        localStorage.setItem("xumi_address_pincode", data.pincode);
      } catch (_err) {
        // ignore localStorage access issues in private browsing
      }

      await createPreorder(
        {
          customerName: data.customerName,
          phone: data.phone,
          quantity: data.quantity,
          edition: data.edition,
          address: {
            line1: data.line1,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
          },
        },
        activeToken,
      );
      toast.success("Pre-order placed!", {
        description: "We emailed you a confirmation receipt. Payment details follow after review.",
      });
      navigate("/account");
    } catch (error) {
      toast.error(getSafeErrorMessage(error, "We couldn't save your pre-order. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalid = (errors: Record<string, { message?: string }>) => {
    const firstKey = Object.keys(errors)[0];
    const message = errors[firstKey]?.message || "Please fill in all required shipping details.";
    toast.error(message);
  };

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      const result = await loginWithGoogle("/preorder");
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold">Your reservation</h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
          <Sparkles size={12} /> Early Bird Slot
        </span>
      </div>

      <div className="flex gap-4">
        <img
          src={XUMI_IMAGE}
          alt={XUMI.name}
          className="h-24 w-24 rounded-xl object-cover border border-border"
        />
        <div className="flex-1">
          <p className="font-display text-lg font-bold">{XUMI.name}</p>
          <p className="font-body text-xs text-muted-foreground">{selectedEdition}</p>
          <p className="mt-1 font-body text-xs text-accent font-medium">Qty: {selectedQuantity}</p>
          <p className="mt-1 font-display font-bold text-foreground">
            ₹{totalAmount.toLocaleString("en-IN")}{" "}
            <span className="font-body text-xs text-muted-foreground line-through font-normal">
              ₹{totalMrp.toLocaleString("en-IN")}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2 border-t border-border pt-4 font-body text-sm">
        <div className="flex justify-between text-muted-foreground text-xs">
          <span>Unit price</span>
          <span>₹{XUMI.price.toLocaleString("en-IN")} each</span>
        </div>
        <div className="flex justify-between text-muted-foreground text-xs">
          <span>Launch discount</span>
          <span className="text-emerald-500 font-medium">-₹{totalSavings.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between text-muted-foreground text-xs">
          <span>Shipping</span>
          <span className="text-accent font-semibold">Free</span>
        </div>
        <div className="flex justify-between font-display text-lg font-bold pt-2 border-t border-border/60">
          <span>Pay today</span>
          <span className="text-accent">₹0</span>
        </div>
        <div className="rounded-xl bg-secondary/60 p-3 mt-3 text-xs space-y-1.5 text-muted-foreground">
          <p className="flex items-start gap-2">
            <Truck size={14} className="mt-0.5 flex-shrink-0 text-accent" />
            <span>{XUMI.shippingNote}.</span>
          </p>
          <p className="flex items-start gap-2">
            <ShieldCheck size={14} className="mt-0.5 flex-shrink-0 text-emerald-500" />
            <span>Pay nothing today. We will email your verified 15-day payment link after reviewing your reservation.</span>
          </p>
        </div>
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
            Reserve your launch unit today. Fill in your details below to hold your spot in the batch queue.
          </p>

          {isLoading || loadingPreorder ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !isAuthenticated || !user ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card"
            >
              <h2 className="font-display text-2xl font-bold">Sign in to pre-order</h2>
              <p className="mt-2 font-body text-sm text-muted-foreground">
                Sign in with Google so your contact details auto-fill and you can track your reservation.
              </p>
              <button
                onClick={handleGoogleSignIn}
                disabled={signingIn}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background py-3.5 font-display text-sm font-bold text-foreground transition-all hover:bg-secondary active:scale-95 disabled:opacity-50"
              >
                {signingIn ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </button>
              <Link
                to="/login"
                onClick={() => {
                  try {
                    sessionStorage.setItem("auth_redirect", "/preorder");
                  } catch (_err) {
                    // ignore sessionStorage errors
                  }
                }}
                className="mt-4 inline-flex font-body text-sm font-bold text-foreground underline"
              >
                Or sign in with email and password
              </Link>
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
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit, onInvalid)} className="space-y-6">
                    {/* SECTION 1: ACCOUNT & CONTACT DETAILS (AUTO-FILLED) */}
                    <div>
                      <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                        <div className="flex items-center gap-2">
                          <UserCheck size={18} className="text-accent" />
                          <h2 className="font-display text-lg font-bold">1. Contact & Identity</h2>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <Check size={12} /> Auto-filled
                        </span>
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="customerName"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel>Full name</FormLabel>
                                <span className="text-xs text-muted-foreground">From account</span>
                              </div>
                              <FormControl>
                                <Input placeholder="Alex Rider" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <FormLabel>Email address</FormLabel>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent">
                              <ShieldCheck size={12} /> Verified account
                            </span>
                          </div>
                          <div className="rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5 font-body text-sm font-medium text-foreground">
                            {user.email}
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact phone</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="+91 98765 43210" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* SECTION 2: PRODUCT DETAILS & PREFERENCES */}
                    <div>
                      <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                        <Package size={18} className="text-accent" />
                        <h2 className="font-display text-lg font-bold">2. Product Details</h2>
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="edition"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Choose Finish / Edition</FormLabel>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                                {PRODUCT_EDITIONS.map((edition) => {
                                  const isSelected = field.value === edition.id;
                                  return (
                                    <button
                                      type="button"
                                      key={edition.id}
                                      onClick={() => field.onChange(edition.id)}
                                      className={`relative flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                                        isSelected
                                          ? "border-accent bg-accent/5 ring-2 ring-accent/30"
                                          : "border-border hover:bg-secondary/40"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span className="text-xs font-bold leading-tight">{edition.label}</span>
                                        {isSelected && <Check size={14} className="text-accent flex-shrink-0" />}
                                      </div>
                                      <span className="mt-2 text-[10px] text-muted-foreground uppercase font-semibold">
                                        {edition.badge}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => field.onChange(Math.max(1, (field.value || 1) - 1))}
                                  disabled={(field.value || 1) <= 1}
                                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background transition-colors hover:bg-secondary disabled:opacity-40"
                                >
                                  <Minus size={16} />
                                </button>
                                <span className="w-12 text-center font-display text-lg font-bold">
                                  {field.value || 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => field.onChange(Math.min(5, (field.value || 1) + 1))}
                                  disabled={(field.value || 1) >= 5}
                                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background transition-colors hover:bg-secondary disabled:opacity-40"
                                >
                                  <Plus size={16} />
                                </button>
                                <span className="font-body text-xs text-muted-foreground ml-2">
                                  (Max 5 units per reservation)
                                </span>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* SECTION 3: SHIPPING ADDRESS */}
                    <div>
                      <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                        <Truck size={18} className="text-accent" />
                        <h2 className="font-display text-lg font-bold">3. Shipping Address</h2>
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="line1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Street address / Flat No.</FormLabel>
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
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-[3px] border-foreground bg-gradient-cta px-8 font-display text-lg font-bold text-primary-foreground shadow-hero transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                      >
                        {submitting ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          `Reserve ${selectedQuantity} ${selectedQuantity > 1 ? "Units" : "Unit"} — Pay ₹0 Now`
                        )}
                      </button>
                      <p className="mt-2.5 text-center font-body text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                        <Info size={13} className="text-accent" />
                        No payment required today. We verify allocations before requesting payment.
                      </p>
                    </div>
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
