import { Link } from "react-router-dom";

const FooterSection = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-display text-lg font-bold mb-4">Contact</h3>
          <p className="font-body text-sm text-primary-foreground/70">
            Email:{" "}
            <a href="mailto:support@robocraft.com" className="underline">
              support@robocraft.com
            </a>
          </p>
          <p className="font-body text-sm text-primary-foreground/70 mt-1">
            We aim to reply within 24 hours on weekdays.
          </p>
        </div>

        <div>
          <h3 className="font-display text-lg font-bold mb-4">XUMI</h3>
          <ul className="space-y-2 font-body text-sm text-primary-foreground/70">
            <li>
              <Link to="/preorder" className="hover:text-primary-foreground transition-colors">
                Pre-order
              </Link>
            </li>
            <li>
              <Link to="/account" className="hover:text-primary-foreground transition-colors">
                My order
              </Link>
            </li>
            <li>
              <Link to="/#how-it-works" className="hover:text-primary-foreground transition-colors">
                How it works
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg font-bold mb-4">Company</h3>
          <p className="font-body text-sm text-primary-foreground/70">
            XUMI is built by RoboCraft.
          </p>
          <Link
            to="/login"
            className="mt-2 inline-block font-body text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-10 pt-6 border-t border-primary-foreground/20 text-center">
        <h2 className="font-display text-3xl font-black">ROBOCRAFT</h2>
        <p className="font-body text-xs text-primary-foreground/50 mt-2">
          © 2026 RoboCraft. All rights reserved. XUMI — your personal tiny desk partner.
        </p>
      </div>
    </footer>
  );
};

export default FooterSection;
