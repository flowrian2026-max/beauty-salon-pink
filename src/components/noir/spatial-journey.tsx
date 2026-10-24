import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, Expand, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import campaign from "@/assets/noir-campaign.jpg";
import { spatialRendering, type SpatialQuality } from "@/lib/noir-spatial";
const SpatialScene = lazy(() => import("./spatial-scene"));

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch() { this.props.onFailure(); }
  override render() { return this.state.failed ? null : this.props.children; }
}

export function SpatialJourney() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const requestRender = useRef<(() => void) | null>(null);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [quality, setQuality] = useState<SpatialQuality>("compact");
  const [degraded, setDegraded] = useState(false);
  const [finish, setFinish] = useState(0);
  const [unfolded, setUnfolded] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => setFailed(true), []);
  const onUnfold = useCallback(() => setUnfolded(value => !value), []);
  const onSlow = useCallback(() => setDegraded(true), []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const preference = () => { setReduced(media.matches); setReady(false); update(); };
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!section.current || !stage.current) return;
        setQuality(spatialRendering({ width: window.innerWidth, reduced: media.matches, cores: navigator.hardwareConcurrency, memory: device.deviceMemory, saveData: device.connection?.saveData }).quality);
        const bounds = section.current.getBoundingClientRect();
        progress.current = Math.max(0, Math.min(1, -bounds.top / Math.max(1, bounds.height - window.innerHeight)));
        stage.current.style.setProperty("--journey-progress", String(progress.current));
        const chapter = progress.current < 0.3 ? "1" : progress.current < 0.73 ? "2" : "3";
        stage.current.dataset['chapter'] = media.matches ? "1" : chapter;
        requestRender.current?.();
      });
    };
    preference(); setMounted(true); media.addEventListener("change", preference);
    let intersecting = true;
    const visibility = () => setActive(intersecting && !document.hidden);
    const observer = new IntersectionObserver(entries => { intersecting = Boolean(entries[0]?.isIntersecting); visibility(); }, { rootMargin: "100px" });
    if (section.current) observer.observe(section.current);
    update(); window.addEventListener("scroll", update, { passive: true }); window.addEventListener("resize", update); document.addEventListener("visibilitychange", visibility);
    return () => { media.removeEventListener("change", preference); observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  const still = reduced || failed;
  const effectiveQuality = degraded ? "compact" : quality;
  return <section ref={section} className={`spatial-journey ${still ? "journey-static" : ""}`} data-rendering={still ? "static" : effectiveQuality} aria-label="NOIR PINK signature spatial beauty journey">
    <div ref={stage} className="journey-stage" data-chapter="1" data-finish={finish}>
      <div className="scene-layer" aria-hidden="true">
        {(!ready || still) && <img className="scene-fallback" src={campaign} width={1920} height={1280} alt="" fetchPriority="high" />}
        {mounted && !still && <SceneBoundary onFailure={onFailure}><Suspense fallback={null}><SpatialScene progress={progress} finish={finish} unfolded={unfolded} quality={effectiveQuality} requestRender={requestRender} active={active} onReady={onReady} onUnfold={onUnfold} onFailure={onFailure} onSlow={onSlow} /></Suspense></SceneBoundary>}
      </div>
      <div className="journey-coordinates" aria-hidden="true"><span>NOIR PINK / THE SIGNATURE EXPERIENCE</span><span>BEAUTY / FORM / SELF-EXPRESSION</span></div>
      <div className="journey-title"><span className="eyebrow">NOIR PINK · BEAUTY STUDIO</span><h1>NOIR PINK<span>BEAUTY,<br />REDEFINED.</span></h1></div>
      <div className="journey-intro"><p>Beauty as an art.<br />Self-expression as a signature.</p><Button variant="default" className="journey-primary-button" asChild><Link to="/services">EXPLORE THE WORK <ArrowUpRight /></Link></Button></div>
      <div className="journey-chapter journey-chapter-two"><span className="eyebrow">01 — BEAUTY ON YOUR TERMS</span><h2>Not a standard.<br /><em>Your signature.</em></h2><p>Beauty is not a formula.<br />It is your own expression.</p></div>
      <div className="journey-chapter journey-chapter-three"><span className="eyebrow">02 — EVERY DETAIL, YOURS</span><h2>Every detail.<br /><em>A new dimension.</em></h2><Button variant="outline" className="journey-secondary-button" asChild><Link to="/services">ENTER THE COLLECTION <ArrowUpRight /></Link></Button></div>
      {!still && <div className="signature-controls"><div className="finish-options" role="group" aria-label="Sculpture finish">{["Rose", "Champagne", "Pearl"].map((name, index) => <Button key={name} variant="ghost" className={`finish-swatch finish-${index}`} aria-label={`${name} sculpture finish`} title={`${name} finish`} aria-pressed={finish === index} onClick={() => setFinish(index)}><span /></Button>)}</div><span className="finish-name" aria-live="polite">{["ROSE", "CHAMPAGNE", "PEARL"][finish]}</span><span className="control-rule" /><Button variant="ghost" aria-label={unfolded ? "Fold signature sculpture" : "Unfold signature sculpture"} title={unfolded ? "Fold signature" : "Unfold signature"} className="journey-control-button" aria-pressed={unfolded} onClick={onUnfold}>{unfolded ? <Minimize /> : <Expand />}</Button></div>}
      <div className="journey-bottom"><a href="#selected-work" className="scroll-indicator" aria-label="Scroll to selected work"><ArrowDown size={18} /><span>BEYOND THE SURFACE</span></a><div className="chapter-track" aria-hidden="true"><span className="track-one">01</span><i /><span className="track-two">02</span><i /><span className="track-three">03</span></div><span className="journey-edition">NOIR PINK / STUDIO EXPERIENCE</span></div>
    </div>
  </section>;
}