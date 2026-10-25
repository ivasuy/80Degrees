import { lazy, Suspense, useRef, useState } from "react";
import {
  ArrowUpRight,
  Plus,
  X,
  Menu,
  Sparkles,
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
  const [step, setStep] = useState(0);
  const app = useRef(null);
  const steps = [
    {
      title: "Describe what you need.",
      text: "Tell 80degrees what you want to build and who it’s for. Plain English is enough.",
      input: "Build a booking app for my pottery studio.",
      status: "Your starting point",
    },
    {
      title: "Let the agents build.",
      text: "Agents plan, code, test, and debug on your own machine.",
      input: "Plan the screens. Build booking. Test the flow.",
      status: "The engineering work",
    },
    {
      title: "Try it. Refine it. Ship it.",
      text: "Try the result, ask for changes, and let the agents help you ship.",
      input: "Let customers choose a class and reserve a seat.",
      status: "Your next refinement",
    },
  ];

  useScrollMotion(app);

  return (
    <>
      {intro && <IntroSequence onComplete={() => setIntro(false)} />}
      <div
        ref={app}
        className="site"
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
              </div>
            </div>
            <div className="hero-visual">
              <div className="orbit-line orbit-line-one" />
              <div className="orbit-line orbit-line-two" />
              <Suspense fallback={<Mark className="scene-fallback" />}>
                <BrandScene />
              </Suspense>
              <div className="scene-shadow" />
              <span className="scene-label">
                <span /> BUILT FROM YOUR IDEAS
              </span>
            </div>
          </section>

          <section className="manifesto section-wrap" id="platform">
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
                  For founders, makers, and developers. Bring the goal; agents
                  take on the planning, coding, testing, and debugging.
                </p>
                <a className="text-link" href="#process">
                  See how it works <ArrowUpRight size={18} />
                </a>
              </div>
              <p className="product-note">
                Your machine. Your API keys. Pay your model provider directly,
                with no markup from 80degrees.
              </p>
            </div>
          </section>

          <ScrollStory />

          <section className="builds section-wrap" id="builds">
            <div className="section-heading" data-reveal>
              <h2>
                Open the projects.
                <br />
                <span className="serif">Explore the details.</span>
              </h2>
              <p>
                Explore three real projects built with 80degrees.
              </p>
            </div>
            <div className="projects-grid">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                />
              ))}
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
                </div>
                <p>{steps[step].input}</p>
              </div>
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

          <Waitlist />
          {/* Keep contact secondary to signup; the waitlist owns the access CTA. */}
          <section className="contact section-wrap" aria-labelledby="contact-title">
            <div>
              <h2 id="contact-title">Have questions? Let’s talk.</h2>
              <p>
                We’d love to hear what you’re building and answer your questions.
              </p>
            </div>
            <a
              className="text-link"
              href="https://calendly.com/80degrees01"
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a conversation <ArrowUpRight size={18} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </section>
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
