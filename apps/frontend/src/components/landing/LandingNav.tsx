import { Link } from "react-router-dom";
import { useMe } from "../../hooks/useAuth";
import { Button } from "../ui/Button";
import { Container } from "../ui/Container";
import { MarketingUserMenu } from "../marketing/MarketingUserMenu";

const links = [
  { to: "/features", label: "Features" },
  { to: "/about", label: "FAQ" },
  { to: "/about", label: "About" },
];

export function LandingNav() {
  const { data, isLoading } = useMe();
  const user = data?.user;

  return (
    <header className="fixed top-0 z-50 h-20 w-full border-b border-charcoal/5 bg-white/90 backdrop-blur-md">
      <Container className="flex h-full items-center justify-between">
        <Link to="/" className="font-display text-3xl uppercase leading-none tracking-normal text-charcoal">
          ArewaPay<span className="text-accent">.</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="font-sans text-sm font-medium text-charcoal/80 hover:text-charcoal"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          {!isLoading && user ? (
            <MarketingUserMenu user={user} />
          ) : !isLoading ? (
            <>
              <Link
                to="/login"
                className="font-sans text-sm font-medium text-charcoal hover:text-charcoal/80"
              >
                Login
              </Link>
              <Button variant="dark" to="/register">
                Get started
              </Button>
            </>
          ) : (
            <div className="h-10 w-10 shrink-0 rounded-full bg-charcoal/10" aria-hidden />
          )}
        </div>
      </Container>
    </header>
  );
}
