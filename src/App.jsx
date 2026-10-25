import { lazy, Suspense, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowDown,
  Plus,
  X,
  Menu,
  Pause,
  Play,
  Check,
  Sparkles,
  Download,
} from "lucide-react";
import IntroSequence from "./components/IntroSequence";
import ScrollStory from "./components/ScrollStory";
import ProjectCard from "./components/ProjectCard";
import Waitlist from "./components/Waitlist";
import useScrollMotion from "./lib/useScrollMotion";
import "./motion.css";
const BrandScene = lazy(() => import("./components/BrandScene"));

// Actual captures of the linked deployments, served locally so the showcase
// does not load three interactive WebGL applications into the landing page.
const projects = [
  {
    id: "abeto-messenger",
    name: "Abeto Messenger",
    type: "Interactive world",
    url: "https://abeto-messenger.vercel.app",
    preview: "/images/projects/abeto-messenger.webp",
    motion: "/videos/projects/abeto-messenger.mp4",
    alt: "Abeto Messenger's illustrated island and Messenger title",
  },
  {
    id: "bruno",
    name: "Bruno",
    type: "3D experience",
    url: "https://bruno-nine-wine.vercel.app",
    preview: "/images/projects/bruno.webp",
    motion: "/videos/projects/bruno.mp4",
    alt: "Bruno's red off-road car beneath a glowing pink tree",
  },
  {
    id: "igloo-recreation",
    name: "Igloo Recreation",
    type: "Website recreation",
    url: "https://igloo-recreation-umber.vercel.app",
    preview: "/images/projects/igloo-recreation.webp",
    motion: "/videos/projects/igloo-recreation.mp4",
    alt: "Igloo Recreation's illuminated ice-block igloo in a snowy mountain landscape",
  },
];

function Mark({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 512 512"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M376 310A154 154 0 1 1 336 142"
        stroke="currentColor"
        strokeWidth="60"
        strokeLinecap="round"
      />
      <circle cx="424" cy="169" r="33" fill="currentColor" />
    </svg>
  );
}

