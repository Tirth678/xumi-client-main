import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight, Loader2, LogOut, Mail, User } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { handleOAuthCallback, loginWithEmail, loginWithGoogle, registerWithEmail } from "@/lib/neonAuth";
import { getSafeErrorMessage } from "@/lib/apiErrors";
import GoogleIcon from "@/components/GoogleIcon";

const SimpleAuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">(
    location.pathname === "/signup" || location.pathname === "/register" ? "signup" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

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
          const target = sessionStorage.getItem("auth_redirect") || "/preorder";
          sessionStorage.removeItem("auth_redirect");
          navigate(target);
          return;
        }
        toast.error(res.error || "Google authentication failed.");
        navigate("/login");
      })
      .catch((err) => {
        toast.error(getSafeErrorMessage(err, "Google authentication failed."));
        navigate("/login");
      })
      .finally(() => setSubmitting(false));
  }, [location.pathname, navigate]);

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      const redirectTarget = sessionStorage.getItem("auth_redirect") || "/preorder";
      const result = await loginWithGoogle(redirectTarget);
      if (!result.success) {
        toast.error(getSafeErrorMessage(new Error(result.error ?? ""), "Google sign-in failed."));
      }
    } catch (error) {
      toast.error(getSafeErrorMessage(error, "Google sign-in failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setSubmitting(true);
    try {
      const parts = name.trim().split(/\s+/);
      const result = mode === "signup"
        ? await registerWithEmail(email, password, parts[0], parts.slice(1).join(" "))
        : await loginWithEmail(email, password);
      if (!result.success) { toast.error(result.error || `${mode === "signup" ? "Sign-up" : "Sign-in"} failed.`); return; }
      toast.success(mode === "signup" ? "Account created." : "Signed in.");
      const target = sessionStorage.getItem("auth_redirect") || "/preorder";
      sessionStorage.removeItem("auth_redirect");
      navigate(target);
    } catch (error) {
      toast.error(getSafeErrorMessage(error, "Authentication failed."));
    } finally { setSubmitting(false); }
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
          Continue with Google or use your email and password. Your account keeps your booking secure.
        </p>

        <button
          onClick={handleGoogleSignIn}
          disabled={submitting}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background py-3 font-display text-sm font-bold text-foreground transition-all hover:bg-secondary active:scale-95 disabled:opacity-50"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3 text-left">
          {mode === "signup" && (
            <label className="block font-body text-sm font-semibold">
              Full name
              <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} autoComplete="name" className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-primary" />
            </label>
          )}
          <label className="block font-body text-sm font-semibold">
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-primary" />
          </label>
          <label className="block font-body text-sm font-semibold">
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-primary" />
          </label>
          <button type="submit" disabled={submitting} className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground disabled:opacity-50">
            {submitting ? <Loader2 size={18} className="animate-spin" /> : mode === "signup" ? "Create account" : "Sign in with email"}
          </button>
        </form>

        <p className="mt-6 font-body text-xs text-muted-foreground">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="font-bold text-foreground hover:underline">
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
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
