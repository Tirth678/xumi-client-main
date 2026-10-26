import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Clock3, CreditCard, Loader2, Package, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { useAuth } from "@/contexts/AuthContext";
import { getActivePreorder, getPreorders, type Preorder } from "@/lib/preorders";
import { getSafeErrorMessage } from "@/lib/apiErrors";
import { loginWithGoogle } from "@/lib/neonAuth";
import { XUMI_IMAGE, XUMI_PRICE_LABEL } from "@/data/productCatalog";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const StatusBadge = ({ status }: { status: Preorder["status"] }) =>
  status === "paid" ? (
    <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-4 py-1.5 font-body text-xs font-bold uppercase tracking-widest text-accent">
      <BadgeCheck size={14} /> Payment confirmed
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 font-body text-xs font-bold uppercase tracking-widest text-foreground">
      <Clock3 size={14} /> {status === "payment_pending" ? "Payment due" : status === "received" ? "Under review" : status}
    </span>
  );

const AccountPage = () => {
  useEffect(() => {
    document.title = "My order | XUMI";
  }, []);

  const { user, token, isAuthenticated, isLoading } = useAuth();
  const [preorder, setPreorder] = useState<Preorder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!token) { setPreorder(null); return; }
    setLoadingOrder(true);
    try { setPreorder(getActivePreorder(await getPreorders(token))); }
    catch (error) { toast.error(getSafeErrorMessage(error, "We couldn't load your order.")); }
    finally { setLoadingOrder(false); }
  }, [token]);

  useEffect(() => { void loadOrder(); }, [loadOrder]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      const result = await loginWithGoogle("/account");
      if (!result.success) {
        toast.error(getSafeErrorMessage(new Error(result.error ?? ""), "Google sign-in failed."));
      }
    } catch (error) {
      toast.error(getSafeErrorMessage(error, "Google sign-in failed."));
    } finally {
      setSigningIn(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div>
        <Navbar />
        <div className="h-16 md:h-20" />
        <div className="container mx-auto max-w-3xl px-4 py-10">{children}</div>
      </div>
      <FooterSection />
    </div>
  );

  if (isLoading || loadingOrder) {
    return shell(
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>,
    );
  }

  if (!isAuthenticated || !user) {
    return shell(
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <h1 className="font-display text-2xl font-bold">Sign in to see your order</h1>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          Sign in with Google or email and password to see your pre-order.
        </p>
        <button
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {signingIn ? <Loader2 size={16} className="animate-spin" /> : null}
          Continue with Google
        </button>
        <Link to="/login" className="mt-3 inline-flex font-body text-sm font-bold underline">
          Sign in with email and password
        </Link>
      </div>,
    );
  }

  if (!preorder) {
    return shell(
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold">No pre-order yet</h1>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          Reserve your XUMI now — it takes a minute and nothing is charged today.
        </p>
        <Link
          to="/preorder"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
        >
          Pre-order XUMI <ArrowRight size={16} />
        </Link>
      </div>,
    );
  }

  return shell(
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Pre-order {preorder.id}
          </p>
          <h1 className="font-display text-3xl font-black">My order</h1>
        </div>
        <StatusBadge status={preorder.status} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-card"
      >
        <div className="flex gap-4">
          <img src={XUMI_IMAGE} alt={preorder.productName} className="h-20 w-20 rounded-xl object-cover" />
          <div className="flex-1">
            <p className="font-display text-lg font-bold">{preorder.productName}</p>
            <p className="font-body text-sm text-muted-foreground">
              Placed on {formatDate(preorder.createdAt)}
            </p>
            <p className="font-body text-sm">Qty {preorder.quantity}</p>
          </div>
          <p className="font-display font-bold">{XUMI_PRICE_LABEL}</p>
        </div>

        <div className="mt-6 rounded-xl bg-secondary/60 p-4 font-body text-sm">
          {preorder.status === "paid" ? (
            <p className="text-foreground">
              Your payment and XUMI booking are confirmed. We will email tracking details to{" "}
              <span className="font-bold">{preorder.email}</span> as soon as it ships.
            </p>
          ) : preorder.status === "payment_pending" ? (
            <div>
              <p className="text-foreground">
                Your booking is ready. Pay <strong>₹{preorder.totalAmount.toLocaleString("en-IN")}</strong>{" "}
                by {preorder.bookingExpiresAt ? formatDate(preorder.bookingExpiresAt) : "the date in your email"}.
              </p>
              {preorder.paymentUrl && (
                <a href={preorder.paymentUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-display font-bold text-primary-foreground">
                  <CreditCard size={16} /> Pay now
                </a>
              )}
              <button onClick={() => void loadOrder()} className="ml-3 mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 font-display font-bold">
                <RefreshCw size={16} /> Check payment
              </button>
            </div>
          ) : preorder.status === "received" ? (
            <p className="text-muted-foreground">
              We received your pre-order. You will get an email at{" "}
              <span className="font-bold text-foreground">{preorder.email}</span> with the amount and a
              payment link that stays valid for 15 days.
            </p>
          ) : (
            <p className="text-muted-foreground">This booking is {preorder.status}. Please place a new pre-order or contact support.</p>
          )}
        </div>

        <dl className="mt-6 grid gap-4 border-t border-border pt-6 font-body text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Shipping to
            </dt>
            <dd className="mt-1 leading-relaxed">
              {preorder.customerName}
              <br />
              {preorder.address.line1}
              <br />
              {preorder.address.city}, {preorder.address.state} {preorder.address.pincode}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Contact
            </dt>
            <dd className="mt-1 leading-relaxed">
              {preorder.email}
              <br />
              {preorder.phone}
            </dd>
          </div>
        </dl>
      </motion.div>

      <p className="mt-6 text-center font-body text-sm text-muted-foreground">
        Something wrong? Email{" "}
        <a href="mailto:support@robocraft.com" className="underline">
          support@robocraft.com
        </a>
        .
      </p>
    </>,
  );
};

export default AccountPage;
