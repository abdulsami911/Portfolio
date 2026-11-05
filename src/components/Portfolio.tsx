import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

/* ============================================================
   1. TYPES
   ============================================================ */
interface LinkItem { label: string; href: string }
interface Stat { value: string; label: string }
interface Project {
  title: string;
  tags: string[];
  summary: string;
  details: string;
  stack: string[];
  live?: string;
  code?: string;
}
interface SkillGroup { group: string; items: string[] }
interface TimelineItem { when: string; title: string; place: string; note: string }
interface PortfolioData {
  name: string;
  roles: string[];
  tagline: string;
  location: string;
  email: string;
  resumeUrl: string;
  links: LinkItem[];
  stats: Stat[];
  projects: Project[];
  skills: SkillGroup[];
  timeline: TimelineItem[];
}
type Theme = "dark" | "light";
type SectionId = "work" | "skills" | "path" | "contact";

/* ============================================================
   2. YOUR CONTENT — edit only this block, the UI updates itself
   ============================================================ */
const DATA: PortfolioData = {
  name: "Abdul Sami",
  roles: ["Cybersecurity Analyst", "Offensive Security Researcher", "Full-stack Developer", "AI/ML Builder"],
  tagline:
    "I break web apps to understand them, then build the full-stack and AI tools that make them harder to break.",
  location: "Pakistan",
  email: "abdulsamimahar91@gmail.com",
  resumeUrl: "/resume.pdf", // put your CV in /public
  links: [
    { label: "GitHub", href: "https://github.com/abdulsami911" },
    { label: "LinkedIn", href: "https://linkedin.com/in/abdulsami911" },
  ],
  stats: [
    { value: "MIVTECH", label: "Current analyst role" },
    { value: "Sukkur IBA", label: "BS Computer Science" },
    { value: "Full-stack + AI", label: "What I build" },
  ],
  projects: [
    {
      title: "VulnSight AI",
      tags: ["Security", "Full-stack", "AI"],
      summary: "Cybersecurity platform built for MIVTECH.",
      details:
        "A full-stack platform that helps the team track and make sense of vulnerabilities. Replace this text with your own architecture notes and results.",
      stack: ["React", "Node.js", "Python", "ML"],
      live: "",
      code: "",
    },
    {
      title: "NIDS",
      tags: ["Security", "AI"],
      summary: "Network intrusion detection with machine learning.",
      details: "Trained on UNSW-NB15 and NSL-KDD, with a live Wireshark demo showing detection on real traffic.",
      stack: ["Python", "scikit-learn", "Wireshark"],
      live: "",
      code: "",
    },
    {
      title: "ARIA",
      tags: ["AI"],
      summary: "Desktop AI assistant for Linux with wake-word detection.",
      details: "A Python assistant that listens for a wake word and handles voice commands on the desktop.",
      stack: ["Python", "Linux", "Speech"],
      live: "",
      code: "",
    },
    {
      title: "AARIA",
      tags: ["AI", "Mobile"],
      summary: "Android AI assistant app written in Kotlin.",
      details: "The mobile counterpart to ARIA, built natively for Android.",
      stack: ["Kotlin", "Android"],
      live: "",
      code: "",
    },
  ],
  skills: [
    { group: "Offensive security", items: ["Web app pentesting", "Burp Suite", "Recon", "Bug bounty", "OWASP Top 10"] },
    { group: "Build", items: ["React", "TypeScript", "Node.js", "Python", "Kotlin", "REST APIs", "SQL"] },
    { group: "AI and ML", items: ["scikit-learn", "Intrusion detection", "LLM apps", "Data prep"] },
  ],
  timeline: [
    { when: "Now", title: "Cybersecurity Analyst", place: "MIVTECH Cybersecurity Solutions & Engineering", note: "Security analysis and tooling." },
    { when: "Now", title: "BS Computer Science", place: "Sukkur IBA University", note: "Focused on cybersecurity." },
  ],
};

const SECTION_LABELS: Record<SectionId, string> = {
  work: "Projects",
  skills: "Skills",
  path: "Path",
  contact: "Contact",
};
const SECTIONS = Object.keys(SECTION_LABELS) as SectionId[];

/* ============================================================
   3. HOOKS
   ============================================================ */
