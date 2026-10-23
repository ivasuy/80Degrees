import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowDown,
  ArrowRight,
  Plus,
  X,
  Menu,
  Pause,
  Play,
  Check,
  Sparkles,
  Download,
} from "lucide-react";
const BrandScene = lazy(() => import("./components/BrandScene"));

// These are authored design explorations, not customer projects or generated builds.
// Photography is served locally from public/images; the brand sculpture is rendered live.
const projects = [
  {
    id: "forma",
    name: "Forma",
    category: "Websites",
    type: "Architecture & interiors",
    color: "forma",
    description:
      "A considered digital home for a contemporary architecture studio. Warm materials, editorial typography, and room for the work to breathe.",
    prompt:
      "An editorial website for an architecture studio. Warm neutrals, oversized typography, immersive project photography, and a simple project enquiry flow.",
  },
  {
    id: "orbit",
    name: "Orbit",
    category: "Apps",
    type: "Personal finance",
    color: "orbit",
    description:
      "A calmer way to see your money. A focused dashboard brings spending, goals, and the bigger picture into one view.",
    prompt:
      "A personal finance dashboard with spending categories, monthly cash flow, savings goals, and a calm, accessible dark interface.",
  },
  {
    id: "sonic",
    name: "Sonic",
    category: "Websites",
    type: "Sound & culture",
    color: "sonic",
    description:
      "An expressive storefront for people who live in sound. A bold product story, rich photography, and a warm, tactile palette.",
    prompt:
      "A bold storefront for a premium headphone brand. Warm yellow, expressive typography, product details, and a streamlined shopping experience.",
  },
  {
    id: "terrain",
    name: "Terrain",
    category: "Assets",
    type: "Outdoor brand direction",
    color: "terrain",
    description:
      "An art direction for a life outside. Cinematic landscapes, restrained typography, and a visual language that invites exploration.",
    prompt:
      "An outdoor travel brand with cinematic mountain photography, forest green, editorial type, and an immersive destination discovery experience.",
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

function ProjectVisual({ project }) {
  if (project.id === "forma")
    return (
      <div className="project-art forma-art">
        <div className="mini-site forma-site">
          <div className="mini-nav">
            <b>forma.</b>
            <span>Spaces for living.</span>
            <span>
              MENU <Plus size={10} />
            </span>
          </div>
          <div className="forma-title">
            Good spaces.
            <br />
            <i>Better living.</i>
          </div>
          <img
            src="/images/interior.webp"
            alt="Sunlit architectural interior with natural materials"
            loading="lazy"
          />
          <div className="mini-bottom">
            <span>Architecture with a human perspective.</span>
            <ArrowUpRight size={17} />
          </div>
        </div>
      </div>
    );
  if (project.id === "orbit")
    return (
      <div className="project-art orbit-art">
        <div className="orbit-site">
          <aside>
            <b>
              <span className="orbit-symbol" /> orbit
            </b>
            <div className="mini-sidebar-active">Overview</div>
            <div>Transactions</div>
            <div>Accounts</div>
            <div>Goals</div>
            <small>YOUR SPACE, IN BALANCE</small>
          </aside>
          <div className="orbit-dashboard">
            <div className="mini-nav">
              <span>Your overview</span>
              <span className="mini-avatar">J</span>
            </div>
            <p>Looking good, Jamie.</p>
            <div className="balance-label">TOTAL BALANCE</div>
            <div className="balance">
              $24,680<span>.00</span>
            </div>
            <div className="chart-label">
              <span>Cash flow</span>
              <span>This month ↗</span>
            </div>
            <div className="chart-bars">
              {[30, 45, 36, 55, 43, 64, 53, 74, 61, 83, 73, 98].map(
                (height, index) => (
                  <i key={index} style={{ height: `${height}%` }} />
                ),
              )}
            </div>
            <div className="mini-transactions">
              <span>Recent activity</span>
              <span>View all</span>
            </div>
            <div className="transaction">
              <i>S</i>
              <span>
                Spotify<small>Entertainment</small>
              </span>
              <b>−$10.99</b>
            </div>
          </div>
        </div>
      </div>
    );
  if (project.id === "sonic")
    return (
      <div className="project-art sonic-art">
        <div className="sonic-site">
          <div className="mini-nav">
            <b>sonic®</b>
            <span>Sound. Without limits.</span>
            <span>
              SHOP <ArrowUpRight size={10} />
            </span>
          </div>
          <div className="sonic-headline">
            LESS NOISE.
            <br />
            MORE <i>FEELING.</i>
          </div>
          <img
            src="/images/headphones.webp"
            alt="Premium headphones on a golden yellow background"
            loading="lazy"
          />
          <div className="sonic-stamp">
            TUNE INTO
            <br />
            YOUR WORLD <ArrowUpRight size={20} />
          </div>
        </div>
      </div>
    );
  return (
    <div className="project-art terrain-art">
      <div className="terrain-site">
        <img
          src="/images/mountains.webp"
          alt="Sunlight falling on a rugged mountain range"
          loading="lazy"
        />
        <div className="mini-nav">
          <b>terrain.</b>
          <span>
            Find your outside <ArrowUpRight size={10} />
          </span>
        </div>
        <div className="terrain-title">
          Somewhere
          <br />
          <i>less ordinary.</i>
        </div>
        <div className="terrain-bottom">
          <span>GO FURTHER. FEEL MORE.</span>
          <span className="tiny-circle">
            <ArrowUpRight size={17} />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState("All builds");
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState(0);
  const [idea, setIdea] = useState("");
  const [projectType, setProjectType] = useState("Website");
  const [downloaded, setDownloaded] = useState(false);
  const dialog = useRef(null);
  const ideaInput = useRef(null);
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

  useEffect(() => {
    const elements = app.current.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 },
    );
    elements.forEach((element) => observer.observe(element));
    const progress = document.querySelector(".scroll-progress");
    const update = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${height > 0 ? window.scrollY / height : 0})`;
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, []);

  useEffect(() => {
    if (selected) {
      dialog.current.showModal();
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selected]);

  const closeProject = () => {
    dialog.current?.close();
    setSelected(null);
  };
  const useDirection = (project) => {
    setIdea(project.prompt);
    setDownloaded(false);
    setProjectType(
      project.category === "Apps"
        ? "App"
        : project.category === "Assets"
          ? "Brand & assets"
          : "Website",
    );
    closeProject();
    document.getElementById("create").scrollIntoView({ behavior: "smooth" });
    ideaInput.current.focus({ preventScroll: true });
  };
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
    <div ref={app} className={paused ? "site motion-paused" : "site"}>
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
            <a href="#builds" className="button button-rust">
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
            <a href="#platform">
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
                  paused ? "Play ambient animation" : "Pause ambient animation"
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
              You bring the vision.
              <br />
              We help you <span className="serif">break ground.</span>
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

        <section className="builds section-wrap" id="builds">
          <div className="section-heading" data-reveal>
            <h2>
              Not just imagined.
              <br />
              <span className="serif">Made possible.</span>
            </h2>
            <p>
              Different ideas. Entirely different worlds.
              <br />A look at the possibilities, from first spark to full
              picture.
            </p>
          </div>
          <div className="build-toolbar">
            <div className="filters" aria-label="Filter concept builds">
              {["All builds", "Websites", "Apps", "Assets"].map((item) => (
                <button
                  key={item}
                  className={filter === item ? "active" : ""}
                  aria-pressed={filter === item}
                  onClick={() => setFilter(item)}
                >
                  {item}
                  {item === "All builds" && <span>04</span>}
                </button>
              ))}
            </div>
            <span className="concept-label">
              CONCEPT EXPLORATIONS <span />
            </span>
          </div>
          <div className="projects-grid">
            {projects
              .filter(
                (project) =>
                  filter === "All builds" || project.category === filter,
              )
              .map((project) => (
                <button
                  key={project.id}
                  className="project-card"
                  onClick={() => setSelected(project)}
                  aria-label={`Explore ${project.name} concept`}
                >
                  <div className="project-image">
                    <ProjectVisual project={project} />
                    <span className="project-open">
                      <ArrowUpRight size={21} />
                    </span>
                    <span className="project-hover-text">
                      Take a closer look
                    </span>
                  </div>
                  <div className="project-meta">
                    <div>
                      <h3>{project.name}</h3>
                      <span>{project.type}</span>
                    </div>
                    <span className="category-tag">{project.category}</span>
                  </div>
                </button>
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
              ref={ideaInput}
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
      <dialog
        ref={dialog}
        className="project-dialog"
        aria-label={
          selected ? `${selected.name} concept preview` : "Concept preview"
        }
        onCancel={closeProject}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeProject();
        }}
      >
        {selected && (
          <div className="dialog-content">
            <div className="dialog-top">
              <span>
                CONCEPT EXPLORATION / {selected.category.toUpperCase()}
              </span>
              <button onClick={closeProject} aria-label="Close project preview">
                <X size={23} />
              </button>
            </div>
            <ProjectVisual project={selected} />
            <div className="dialog-details">
              <div>
                <h2>
                  {selected.name}
                  <ArrowUpRight />
                </h2>
                <p>{selected.description}</p>
                <small>
                  Illustrative design concept, not a published customer project.
                </small>
              </div>
              <button
                className="button button-rust"
                onClick={() => useDirection(selected)}
              >
                Use this direction <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
