import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight, Loader2, LogOut, Mail, User } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { loginWithGoogle, handleOAuthCallback } from "@/lib/neonAuth";
import { getSafeErrorMessage } from "@/lib/apiErrors";
import GoogleIcon from "@/components/GoogleIcon";

const SimpleAuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Sign in | XUMI";
  }, []);

  useEffect(() => {
    if (location.pathname !== "/auth/callback") return;

    setSubmitting(true);
    handleOAuthCallback()
      .then((res) => {
        if (res.success) {
          toast.success("Signed in with Google.");
          navigate("/account");
          return;
        }
        toast.error(res.error || "Google authentication failed.");
        navigate("/login");
      })
      .catch(() => {
        toast.error("Google authentication failed.");
        navigate("/login");
      })
      .finally(() => setSubmitting(false));
  }, [location.pathname, navigate]);

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        toast.error(getSafeErrorMessage(new Error(result.error ?? ""), "Google sign-in failed."));
      }
    } catch (error) {
      toast.error(getSafeErrorMessage(error, "Google sign-in failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-6">
      {children}
    </div>
  );

  if (isLoading) {
    return shell(<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />);
  }

  if (isAuthenticated && user) {
    return shell(
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-card"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-foreground">
            <User size={32} />
          </div>
          <p className="mb-1 font-body text-xs font-bold uppercase tracking-widest text-muted-foreground">
            XUMI by RoboCraft
          </p>
          <h1 className="font-display text-2xl font-black tracking-tight">
            Welcome, {user.firstName || user.email.split("@")[0]}!
          </h1>
          <p className="mt-1 font-body text-sm text-muted-foreground">
            You are signed in. Your pre-order lives in My order.
          </p>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-secondary/50 p-4">
          <Mail size={18} className="text-accent" />
          <div>
            <p className="font-body text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Email
            </p>
            <p className="font-body text-sm font-semibold">{user.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/account")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Go to my order <ArrowRight size={16} />
          </button>
          <button
            onClick={() => {
              logout();
              toast.success("Signed out.");
              navigate("/");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 font-display text-sm font-bold text-foreground transition-all hover:bg-secondary"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </motion.div>,
    );
  }

  return shell(
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-[440px]"
    >
      <div className="rounded-3xl border border-border bg-card p-8 shadow-card text-center">
        <button
          onClick={() => navigate("/")}
          className="mb-8 inline-flex items-center gap-2 rounded-xl bg-secondary px-3.5 py-1.5 font-body text-xs font-bold transition-all hover:bg-secondary/80"
        >
          <ArrowLeft size={14} /> Home
        </button>

        <h1 className="font-display text-3xl font-black tracking-tight">Sign in to XUMI</h1>
        <p className="mx-auto mt-2 max-w-xs font-body text-sm text-muted-foreground">
          One tap with Google. No passwords — we only use it to hold your pre-order and show you
          its status.
        </p>

        <button
          onClick={handleGoogleSignIn}
          disabled={submitting}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background py-3 font-display text-sm font-bold text-foreground transition-all hover:bg-secondary active:scale-95 disabled:opacity-50"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </button>

        <p className="mt-6 font-body text-xs text-muted-foreground">
          New here?{" "}
          <Link to="/preorder" className="font-bold text-foreground hover:underline">
            Start a pre-order
          </Link>
        </p>

        <div className="mt-8 border-t border-border pt-4">
          <p className="font-body text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            XUMI by RoboCraft © 2026
          </p>
        </div>
      </div>
    </motion.div>,
  );
};

export default SimpleAuthPage;
