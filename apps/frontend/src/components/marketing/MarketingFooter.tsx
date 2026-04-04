import { Link } from "react-router-dom";
import { useMe } from "../../hooks/useAuth";
import { Container } from "../ui/Container";

export function MarketingFooter() {
  const { data } = useMe();
  const user = data?.user;

  return (
    <footer className="border-t border-white/10 bg-footer text-white">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-2xl uppercase">
              ArewaPay<span className="text-accent">.</span>
            </p>
            <p className="font-sans mt-4 max-w-xs text-sm leading-relaxed text-sage/90">
              Invoicing and receivables for African SMEs — one workspace for clients, balances, and cash-flow
              visibility.
            </p>
          </div>
          <div>
            <p className="font-display text-sm uppercase tracking-widest text-sage">Product</p>
            <ul className="font-sans mt-4 space-y-2 text-sm text-white/90">
              <li>
                <Link className="hover:text-accent" to="/features">
                  Features
                </Link>
              </li>
              <li>
                <Link className="hover:text-accent" to="/pricing">
                  FAQ
                </Link>
              </li>
              {user ? (
                <>
                  <li>
                    <Link className="hover:text-accent" to="/app">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link className="hover:text-accent" to="/app/settings/profile">
                      Profile
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link className="hover:text-accent" to="/login">
                      Log in
                    </Link>
                  </li>
                  <li>
                    <Link className="hover:text-accent" to="/register">
                      Sign up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
          <div>
            <p className="font-display text-sm uppercase tracking-widest text-sage">Company</p>
            <ul className="font-sans mt-4 space-y-2 text-sm text-white/90">
              <li>
                <Link className="hover:text-accent" to="/about">
                  About
                </Link>
              </li>
              <li>
                <Link className="hover:text-accent" to="/legal/terms">
                  Terms
                </Link>
              </li>
              <li>
                <Link className="hover:text-accent" to="/legal/privacy">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-display text-sm uppercase tracking-widest text-sage">Region</p>
            <p className="font-sans mt-4 text-sm text-sage/90">
              Serving businesses across Africa. Set your country and currency in-app after signup.
            </p>
            <p className="font-sans mt-4 text-xs text-sage/60">
              Support: <span className="text-sage/80">hello@arewapay.app</span> (placeholder)
            </p>
          </div>
        </div>
        <div className="font-sans mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-sage/70 sm:flex-row">
          <p>© {new Date().getFullYear()} ArewaPay. All rights reserved.</p>
          <p className="text-xs">Made for African SMEs · Multi-currency ready</p>
        </div>
      </Container>
    </footer>
  );
}
