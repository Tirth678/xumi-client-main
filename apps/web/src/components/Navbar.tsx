import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "XUMI", anchor: "#product", route: "/" },
  { label: "HOW IT WORKS", anchor: "#how-it-works", route: "/" },
  { label: "MY ORDER", anchor: null, route: "/account" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const isHome = location.pathname === "/";
  const shouldShowSolid = scrolled || !isHome;

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 60);
        frame = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", mobileOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleClick = (link: (typeof navLinks)[number]) => {
    setMobileOpen(false);

    if (!link.anchor) {
      navigate(link.route);
      return;
    }

    if (isHome) {
      document.querySelector(link.anchor)?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    navigate(link.route);
    window.setTimeout(() => {
      document.querySelector(link.anchor)?.scrollIntoView({ behavior: "smooth" });
    }, 120);
  };

  const handleLogout = () => {
    logout();
    toast.success("Signed out.");
    setMobileOpen(false);
    navigate("/");
  };

  const renderAuthAction = () =>
    isAuthenticated ? (
      <button
        onClick={handleLogout}
        className={`flex items-center gap-2 font-body text-sm font-semibold tracking-wider transition-colors ${
          shouldShowSolid
            ? "text-foreground hover:text-accent"
            : "text-primary-foreground/90 hover:text-primary-foreground"
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background`}
      >
        <LogOut size={18} /> LOGOUT
      </button>
    ) : (
      <button
        onClick={() => navigate("/login")}
        className={`flex items-center gap-2 font-body text-sm font-semibold tracking-wider transition-colors ${
          shouldShowSolid
            ? "text-foreground hover:text-accent"
            : "text-primary-foreground/90 hover:text-primary-foreground"
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background`}
      >
        <User size={18} /> SIGN IN
      </button>
    );

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          shouldShowSolid
            ? "bg-background/90 backdrop-blur-lg shadow-card border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className={`font-display text-xl md:text-2xl font-black tracking-tight transition-colors flex items-center gap-2 ${
                shouldShowSolid ? "text-foreground" : "text-primary-foreground"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background`}
              aria-label="Go to RoboCraft home"
            >
              <img
                src="/logo.png"
                alt="RoboCraft logo"
                className="h-12 w-auto md:h-full max-h-[6rem] object-contain"
              />
            </button>
            <span
              className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${
                shouldShowSolid
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground"
              }`}
            >
              Pre-orders open
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleClick(link)}
                className={`font-body text-sm font-semibold tracking-wider transition-colors relative group ${
                  shouldShowSolid
                    ? "text-foreground hover:text-accent"
                    : "text-primary-foreground/90 hover:text-primary-foreground"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-300 ${
                    shouldShowSolid ? "bg-accent" : "bg-primary-foreground"
                  }`}
                />
              </button>
            ))}

            {renderAuthAction()}
          </div>

          {/* Mobile right side */}
          <div className="flex md:hidden items-center gap-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`rounded-full p-2 transition-colors ${
                shouldShowSolid ? "text-foreground" : "text-primary-foreground"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-24 flex flex-col items-center gap-8 overflow-y-auto"
          >
            {navLinks.map((link, i) => (
              <motion.button
                key={link.label}
                onClick={() => handleClick(link)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="font-display text-3xl font-bold text-foreground hover:text-accent transition-colors"
              >
                {link.label}
              </motion.button>
            ))}
            {isAuthenticated ? (
              <motion.button
                onClick={handleLogout}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.1 }}
                className="flex items-center gap-3 font-display text-3xl font-bold text-foreground hover:text-accent transition-colors"
              >
                <LogOut size={26} /> LOGOUT
              </motion.button>
            ) : (
              <motion.button
                onClick={() => {
                  setMobileOpen(false);
                  navigate("/login");
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.1 }}
                className="flex items-center gap-3 font-display text-3xl font-bold text-foreground hover:text-accent transition-colors"
              >
                <User size={26} /> SIGN IN
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
