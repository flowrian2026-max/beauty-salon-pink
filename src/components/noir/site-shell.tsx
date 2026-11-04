import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { ArrowUpRight, Menu, X, Instagram, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "./demo-provider";
import { safeSocial } from "@/lib/noir-data";
import { useT } from "@/lib/i18n";
const navigation = [
  ["Services", "خدمات", "/services"],
  ["Experience", "تجربه", "/experience"],
  ["Gallery", "گالری", "/gallery"],
  ["About", "درباره ما", "/about"],
  ["Contact", "تماس", "/contact"],
] as const;
export function LangSwitch() {
  const { lang, setLang } = useT();
  return (
    <div className="lang-switch" role="group" aria-label="Language / زبان">
      <Button
        variant="ghost"
        size="sm"
        type="button"
        aria-pressed={lang === "en"}
        onClick={() => setLang("en")}
      >
        EN
      </Button>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        aria-pressed={lang === "fa"}
        onClick={() => setLang("fa")}
      >
        فا
      </Button>
    </div>
  );
}
export function SiteHeader() {
  const { t } = useT();
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
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
      if (e.key !== "Tab") return;
      const links = menu.current?.querySelectorAll<HTMLElement>("a, button");
      if (!links?.length) return;
      const last = links[links.length - 1];
      if (e.shiftKey && document.activeElement === links[0]) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        links[0]?.focus();
      }
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
      <Link
        to="/"
        className="wordmark"
        aria-label={t("NOIR PINK home", "صفحه‌ی اصلی نوآر پینک")}
        dir="ltr"
      >
        NOIR<span>PINK</span>
        <i>®</i>
      </Link>
      <nav className="desktop-nav" aria-label={t("Main navigation", "منوی اصلی")}>
        {navigation.map(([en, fa, to]) => (
          <Link key={to} to={to} activeProps={{ className: "active" }}>
            {t(en, fa)}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <LangSwitch />
        <Button asChild variant="outline" className="header-book">
          <Link to="/booking">
            {t("BOOK YOUR VISIT", "رزرو وقت")} <ArrowUpRight />
          </Link>
        </Button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="mobile-toggle"
        ref={toggle}
        aria-label={open ? t("Close menu", "بستن منو") : t("Open menu", "باز کردن منو")}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </Button>
      {open && (
        <nav ref={menu} className="mobile-nav" aria-label={t("Mobile navigation", "منوی موبایل")}>
          {navigation.map(([en, fa, to]) => (
            <Link key={to} to={to}>
              {t(en, fa)}
              <ArrowUpRight size={20} />
            </Link>
          ))}
          <LangSwitch />
          <Button asChild>
            <Link to="/booking">
              {t("BOOK YOUR EXPERIENCE", "رزرو تجربه‌ی شما")} <ArrowUpRight />
            </Link>
          </Button>
        </nav>
      )}
    </header>
  );
}
export function SiteFooter() {
  const { data } = useDemo();
  const { t } = useT();
  return (
    <footer className="site-footer">
      <Link to="/" className="wordmark" dir="ltr">
        NOIR<span>PINK</span>
        <i>®</i>
      </Link>
      <p>{t("BEAUTY. ON YOUR OWN TERMS.", "زیبایی، به سبک خودتان.")}</p>
      <nav className="footer-nav" aria-label={t("Footer navigation", "منوی پایین صفحه")}>
        {navigation
          .filter(([name]) => name !== "Experience")
          .map(([en, fa, to]) => (
            <Link key={to} to={to}>
              {t(en, fa)}
            </Link>
          ))}
        <Link to="/journal">{t("Journal", "ژورنال")}</Link>
        <Link to="/gift-cards">{t("Gift cards", "کارت هدیه")}</Link>
        <Link to="/faq">{t("FAQ", "پرسش‌ها")}</Link>
        <Link to="/policies">{t("Policies", "قوانین")}</Link>
        <Link to="/booking">
          {t("Booking", "رزرو")} <ArrowUpRight size={13} />
        </Link>
      </nav>
      <div className="footer-socials">
        {(["instagram", "tiktok"] as const).map((key) => {
          const url = safeSocial(data.contact[key]);
          return url ? (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`NOIR PINK ${key}`}
            >
              {key === "instagram" ? <Instagram size={18} /> : "TIKTOK"}
            </a>
          ) : null;
        })}
      </div>
      <small>
        © {new Date().getFullYear()} NOIR PINK · {t("CONCEPT EXPERIENCE", "تجربه‌ی مفهومی")}
      </small>
    </footer>
  );
}
export function BookLink({ service }: { service?: string }) {
  const { t } = useT();
  return (
    <Button asChild variant="outline">
      <Link to="/booking" search={service ? { service } : {}}>
        {t("BOOK EXPERIENCE", "رزرو این خدمت")} <ArrowUpRight />
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
  const { t } = useT();
  return (
    <section className="next-chapter">
      <span className="eyebrow">{t("YOUR NEXT CHAPTER", "فصل بعدی شما")}</span>
      <h2>
        {t("MAKE IT ", "این بار، ")}
        <em>{t("YOU.", "خودِ شما.")}</em>
      </h2>
      <Button asChild>
        <Link to="/booking">
          {t("BOOK YOUR EXPERIENCE", "رزرو تجربه‌ی شما")} <ArrowRight />
        </Link>
      </Button>
    </section>
  );
}
