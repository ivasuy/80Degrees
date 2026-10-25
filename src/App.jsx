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
      title: "Start with a spark.",
      text: "A business you want to launch. A problem you want to solve. A wild “what if.” Start with what’s in your head.",
      input: "A beautiful space for an architecture studio…",
      status: "Your idea",
      tag: "No perfect prompt required.",
    },
    {
      title: "Find your direction.",
      text: "Explore the look, feel, and experience. Turn the abstract into something you can see, touch, and make your own.",
      input: "Warm materials. Editorial type. Room to breathe.",
      status: "Your direction",
      tag: "Make it unmistakably yours.",
    },
    {
      title: "Make it real.",
      text: "Bring the pieces together. Refine the details, explore what’s possible, and take your next idea out into the world.",
      input: "From the first thought to the finished experience.",
      status: "Your next big thing",
      tag: "Less imagining. More making.",
    },
  ];

  useScrollMotion(app);

  const downloadBrief = (event) => {
    event.preventDefault();
    const content = `80degrees — Creative brief\n\nProject type: ${projectType}\n\nThe idea\n${idea.trim()}\n\nNext steps\n1. Define your audience and the one thing they should do.\n2. Gather your content, brand assets, and visual references.\n3. Outline the key pages or screens.\n4. Build, review, refine, and launch.\n\nCreated with the 80degrees idea planner.\n`;
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
              ["The platform", "#platform"],
              ["Made possible", "#builds"],
              ["How it works", "#process"],
            ].map(([label, href]) => (
              <a href={href} key={href} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
          </nav>
          <a className="button button-dark nav-cta" href="#create">
            Let’s build <ArrowUpRight size={16} />
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
                Big ideas.
                <br />
                Real things<span className="rust">.</span>
              </h1>
              <p>
                The space between “what if” and “here it is.”
                <br className="desktop-break" /> Bring your ideas to life with
                80degrees.
              </p>
              <a href="#story" className="button button-rust">
                Explore what’s possible <ArrowUpRight size={18} />
              </a>
              <div className="hero-note">
                <span className="status-dot" /> A new angle on creating.
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
                <span /> IDEAS, IN A NEW DIMENSION
              </span>
              <div className="drag-note">
                <Plus size={13} /> Drag to find your angle
              </div>
            </div>
            <div className="hero-footer">
              <a href="#story">
                <span className="round-arrow">
                  <ArrowDown size={17} />
                </span>{" "}
                A little scroll. A whole lot of possibility.
              </a>
              <div className="hero-footer-right">
                <span>IMAGINATION, MEET EXECUTION.</span>
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
              <span className="small-cross">+</span> A DIFFERENT DEGREE OF
              POSSIBILITY
            </div>
            <div className="manifesto-content" data-reveal>
              <h2>
                {"You bring the vision.".split(" ").map((word, index) => (
                  <span key={index} className="manifesto-word">
                    {word}{" "}
                  </span>
                ))}
                <br />
                {"We help you".split(" ").map((word, index) => (
                  <span key={index} className="manifesto-word">
                    {word}{" "}
                  </span>
                ))}
                <span className="serif">
                  <span className="manifesto-word">break </span>
                  <span className="manifesto-word">ground.</span>
                </span>
              </h2>
              <div className="manifesto-bottom">
                <Mark />
                <p>
                  The next great website, app, or brand shouldn’t stay in your
                  notes. 80degrees is a space to turn your imagination into
                  something real. Less getting in the way. More getting it out
                  into the world.
                </p>
                <a className="text-link" href="#process">
                  From idea to reality <ArrowUpRight size={18} />
                </a>
              </div>
            </div>
          </section>

          <ScrollStory
            paused={paused}
            onTogglePause={() => setPaused((value) => !value)}
          />

          <section className="builds section-wrap" id="builds">
            <div className="section-heading" data-reveal>
              <h2>
                Not just imagined.
                <br />
                <span className="serif">Made possible.</span>
              </h2>
              <p>
                Three live projects. Three different worlds.
                <br />
                Select a preview to explore the site in a new tab.
              </p>
            </div>
            <div className="build-toolbar">
              <h3>Live projects</h3>
              <p>Actual sites. Ready to explore.</p>
            </div>
            <div className="projects-grid">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} paused={paused} />
              ))}
            </div>
            <div className="builds-foot">
              <span>One starting point. Endless directions.</span>
              <a href="#create" className="text-link">
                What will you make? <ArrowUpRight size={19} />
              </a>
            </div>
          </section>

          <section
            className="possibility-band"
            aria-label="Your imagination is the starting point"
          >
            <div className="marquee-track" aria-hidden="true">
              {[0, 1, 2, 3].map((n) => (
                <span key={n}>
                  Less friction. <i>More creation.</i>
                  <Mark />
                </span>
              ))}
            </div>
          </section>

          <section className="process section-wrap" id="process">
            <div className="process-copy">
              <h2>
                From a little spark.
                <br />
                To a <span className="serif">big something.</span>
              </h2>
              <p>
                Making should feel like possibility.
                <br />
                Not a mountain of things to figure out.
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
                <span>THE MAKING OF AN IDEA</span>
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
                      ? "A possibility waiting to happen"
                      : step === 1
                        ? "Finding the right angle"
                        : "Ready for its next chapter"}
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
                    aria-label={`Show step ${index + 1}`}
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
                That idea in your head?
                <br />
                <span className="serif">Give it a place to start.</span>
              </h2>
              <p>
                Big, small, beautifully strange. Start by putting it into words.
              </p>
            </div>
            <form className="idea-form" onSubmit={downloadBrief}>
              <div className="type-picker" aria-label="Project type">
                {["Website", "App", "Brand & assets"].map((type) => (
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
              <label className="sr-only" htmlFor="idea">
                Describe your idea
              </label>
              <textarea
                id="idea"
                value={idea}
                onChange={(event) => {
                  setIdea(event.target.value);
                  setDownloaded(false);
                }}
                placeholder="I’ve been thinking about making…"
                required
                minLength={10}
                maxLength={3000}
                rows={3}
              />
              <div className="form-footer">
                <span>Your first step: a creative brief.</span>
                <button className="button button-rust" type="submit">
                  {downloaded ? "Download again" : "Make a start"}
                  {downloaded ? (
                    <Download size={16} />
                  ) : (
                    <ArrowUpRight size={17} />
                  )}
                </button>
              </div>
              <div className="form-status" role="status">
                {downloaded ? (
                  <>
                    <Check size={14} /> Your brief is ready. Keep it, refine it,
                    make it happen.
                  </>
                ) : (
                  "Save your idea as a brief. No account needed."
                )}
              </div>
            </form>
          </section>
        </main>
        <footer className="footer section-wrap">
          <div className="footer-top">
            <a href="#" className="wordmark">
              <Mark />
              <span>80degrees</span>
            </a>
            <span>A new angle on what’s possible.</span>
            <a className="back-top" href="#">
              Back to the top <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="footer-wordmark" aria-hidden="true">
            make <span className="serif">something.</span>
            <ArrowUpRight />
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} 80degrees</span>
            <span>FOR THE IDEAS THAT WON’T LEAVE YOU ALONE.</span>
            <a href="#builds">
              Keep exploring <ArrowUpRight size={14} />
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}