export default function App() {
  const [intro, setIntro] = useState(
    () =>
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !window.location.hash,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [step, setStep] = useState(0);
  const [idea, setIdea] = useState("");
  const [projectType, setProjectType] = useState("Website");
  const [downloaded, setDownloaded] = useState(false);
  const app = useRef(null);
  const steps = [
    {
      title: "Describe what you need.",
      text: "Tell 80degrees what you want to build and who it’s for. Plain English is enough to get started.",
      input: "Build a booking app for my pottery studio.",
      status: "Your starting point",
      tag: "Start with the problem, not the code.",
    },
    {
      title: "Let the agents build.",
      text: "Engineering agents plan the work, write the code, run it, test it, and debug on your own machine.",
      input: "Plan the screens. Build booking. Test the flow.",
      status: "The engineering work",
      tag: "From a plan to working code.",
    },
    {
      title: "Try it. Refine it. Ship it.",
      text: "Review the result, ask for changes, and let the agents help you ship. Your feedback shapes the product.",
      input: "Let customers choose a class and reserve a seat.",
      status: "Your next refinement",
      tag: "Keep building on your own machine.",
    },
  ];

  useScrollMotion(app);

  const downloadBrief = (event) => {
    event.preventDefault();
    const content = `80degrees — Creative brief\n\nProject type: ${projectType}\n\nThe idea\n${idea.trim()}\n\nBefore you build\n1. Who is this for?\n2. What problem should it solve?\n3. What is the first thing someone should be able to do?\n4. What would make that first version useful?\n\nThis is a text brief, not a generated app.\nSaved with the 80degrees idea planner.\n`;
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "80degrees-creative-brief.txt";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  };

  return (
    <>
      {intro && <IntroSequence onComplete={() => setIntro(false)} />}
      <div
        ref={app}
        className={paused ? "site motion-paused" : "site"}
        data-intro={intro}
        inert={intro ? "" : undefined}
      >
        <div className="scroll-progress" aria-hidden="true" />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="header">
          <a href="#" className="wordmark" aria-label="80degrees home">
            <Mark />
            <span>80degrees</span>
          </a>
          <nav
            aria-label="Main navigation"
            className={menuOpen ? "navigation open" : "navigation"}
          >
            {[
              ["The product", "#platform"],
              ["Live projects", "#builds"],
              ["How it works", "#process"],
            ].map(([label, href]) => (
              <a href={href} key={href} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
          </nav>
          <a
            className="button button-dark nav-cta"
            href="#waitlist"
            onClick={() => setMenuOpen(false)}
          >
            Join waitlist <ArrowUpRight size={16} />
          </a>
          <button
            className="menu-toggle"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>
        <main id="main">
          <section className="hero">
            <div className="hero-copy">
              <h1>
                Your idea.
                <br />
                A real app<span className="rust">.</span>
              </h1>
              <p>
                Describe what you want to build. 80degrees’ engineering agents
                write, test, and ship the code on your own machine.
              </p>
              <div className="hero-actions">
                <a href="#waitlist" className="button button-rust">
                  Join waitlist <ArrowUpRight size={18} />
                </a>
                <a
                  href="https://drive.google.com/file/d/1Kfp0SgYGO8Ge_Zdd4FWYe6IiWHrG0qlo/view?usp=sharing"
                  className="button button-demo"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Play size={15} /> Watch demo
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>
              <div className="hero-note">
                <span className="status-dot" /> Engineering agents work today. Join for access updates.
              </div>
            </div>
            <div className="hero-visual">
              <div className="orbit-line orbit-line-one" />
              <div className="orbit-line orbit-line-two" />
              <Suspense fallback={<Mark className="scene-fallback" />}>
                <BrandScene paused={paused} />
              </Suspense>
              <div className="scene-shadow" />
              <span className="scene-label">
                <span /> BUILT FROM YOUR IDEAS
              </span>
              <div className="drag-note">
                <Plus size={13} /> Drag to find your angle
              </div>
            </div>
            <div className="hero-footer">
              <a href="#platform">
                <span className="round-arrow">
                  <ArrowDown size={17} />
                </span>{" "}
                Meet your engineering agents.
              </a>
              <div className="hero-footer-right">
                <span>YOUR IDEA. YOUR MACHINE.</span>
                <button
                  className="motion-toggle"
                  onClick={() => setPaused(!paused)}
                  aria-label={
                    paused
                      ? "Play ambient animation"
                      : "Pause ambient animation"
                  }
                >
                  {paused ? <Play size={13} /> : <Pause size={13} />}
                </button>
              </div>
            </div>
          </section>

          <section className="manifesto section-wrap" id="platform">
            <div className="section-label">
              <span className="small-cross">+</span> BUILT FOR BUILDERS
            </div>
            <div className="manifesto-content" data-reveal>
              <h2>
                {"You know the problem.".split(" ").map((word, index) => (
                  <span key={index} className="manifesto-word">
                    {word}{" "}
                  </span>
                ))}
                <br />
                {"Let’s build".split(" ").map((word, index) => (
                  <span key={index} className="manifesto-word">
                    {word}{" "}
                  </span>
                ))}
                <span className="serif">
                  <span className="manifesto-word">the </span>
                  <span className="manifesto-word">product.</span>
                </span>
              </h2>
              <div className="manifesto-bottom">
                <Mark />
                <p>
                  For founders testing an idea, makers starting a side project,
                  and developers ready to build. Bring the goal; engineering
                  agents take on the planning, coding, testing, and debugging.
                </p>
                <a className="text-link" href="#process">
                  See how it works <ArrowUpRight size={18} />
                </a>
              </div>
              <dl className="product-details">
                <div>
                  <dt>Working today</dt>
                  <dd>
                    Engineering agents that turn a plain-English idea into
                    working software on your machine.
                  </dd>
                </div>
                <div>
                  <dt>Your machine. Your API keys.</dt>
                  <dd>
                    Local builds use your machine and your API keys—not platform
                    credits. You pay your model provider for usage, with no markup
                    from 80degrees.
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <ScrollStory
            paused={paused}
            onTogglePause={() => setPaused((value) => !value)}
          />

          <section className="builds section-wrap" id="builds">
            <div className="section-heading" data-reveal>
              <h2>
                Open the projects.
                <br />
                <span className="serif">Explore the details.</span>
              </h2>
              <p>
                Interactive worlds, 3D experiences, and a website recreation.
                Select a preview to open the live site in a new tab.
              </p>
            </div>
            <div className="build-toolbar">
              <h3>Live projects</h3>
              <p>Real previews. Live links.</p>
            </div>
            <div className="projects-grid">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  paused={paused}
                />
              ))}
            </div>
            <div className="builds-foot">
              <span>Different projects. A place to find your next idea.</span>
              <a href="#create" className="text-link">
                Write your brief <ArrowUpRight size={19} />
              </a>
            </div>
          </section>

          <section
            className="possibility-band"
            aria-label="Describe it. Build it. Make it yours."
          >
            <div className="marquee-track" aria-hidden="true">
              {[0, 1, 2, 3].map((n) => (
                <span key={n}>
                  Describe it. <i>Build it.</i>
                  <Mark />
                </span>
              ))}
            </div>
          </section>

          <section className="process section-wrap" id="process">
            <div className="process-copy">
              <h2>
                You describe it.
                <br />
                Agents <span className="serif">build it.</span>
              </h2>
              <p>
                From the first prompt to running code.
                Here’s how the engineering agents work.
              </p>
              <div className="process-steps">
                {steps.map((item, index) => (
                  <button
                    key={item.title}
                    className={
                      step === index ? "process-step active" : "process-step"
                    }
                    onClick={() => setStep(index)}
                    aria-expanded={step === index}
                  >
                    <span className="step-number">0{index + 1}</span>
                    <span>
                      <strong>{item.title}</strong>
                      {step === index && <p>{item.text}</p>}
                    </span>
                    <span className="step-indicator">
                      {step === index ? (
                        <ArrowUpRight size={21} />
                      ) : (
                        <Plus size={18} />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className={`process-demo demo-step-${step}`}>
              <div className="demo-top">
                <Mark />
                <span>THE WORKFLOW, ILLUSTRATED</span>
                <span className="status-dot" />
              </div>
              <div className="demo-orbit">
                <span className="demo-orbit-ring" />
                <Mark />
                <span className="demo-orbit-dot" />
              </div>
              <div className="demo-prompt" key={step}>
                <div>
                  <span className="demo-icon">
                    <Sparkles size={16} />
                  </span>
                  <span>{steps[step].status}</span>
                  <Check size={15} />
                </div>
                <p>{steps[step].input}</p>
                <div className="demo-prompt-bottom">
                  <span>
                    {step === 0
                      ? "An example prompt"
                      : step === 1
                        ? "Planning, coding, testing"
                        : "Reviewing and refining"}
                  </span>
                  <span className="demo-send">
                    <ArrowUpRight size={17} />
                  </span>
                </div>
              </div>
              <span className="demo-caption">{steps[step].tag}</span>
              <div className="demo-dots">
                {steps.map((_, index) => (
                  <button
                    aria-label={`Show step ${index + 1}: ${steps[index].title}`}
                    aria-pressed={step === index}
                    className={step === index ? "active" : ""}
                    key={index}
                    onClick={() => setStep(index)}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="create-section section-wrap" id="create">
            <div className="create-heading">
              <div className="create-flower">
                <Mark />
              </div>
              <h2>
                Got an idea?
                <br />
                <span className="serif">Put it into words.</span>
              </h2>
              <p>
                Save a simple creative brief to use when you’re ready to build.
              </p>
            </div>
            <form className="idea-form" onSubmit={downloadBrief}>
              <div className="type-picker" aria-label="Project type">
                {["Website", "App", "Internal tool"].map((type) => (
                  <button
                    type="button"
                    key={type}
                    aria-pressed={projectType === type}
                    className={projectType === type ? "active" : ""}
                    onClick={() => {
                      setProjectType(type);
                      setDownloaded(false);
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <label className="idea-label" htmlFor="idea">
                What do you want to build, and who is it for?
              </label>
              <textarea
                id="idea"
                value={idea}
                onChange={(event) => {
                  setIdea(event.target.value);
                  setDownloaded(false);
                }}
                placeholder="A booking app for my pottery studio, so students can find a class and reserve a seat…"
                required
                minLength={10}
                maxLength={3000}
                rows={3}
                aria-describedby="brief-help brief-status"
              />
              <div className="form-footer">
                <span id="brief-help">Text brief only. No app is generated here.</span>
                <button className="button button-rust" type="submit">
                  {downloaded ? "Download again" : "Download brief"}
                  <Download size={16} />
                </button>
              </div>
              <div className="form-status" id="brief-status" role="status">
                {downloaded ? (
                  <>
                    <Check size={14} /> Brief download started. Your idea is saved as a text file.
                  </>
                ) : (
                  "At least 10 characters. Saved on your device, not sent to us."
                )}
              </div>
            </form>
          </section>
          <Waitlist />
        </main>
        <footer className="footer section-wrap">
          <div className="footer-top">
            <a href="#" className="wordmark">
              <Mark />
              <span>80degrees</span>
            </a>
            <span>Engineering agents. On your own machine.</span>
            <a className="back-top" href="#">
              Back to the top <ArrowUpRight size={17} />
            </a>
          </div>
          <nav className="footer-socials" aria-label="80degrees social links">
            <a
              href="https://x.com/80degrees_labs"
              target="_blank"
              rel="noopener noreferrer"
            >
              X <ArrowUpRight size={15} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <a
              href="https://www.instagram.com/80degrees_labs/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram <ArrowUpRight size={15} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <a
              href="https://discord.gg/pgMwgwfcm8"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join Discord <ArrowUpRight size={15} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </nav>
          <div className="footer-wordmark" aria-hidden="true">
            build <span className="serif">your idea.</span>
            <ArrowUpRight />
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} 80degrees</span>
            <span>FROM PLAIN ENGLISH TO WORKING CODE.</span>
            <a href="#waitlist">
              Join waitlist <ArrowUpRight size={14} />
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}