const GLYPHS = "!<>-_\\/[]{}=+*^?#0123456789abcdef";

/** Scrambles text, then resolves it left to right. The hero moment. */
function useDecrypt(text: string, delay = 250): string {
  const [out, setOut] = useState<string>(text);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let raf = 0;
    let t0: number | undefined;
    const total = text.length * 4;
    const tick = (t: number) => {
      t0 ??= t;
      if (t - t0 < delay) {
        raf = requestAnimationFrame(tick);
        return;
      }
      frame++;
      const done = Math.floor(frame / 4);
      setOut(
        text
          .split("")
          .map((c, i) => (c === " " || i < done ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join("")
      );
      if (frame <= total) raf = requestAnimationFrame(tick);
      else setOut(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, delay]);
  return out;
}

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const s = localStorage.getItem("theme");
      if (s === "dark" || s === "light") return s;
    } catch {
      /* storage blocked */
    }
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });
  useEffect(() => {
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* storage blocked */
    }
  }, [theme]);
  return [theme, () => setTheme((t) => (t === "dark" ? "light" : "dark"))];
}

function useActiveSection(ids: readonly SectionId[]): SectionId {
  const [active, setActive] = useState<SectionId>(ids[0]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id as SectionId);
        }),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [ids]);
  return active;
}

function useScrollProgress(): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setP(h > 0 ? window.scrollY / h : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return p;
}

function useRotate(length: number, ms = 2400): number {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((n) => (n + 1) % length), ms);
    return () => window.clearInterval(id);
  }, [length, ms]);
  return i;
}

