import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { ArrowUpRight, Menu, X, Instagram, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "./demo-provider";
import { safeSocial } from "@/lib/noir-data";
const navigation = [
  ["Services", "/services"],
  ["Experience", "/experience"],
  ["Gallery", "/gallery"],
  ["About", "/about"],
  ["Contact", "/contact"],
] as const;
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menu = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    setOpen(false);
  }, [path]);
  useEffect(() => {
    if (!open) return;
    const first = menu.current?.querySelector<HTMLAnchorElement>("a");
    first?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); toggle.current?.focus(); }
      if (e.key !== "Tab") return;
      const links = menu.current?.querySelectorAll<HTMLAnchorElement>("a");
      if (!links?.length) return;
      const last = links[links.length - 1];
      if (e.shiftKey && document.activeElement === links[0]) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); links[0]?.focus(); }
    }
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open]);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
      <Link to="/" className="wordmark" aria-label="NOIR PINK home">
        NOIR<span>PINK</span>
        <i>®</i>
      </Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {navigation.map(([name, to]) => (
          <Link key={to} to={to} activeProps={{ className: "active" }}>
            {name}
          </Link>
        ))}
      </nav>
      <Button asChild variant="outline" className="header-book">
        <Link to="/booking">
          BOOK YOUR VISIT <ArrowUpRight />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="mobile-toggle"
        ref={toggle}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </Button>
      {open && (
        <nav ref={menu} className="mobile-nav" aria-label="Mobile navigation">
          {navigation.map(([name, to]) => (
            <Link key={to} to={to}>
              {name}
              <ArrowUpRight size={20} />
            </Link>
          ))}
          <Button asChild>
            <Link to="/booking">
              BOOK YOUR EXPERIENCE <ArrowUpRight />
            </Link>
          </Button>
        </nav>
      )}
    </header>
  );
}
export function SiteFooter() {
  const { data } = useDemo();
  return (
    <footer className="site-footer">
      <Link to="/" className="wordmark">
        NOIR<span>PINK</span>
        <i>®</i>
      </Link>
      <p>BEAUTY. ON YOUR OWN TERMS.</p>
      <nav className="footer-nav" aria-label="Footer navigation">
        {navigation.filter(([name]) => name !== "Experience").map(([name,to]) => <Link key={to} to={to}>{name}</Link>)}
        <Link to="/booking">Booking <ArrowUpRight size={13} /></Link>
      </nav>
      <div className="footer-socials">
        {(["instagram", "tiktok"] as const).map(key => {
          const url = safeSocial(data.contact[key]);
          return url ? <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={`NOIR PINK ${key}`}>
            {key === "instagram" ? <Instagram size={18} /> : "TIKTOK"}
          </a> : null;
        })}
      </div>
      <small>© {new Date().getFullYear()} NOIR PINK · CONCEPT EXPERIENCE</small>
    </footer>
  );
}
export function BookLink({ service }: { service?: string }) {
  return (
    <Button asChild variant="outline">
      <Link to="/booking" search={service ? { service } : {}}>
        BOOK EXPERIENCE <ArrowUpRight />
      </Link>
    </Button>
  );
}
export function Intro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div className="page-intro">
      <div className="eyebrow">
        <span /> {eyebrow}
      </div>
      <h1>{title}</h1>
      {copy && <p>{copy}</p>}
    </div>
  );
}
export function RevealObserver() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.08 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [path]);
  return null;
}
export function NextChapter() {
  return (
    <section className="next-chapter">
      <span className="eyebrow">YOUR NEXT CHAPTER</span>
      <h2>
        MAKE IT <em>YOU.</em>
      </h2>
      <Button asChild>
        <Link to="/booking">
          BOOK YOUR EXPERIENCE <ArrowRight />
        </Link>
      </Button>
    </section>
  );
}