/** Fades a block in once, when it first scrolls into view. */
function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${seen ? "seen" : ""} ${className}`}>
      {children}
    </div>
  );
}

/* ============================================================
   4. COMPONENT
   ============================================================ */
export default function Portfolio() {
  const [theme, toggleTheme] = useTheme();
  const [filter, setFilter] = useState<string>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const heroName = useDecrypt(DATA.name);
  const active = useActiveSection(SECTIONS);
  const progress = useScrollProgress();
  const roleIdx = useRotate(DATA.roles.length);
  const glow = useRef<HTMLDivElement>(null);

  const tags = useMemo<string[]>(() => ["All", ...new Set(DATA.projects.flatMap((p) => p.tags))], []);
  const shown = DATA.projects.filter((p) => filter === "All" || p.tags.includes(filter));
  const marquee = useMemo<string[]>(() => DATA.skills.flatMap((g) => g.items), []);

  const onHeroMove = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    glow.current?.style.setProperty("--x", `${e.clientX - r.left}px`);
    glow.current?.style.setProperty("--y", `${e.clientY - r.top}px`);
  };
  const onCardMove = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div className="pf" data-theme={theme}>
      <style>{CSS}</style>
      <div className="progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />

      <header className="nav">
        <a href="#top" className="brand">{DATA.name}</a>
        <nav aria-label="Primary">
          {SECTIONS.map((s) => (
            <a key={s} href={`#${s}`} className={active === s ? "on" : ""}>{SECTION_LABELS[s]}</a>
          ))}
          <button className="icon" onClick={toggleTheme} aria-label="Switch theme">
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </nav>
      </header>

      <main id="top">
        <section className="hero" onMouseMove={onHeroMove}>
          <div className="aurora" aria-hidden="true"><i /><i /><i /></div>
          <div className="gridbg" aria-hidden="true" />
          <div className="glow" ref={glow} aria-hidden="true" />
          <div className="hero-in">
            <p className="avail"><span className="dot" />Open to work · {DATA.location}</p>
            <h1 aria-label={DATA.name}>{heroName}</h1>
            <p className="role" aria-live="polite">
              <span key={roleIdx}>{DATA.roles[roleIdx]}</span>
            </p>
            <p className="tag">{DATA.tagline}</p>
            <div className="cta">
              <a className="btn primary" href="#work">See my projects</a>
              <a className="btn" href={DATA.resumeUrl} download>Download CV</a>
            </div>
            <dl className="stats">
              {DATA.stats.map((s) => (
                <div key={s.label}><dt>{s.value}</dt><dd>{s.label}</dd></div>
              ))}
            </dl>
          </div>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className="track">
            {[...marquee, ...marquee].map((m, i) => <span key={i}>{m}</span>)}
          </div>
        </div>

        <section id="work" className="block">
          <Reveal>
            <h2>Projects</h2>
            <div className="filters" role="tablist" aria-label="Filter projects">
              {tags.map((t) => (
                <button key={t} role="tab" aria-selected={filter === t}
                  className={filter === t ? "chip on" : "chip"} onClick={() => setFilter(t)}>
                  {t}
                </button>
              ))}
            </div>
          </Reveal>
          <div className="grid">
            {shown.map((p) => {
              const open = openId === p.title;
              return (
                <article key={p.title} className={open ? "card open" : "card"} onMouseMove={onCardMove}>
                  <button className="head" aria-expanded={open} onClick={() => setOpenId(open ? null : p.title)}>
                    <h3>{p.title}</h3>
                    <span className="plus" aria-hidden="true">+</span>
                  </button>
                  <p className="sum">{p.summary}</p>
                  <div className="more"><div>
                    <p>{p.details}</p>
                    <div className="links">
                      {p.live && <a href={p.live} target="_blank" rel="noreferrer">Live demo</a>}
                      {p.code && <a href={p.code} target="_blank" rel="noreferrer">Source code</a>}
                    </div>
                  </div></div>
                  <ul className="stack">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul>
                </article>
              );
            })}
          </div>
        </section>

        <section id="skills" className="block">
          <Reveal>
            <h2>Skills</h2>
            <div className="skills">
              {DATA.skills.map((g) => (
                <div key={g.group} className="sk">
                  <h3>{g.group}</h3>
                  <ul>{g.items.map((i) => <li key={i}>{i}</li>)}</ul>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="path" className="block">
          <Reveal>
            <h2>Path</h2>
            <ol className="line">
              {DATA.timeline.map((t) => (
                <li key={t.title}>
                  <span className="when">{t.when}</span>
                  <h3>{t.title}</h3>
                  <p className="place">{t.place}</p>
                  <p>{t.note}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        <section id="contact" className="block contact">
          <Reveal>
            <h2>Let’s talk</h2>
            <p>Open to security work, bug bounty collaboration and AI projects.</p>
            <a className="btn primary big" href={`mailto:${DATA.email}`}>{DATA.email}</a>
            <div className="soc">
              {DATA.links.map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noreferrer">{l.label}</a>
              ))}
            </div>
          </Reveal>
        </section>
      </main>

      <footer>© {new Date().getFullYear()} {DATA.name}</footer>
    </div>
  );
}

/* ============================================================
   5. STYLES (scoped under .pf, change colors in the two themes)
   ============================================================ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Sans:wght@400;500&display=swap');
.pf{--bg:#0e1322;--surface:#161d31;--line:#263050;--text:#e9edf5;--muted:#93a0b8;--accent:#ffb347;--accent2:#ff6b8b;--on-accent:#1a1204;
  background:var(--bg);color:var(--text);font-family:'IBM Plex Sans',system-ui,sans-serif;line-height:1.65;min-height:100vh;transition:background .3s,color .3s}
.pf[data-theme=light]{--bg:#f5f6fa;--surface:#fff;--line:#dde1ec;--text:#121826;--muted:#5a6479;--accent:#c2410c;--accent2:#be185d;--on-accent:#fff}
.pf *{box-sizing:border-box}
.pf h1,.pf h2,.pf h3{font-family:'Bricolage Grotesque',sans-serif;line-height:1.1;margin:0}
.pf a{color:inherit;text-decoration:none}
.pf :focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:6px}
.progress{position:fixed;top:0;left:0;right:0;height:3px;z-index:30;transform-origin:0 50%;background:linear-gradient(90deg,var(--accent),var(--accent2))}
.nav{position:sticky;top:0;z-index:20;display:flex;justify-content:space-between;align-items:center;padding:14px clamp(20px,5vw,64px);
  background:color-mix(in srgb,var(--bg) 78%,transparent);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
.brand{font-family:'Bricolage Grotesque';font-weight:700;font-size:1.1rem}
.nav nav{display:flex;gap:6px;align-items:center}
.nav nav a{padding:6px 12px;border-radius:99px;color:var(--muted);font-size:.95rem;transition:.2s}
.nav nav a:hover,.nav nav a.on{color:var(--text);background:var(--surface)}
.icon{border:1px solid var(--line);background:var(--surface);color:var(--text);width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1rem;transition:transform .3s}
.icon:hover{transform:rotate(25deg)}
.hero{position:relative;overflow:hidden;isolation:isolate}
.hero-in{position:relative;max-width:1180px;margin:auto;padding:clamp(70px,13vw,160px) clamp(20px,5vw,64px) 80px}
.aurora i{position:absolute;border-radius:50%;filter:blur(90px);opacity:.35;z-index:-1;animation:drift 18s ease-in-out infinite alternate}
.aurora i:nth-child(1){width:46vw;height:46vw;left:-10vw;top:-12vw;background:var(--accent)}
.aurora i:nth-child(2){width:38vw;height:38vw;right:-8vw;top:8vw;background:var(--accent2);animation-duration:22s}
.aurora i:nth-child(3){width:30vw;height:30vw;left:35vw;bottom:-16vw;background:#4f7cff;animation-duration:26s}
.pf[data-theme=light] .aurora i{opacity:.22}
.gridbg{position:absolute;inset:0;z-index:-1;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);
  background-size:56px 56px;opacity:.45;mask-image:radial-gradient(ellipse at 50% 30%,#000 25%,transparent 75%);-webkit-mask-image:radial-gradient(ellipse at 50% 30%,#000 25%,transparent 75%)}
.glow{position:absolute;inset:0;z-index:-1;pointer-events:none;--x:70%;--y:30%;
  background:radial-gradient(380px circle at var(--x) var(--y),color-mix(in srgb,var(--accent) 18%,transparent),transparent 70%)}
.avail{display:inline-flex;align-items:center;gap:10px;margin:0 0 20px;padding:6px 14px;border:1px solid var(--line);border-radius:99px;background:color-mix(in srgb,var(--surface) 70%,transparent);font-size:.9rem;color:var(--muted)}
.dot{width:8px;height:8px;border-radius:50%;background:#3ddc97;box-shadow:0 0 0 0 #3ddc9788;animation:pulse 2s infinite}
.hero h1{font-size:clamp(3rem,10.5vw,8rem);font-weight:800;letter-spacing:-.035em;min-height:1.1em;
  background:linear-gradient(100deg,var(--text) 30%,var(--accent));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.role{margin:14px 0 0;height:1.9rem;overflow:hidden;font-family:'Bricolage Grotesque';font-size:clamp(1.2rem,2.6vw,1.7rem);font-weight:700;color:var(--accent)}
.role span{display:block;animation:roll .5s ease both}
.tag{max-width:36ch;font-size:clamp(1.05rem,2vw,1.35rem);color:var(--muted);margin:22px 0 34px}
.cta{display:flex;gap:12px;flex-wrap:wrap}
.btn{display:inline-block;padding:12px 22px;border-radius:12px;border:1px solid var(--line);background:var(--surface);font-weight:500;cursor:pointer;transition:transform .2s,border-color .2s,box-shadow .2s}
.btn:hover{transform:translateY(-2px);border-color:var(--accent)}
.btn.primary{background:var(--accent);color:var(--on-accent);border-color:var(--accent)}
.btn.primary:hover{box-shadow:0 10px 30px -8px var(--accent)}
.btn.big{font-size:1.15rem;padding:16px 28px;margin-top:10px}
.stats{display:flex;gap:clamp(24px,5vw,64px);flex-wrap:wrap;margin:64px 0 0;padding-top:28px;border-top:1px solid var(--line)}
.stats dt{font-family:'Bricolage Grotesque';font-size:1.35rem;font-weight:700}
.stats dd{margin:2px 0 0;color:var(--muted);font-size:.9rem}
.marquee{overflow:hidden;border-block:1px solid var(--line);background:var(--surface);padding:14px 0}
.track{display:flex;gap:44px;width:max-content;animation:scroll 40s linear infinite}
.marquee:hover .track{animation-play-state:paused}
.track span{white-space:nowrap;color:var(--muted);font-family:'Bricolage Grotesque';font-weight:700;font-size:1.1rem}
.track span::after{content:"✦";margin-left:44px;color:var(--accent)}
.block{max-width:1180px;margin:auto;padding:90px clamp(20px,5vw,64px) 20px;scroll-margin-top:60px}
.block h2{font-size:clamp(2rem,4.5vw,3.2rem);letter-spacing:-.02em;margin-bottom:26px}
.reveal{opacity:0;transform:translateY(22px);transition:opacity .7s ease,transform .7s ease}
.reveal.seen{opacity:1;transform:none}
.filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:26px}
.chip{border:1px solid var(--line);background:transparent;color:var(--muted);padding:7px 16px;border-radius:99px;cursor:pointer;font:inherit;font-size:.9rem;transition:.2s}
.chip:hover{color:var(--text)}
.chip.on{background:var(--text);color:var(--bg);border-color:var(--text)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr));gap:20px;align-items:start}
.card{--mx:50%;--my:0%;border:1px solid var(--line);border-radius:18px;padding:24px;transition:border-color .25s,transform .25s,box-shadow .25s;animation:in .4s ease both;
  background:radial-gradient(300px circle at var(--mx) var(--my),color-mix(in srgb,var(--accent) 14%,transparent),transparent 70%),var(--surface)}
.card:hover,.card.open{border-color:var(--accent);transform:translateY(-4px);box-shadow:0 18px 40px -22px var(--accent)}
.head{all:unset;box-sizing:border-box;display:flex;width:100%;justify-content:space-between;align-items:center;cursor:pointer}
.head:focus-visible{outline:2px solid var(--accent);outline-offset:6px;border-radius:6px}
.card h3{font-size:1.5rem}
.plus{font-size:1.6rem;color:var(--accent);transition:transform .3s}
.card.open .plus{transform:rotate(45deg)}
.sum{color:var(--muted);margin:10px 0 0}
.more{display:grid;grid-template-rows:0fr;transition:grid-template-rows .35s ease}
.card.open .more{grid-template-rows:1fr}
.more>div{overflow:hidden}
.more p{margin:14px 0 0}
.links{display:flex;gap:16px;margin-top:12px}
.links a{color:var(--accent);border-bottom:1px solid currentColor}
.stack{display:flex;flex-wrap:wrap;gap:6px;list-style:none;padding:0;margin:18px 0 0}
.stack li,.sk li{font-size:.85rem;border:1px solid var(--line);border-radius:8px;padding:3px 10px;color:var(--muted)}
.skills{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:36px}
.sk h3{font-size:1.2rem;margin-bottom:14px}
.sk ul{display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0;margin:0}
.sk li{font-size:.95rem;padding:6px 14px;color:var(--text);background:var(--surface);transition:.2s}
.sk li:hover{border-color:var(--accent);transform:translateY(-2px)}
.line{list-style:none;margin:0;padding:0 0 0 26px;border-left:2px solid var(--line)}
.line li{position:relative;padding-bottom:34px}
.line li::before{content:"";position:absolute;left:-33px;top:6px;width:12px;height:12px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 5px var(--bg)}
.when{color:var(--accent);font-size:.9rem;font-weight:500}
.line h3{font-size:1.3rem;margin:4px 0}
.line p{margin:2px 0;color:var(--muted)}
.line .place{color:var(--text)}
.contact{text-align:center;padding-bottom:80px}
.contact p{color:var(--muted);max-width:44ch;margin:0 auto 18px}
.soc{display:flex;gap:22px;justify-content:center;margin-top:26px;color:var(--muted)}
.soc a:hover{color:var(--accent)}
footer{text-align:center;padding:28px;color:var(--muted);border-top:1px solid var(--line);font-size:.9rem}
@keyframes in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes roll{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:none}}
@keyframes drift{to{transform:translate(6vw,5vw) scale(1.15)}}
@keyframes scroll{to{transform:translateX(-50%)}}
@keyframes pulse{70%{box-shadow:0 0 0 10px #3ddc9700}100%{box-shadow:0 0 0 0 #3ddc9700}}
@media(max-width:640px){.nav nav a{display:none}}
@media(prefers-reduced-motion:reduce){.pf *{animation:none!important;transition:none!important}.reveal{opacity:1;transform:none}}
`;
