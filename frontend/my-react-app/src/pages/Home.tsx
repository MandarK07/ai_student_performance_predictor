import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  FileSpreadsheet,
  GraduationCap,
  LineChart,
  Linkedin,
  Lock,
  Menu,
  Play,
  Radar,
  ShieldCheck,
  Sparkles,
  Star,
  Twitter,
  Upload,
  Users,
  X,
  Youtube,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

const SectionBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
    <Sparkles className="h-3.5 w-3.5" />
    {children}
  </span>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl lg:text-[2.65rem] lg:leading-[1.15]">
    {children}
  </h2>
);

const SectionSubtitle = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-500">{children}</p>
);

/* ------------------------------------------------------------------ */
/*  Navigation                                                         */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { label: "Home", href: "#" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white shadow-lg shadow-blue-700/25">
            <GraduationCap className="h-[1.375rem] w-[1.375rem]" strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <span className="block text-[17px] font-bold tracking-tight text-slate-900">AI EduPredict</span>
            <span className="block text-[11px] font-medium uppercase tracking-widest text-slate-400">
              Student Success AI
            </span>
          </div>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-[#2563EB]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/login"
            className="text-sm font-semibold text-slate-700 transition-colors duration-200 hover:text-[#2563EB]"
          >
            Login
          </Link>
          <Link
            to="/register-user"
            className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1E3A8A] hover:shadow-blue-700/30"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 pb-6 pt-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex gap-3 border-t border-slate-100 pt-4">
              <Link
                to="/login"
                className="flex-1 rounded-full border border-slate-200 px-5 py-2.5 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Login
              </Link>
              <Link
                to="/register-user"
                className="flex-1 rounded-full bg-[#2563EB] px-5 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-600/25"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

const HeroSection = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-[#F6F8FC]">
      {/* Soft background gradients */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-gradient-to-br from-blue-200/40 to-indigo-200/30 blur-3xl" />
      <div className="pointer-events-none absolute top-64 -left-40 h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-emerald-100/50 to-teal-100/30 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/60 to-transparent" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 pb-24 pt-16 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8 lg:pb-32 lg:pt-24">
        {/* Left content */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-1.5 text-xs font-semibold text-[#2563EB] shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Analytics for Education
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.6rem]">
            Predict Student Success{" "}
            <span className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#14B8A6] bg-clip-text text-transparent">
              Before Problems Begin
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-500">
            Leverage AI-powered analytics to identify at-risk students, monitor academic performance,
            and empower educators with data-driven insights.
          </p>

          {/* CTA buttons */}
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/register-user"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#2563EB] px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1E3A8A] hover:shadow-blue-700/40"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <button
              onClick={() => scrollTo("dashboard-preview")}
              className="inline-flex items-center justify-center gap-2.5 rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
                <Play className="h-3 w-3 fill-current" />
              </span>
              Watch Demo
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Brain className="h-[1.125rem] w-[1.125rem] text-[#2563EB]" />
              AI Powered
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <ShieldCheck className="h-[1.125rem] w-[1.125rem] text-[#10B981]" />
              Secure Platform
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <LineChart className="h-[1.125rem] w-[1.125rem] text-[#14B8A6]" />
              Real-time Analytics
            </div>
          </div>
        </div>

        {/* Right — floating analytics illustration */}
        <HeroVisual />
      </div>
    </section>
  );
};

/* Floating dashboard mockup for hero */
const HeroVisual = () => (
  <div className="relative mx-auto w-full max-w-[560px]">
    {/* Glow behind */}
    <div className="absolute inset-8 rounded-[36px] bg-gradient-to-br from-blue-400/30 via-indigo-400/20 to-teal-300/30 blur-2xl" />

    {/* Main card */}
    <div className="relative rounded-[22px] border border-white/60 bg-white/80 p-5 shadow-2xl shadow-blue-900/10 backdrop-blur-xl">
      {/* Window dots */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#F59E0B]" />
          <span className="h-3 w-3 rounded-full bg-[#10B981]" />
          <span className="h-3 w-3 rounded-full bg-[#EF4444]" />
        </div>
        <span className="text-xs font-semibold text-slate-500">AI EduPredict · Dashboard</span>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
          Live
        </span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Avg GPA</span>
            <GraduationCap className="h-4 w-4 text-[#2563EB]" />
          </div>
          <p className="mt-1.5 text-2xl font-extrabold text-slate-900">3.72</p>
          <p className="mt-0.5 text-[11px] font-semibold text-emerald-600">▲ 4.8% vs last term</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">At-Risk</span>
            <Zap className="h-4 w-4 text-[#F59E0B]" />
          </div>
          <p className="mt-1.5 text-2xl font-extrabold text-slate-900">12</p>
          <p className="mt-0.5 text-[11px] font-semibold text-amber-500">Identified this week</p>
        </div>
      </div>

      {/* GPA graph */}
      <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">GPA Performance Trend</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#2563EB]">
            <LineChart className="h-3 w-3" /> +12% YoY
          </span>
        </div>
        <svg viewBox="0 0 300 90" className="w-full" aria-hidden="true">
          <defs>
            <linearGradient id="gpaArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gpaLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          {[20, 40, 60, 80].map((y) => (
            <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="#F1F5F9" strokeWidth="1" />
          ))}
          <path
            d="M0,72 C30,68 45,58 70,60 C95,62 110,44 140,46 C170,48 185,34 215,36 C245,38 265,22 300,18 L300,90 L0,90 Z"
            fill="url(#gpaArea)"
          />
          <path
            d="M0,72 C30,68 45,58 70,60 C95,62 110,44 140,46 C170,48 185,34 215,36 C245,38 265,22 300,18"
            fill="none"
            stroke="url(#gpaLine)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="215" cy="36" r="4.5" fill="#2563EB" stroke="#fff" strokeWidth="2" />
        </svg>
        <div className="mt-1 flex justify-between text-[10px] font-medium text-slate-400">
          <span>Sem 1</span>
          <span>Sem 2</span>
          <span>Sem 3</span>
          <span>Sem 4</span>
          <span>Sem 5</span>
          <span>Sem 6</span>
          <span>Current</span>
        </div>
      </div>

      {/* Donut + confidence */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Risk Distribution</span>
          <div className="mt-3 flex items-center justify-center">
            <div
              className="relative flex h-24 w-24 items-center justify-center rounded-full"
              style={{
                background:
                  "conic-gradient(#10B981 0deg 234deg, #F59E0B 234deg 317deg, #EF4444 317deg 360deg)",
              }}
            >
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-base font-extrabold text-slate-900">65%</span>
                <span className="text-[9px] font-medium text-slate-400">Low Risk</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-center gap-3 text-[10px] font-medium text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#10B981]" /> Low
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> Med
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#EF4444]" /> High
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] p-4 text-white shadow-lg shadow-blue-900/20">
          <span className="text-xs font-semibold text-blue-100">Prediction Confidence</span>
          <p className="mt-2 text-3xl font-extrabold">85.7%</p>
          <p className="mt-1 text-[11px] leading-snug text-blue-200">
            Model accuracy on 10,00+ student records
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-[85.7%] rounded-full bg-gradient-to-r from-[#10B981] to-[#14B8A6]" />
          </div>
        </div>
      </div>
    </div>

    {/* Floating widget — top right */}
    <div className="absolute -right-4 -top-6 hidden animate-bounce rounded-2xl border border-white/70 bg-white/90 p-4 shadow-xl shadow-blue-900/10 backdrop-blur sm:block lg:-right-10">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-[1.125rem] w-[1.125rem]" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900">Retention</p>
          <p className="text-[11px] font-semibold text-emerald-600">+8.4% Improved</p>
        </div>
      </div>
    </div>

    {/* Floating widget — bottom left */}
    <div className="absolute -bottom-6 -left-4 hidden animate-pulse rounded-2xl border border-white/70 bg-white/90 p-4 shadow-xl shadow-blue-900/10 backdrop-blur sm:block lg:-left-10">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
          <Users className="h-[1.125rem] w-[1.125rem]" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900">Active Students</p>
          <p className="text-[11px] font-semibold text-slate-500">847 this term</p>
        </div>
      </div>
    </div>

    {/* Floating icon — top left */}
    <div className="absolute -left-3 top-16 hidden h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/90 text-[#F59E0B] shadow-xl shadow-blue-900/10 backdrop-blur md:flex">
      <Zap className="h-5 w-5" />
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Statistics                                                         */
/* ------------------------------------------------------------------ */

const STATS = [
  {
    icon: <Users className="h-6 w-6" />,
    value: "1,000+",
    label: "Students Analyzed",
    color: "bg-blue-50 text-[#2563EB]",
  },
  {
    icon: <Radar className="h-6 w-6" />,
    value: "85.7%",
    label: "Prediction Accuracy",
    color: "bg-emerald-50 text-[#10B981]",
  },
  {
    icon: <GraduationCap className="h-6 w-6" />,
    value: "50+",
    label: "Institutions",
    color: "bg-teal-50 text-[#14B8A6]",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    value: "24/7",
    label: "AI Monitoring",
    color: "bg-amber-50 text-[#F59E0B]",
  },
];

const StatsSection = () => (
  <section className="py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="group rounded-[18px] border border-slate-200 bg-white p-7 shadow-[0_10px_30px_-12px_rgb(15_23_42/0.12)] transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-100 hover:shadow-[0_20px_40px_-12px_rgb(37_99_235/0.25)]"
          >
            <div
              className={`mb-5 flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${stat.color}`}
            >
              {stat.icon}
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-slate-900">{stat.value}</p>
            <p className="mt-1.5 text-sm font-medium text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  Features                                                           */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: <Brain className="h-6 w-6" />,
    title: "AI Risk Prediction",
    description:
      "Machine learning models identify at-risk students with 85.7% accuracy, enabling proactive intervention before performance declines.",
    color: "bg-blue-50 text-[#2563EB]",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Student Analytics",
    description:
      "Track attendance, grades, engagement, and academic trends across every student with intuitive, real-time analytics.",
    color: "bg-indigo-50 text-[#1E3A8A]",
  },
  {
    icon: <LineChart className="h-6 w-6" />,
    title: "GPA Forecasting",
    description:
      "Predict future GPA trajectories based on current performance indicators and historical academic records.",
    color: "bg-emerald-50 text-[#10B981]",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Early Warning Alerts",
    description:
      "Receive instant notifications when a student's performance signals academic risk, so educators can act immediately.",
    color: "bg-amber-50 text-[#F59E0B]",
  },
  {
    icon: <Radar className="h-6 w-6" />,
    title: "Interactive Dashboards",
    description:
      "Visualize risk distributions, performance trends, and intervention outcomes with beautiful, interactive dashboards.",
    color: "bg-teal-50 text-[#14B8A6]",
  },
  {
    icon: <FileSpreadsheet className="h-6 w-6" />,
    title: "CSV Import & Export",
    description:
      "Easily import student records via CSV files and export actionable reports for stakeholders and accreditation.",
    color: "bg-rose-50 text-[#EF4444]",
  },
];

const FeaturesSection = () => (
  <section id="features" className="py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <SectionBadge>Features</SectionBadge>
        <SectionTitle>Everything Your Institution Needs for Smarter Outcomes</SectionTitle>
        <SectionSubtitle>
          Powerful AI-powered tools built for educators, administrators, and academic leaders — all
          in one unified platform.
        </SectionSubtitle>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="group rounded-[18px] border border-slate-200 bg-white p-8 shadow-[0_10px_30px_-12px_rgb(15_23_42/0.12)] transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-100 hover:shadow-[0_20px_45px_-12px_rgb(37_99_235/0.22)]"
          >
            <div
              className={`mb-6 flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${feature.color}`}
            >
              {feature.icon}
            </div>
            <h3 className="text-lg font-bold text-slate-900">{feature.title}</h3>
            <p className="mt-2.5 leading-relaxed text-slate-500">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  How It Works                                                       */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    icon: <Upload className="h-6 w-6" />,
    title: "Upload Student Data",
    description: "Import academic records, attendance, and engagement data via CSV or API.",
  },
  {
    icon: <Brain className="h-6 w-6" />,
    title: "AI Processes Academic Records",
    description: "Our machine learning engine analyzes patterns across every data point.",
  },
  {
    icon: <LineChart className="h-6 w-6" />,
    title: "Predict Performance & Risk",
    description: "Receive accurate predictions and risk classifications for each student.",
  },
  {
    icon: <ArrowRight className="h-6 w-6" />,
    title: "View Actionable Insights",
    description: "Act on data-driven recommendations to support students in real time.",
  },
];

const HowItWorksSection = () => (
  <section id="how-it-works" className="bg-white py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <SectionBadge>How It Works</SectionBadge>
        <SectionTitle>From Student Data to Actionable Insights in Four Steps</SectionTitle>
        <SectionSubtitle>
          A simple, streamlined workflow designed to get your institution up and running with AI
          analytics in minutes.
        </SectionSubtitle>
      </div>

      <div className="relative mt-20">
        {/* Connecting line — desktop */}
        <div className="absolute left-0 right-0 top-9 hidden h-0.5 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 lg:block" />

        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((step, index) => (
            <div key={step.title} className="relative text-center">
              {/* Number + icon */}
              <div className="relative z-10 mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-[3px] border-blue-100 bg-white shadow-lg shadow-blue-900/10">
                <span className="absolute -top-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white shadow-md shadow-blue-600/30">
                  {index + 1}
                </span>
                <span className="text-[#2563EB]">{step.icon}</span>
              </div>
              <h3 className="mt-6 text-lg font-bold text-slate-900">{step.title}</h3>
              <p className="mx-auto mt-2.5 max-w-[260px] leading-relaxed text-slate-500">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  Dashboard Preview                                                  */
/* ------------------------------------------------------------------ */

const DashboardPreviewSection = () => (
  <section id="dashboard-preview" className="bg-[#F6F8FC] py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <SectionBadge>Dashboard Preview</SectionBadge>
        <SectionTitle>A Complete Analytics Command Center</SectionTitle>
        <SectionSubtitle>
          Monitor every aspect of student performance with a beautifully designed, intuitive
          dashboard — built for educators, by educators.
        </SectionSubtitle>
      </div>

      <div className="relative mx-auto mt-16 max-w-6xl">
        {/* Glow */}
        <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-r from-blue-200/40 via-indigo-100/30 to-teal-200/30 blur-2xl" />

        {/* Browser frame */}
        <div className="relative overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-2xl shadow-blue-900/10">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#EF4444]" />
              <span className="h-3 w-3 rounded-full bg-[#F59E0B]" />
              <span className="h-3 w-3 rounded-full bg-[#10B981]" />
            </div>
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-400 sm:flex">
              <Lock className="h-3 w-3" />
              app.aiedupredict.com/dashboard
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
              Live Preview
            </span>
          </div>

          {/* Dashboard content */}
          <div className="p-6 sm:p-8">
            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Total Students", value: "2,847", delta: "+3.2% vs last term", icon: <Users className="h-5 w-5" />, color: "text-[#2563EB] bg-blue-50" },
                { label: "Avg GPA", value: "3.72", delta: "+0.08 vs last term", icon: <GraduationCap className="h-5 w-5" />, color: "text-[#14B8A6] bg-teal-50" },
                { label: "At-Risk Students", value: "12", delta: "-4 this month", icon: <Zap className="h-5 w-5" />, color: "text-[#F59E0B] bg-amber-50" },
                { label: "Prediction Accuracy", value: "94.7%", delta: "+1.2% this quarter", icon: <Radar className="h-5 w-5" />, color: "text-[#10B981] bg-emerald-50" },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="group rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${kpi.color}`}>
                    {kpi.icon}
                  </div>
                  <p className="text-2xl font-extrabold tracking-tight text-slate-900">{kpi.value}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-400">{kpi.label}</p>
                  <p className="mt-2 text-[11px] font-semibold text-emerald-600">{kpi.delta}</p>
                </div>
              ))}
            </div>

            {/* Charts + list */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Risk donut */}
              <div className="rounded-[18px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Risk Distribution</h4>
                  <span className="text-[11px] font-medium text-slate-400">All departments</span>
                </div>
                <div className="flex items-center justify-center">
                  <div
                    className="relative flex h-40 w-40 items-center justify-center rounded-full"
                    style={{
                      background:
                        "conic-gradient(#10B981 0deg 234deg, #F59E0B 234deg 317deg, #EF4444 317deg 360deg)",
                    }}
                  >
                    <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                      <span className="text-2xl font-extrabold text-slate-900">65%</span>
                      <span className="text-[11px] font-medium text-slate-400">Low Risk</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" /> Low Risk
                    </span>
                    <span className="font-semibold text-slate-900">65%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" /> Medium Risk
                    </span>
                    <span className="font-semibold text-slate-900">23%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" /> High Risk
                    </span>
                    <span className="font-semibold text-slate-900">12%</span>
                  </div>
                </div>
              </div>

              {/* Performance graph */}
              <div className="rounded-[18px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Performance Trends</h4>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
                    ▲ 12%
                  </span>
                </div>
                <svg viewBox="0 0 320 160" className="w-full" aria-hidden="true">
                  <defs>
                    <linearGradient id="perfArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[40, 80, 120].map((y) => (
                    <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                  ))}
                  <path
                    d="M0,130 C25,126 40,118 60,120 C85,122 95,100 120,104 C145,108 155,84 180,86 C205,88 215,64 240,68 C265,72 280,48 320,40 L320,160 L0,160 Z"
                    fill="url(#perfArea)"
                  />
                  <path
                    d="M0,130 C25,126 40,118 60,120 C85,122 95,100 120,104 C145,108 155,84 180,86 C205,88 215,64 240,68 C265,72 280,48 320,40"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0,140 C25,138 40,132 60,128 C85,130 95,120 120,116 C145,118 155,102 180,98 C205,100 215,84 240,78 C265,74 280,64 320,58"
                    fill="none"
                    stroke="#14B8A6"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                  />
                  <circle cx="240" cy="68" r="4" fill="#2563EB" stroke="#fff" strokeWidth="2" />
                </svg>
                <div className="mt-3 flex items-center gap-4 text-[11px] font-medium text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-4 rounded-full bg-[#2563EB]" /> Current Term
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-4 rounded-full border-2 border-dashed border-[#14B8A6]" /> Predicted
                  </span>
                </div>
                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500">Projected completion rate</span>
                    <span className="font-bold text-emerald-600">87.4%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-[87.4%] rounded-full bg-gradient-to-r from-[#10B981] to-[#14B8A6]" />
                  </div>
                </div>
              </div>

              {/* Student list */}
              <div className="rounded-[18px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Students</h4>
                  <button className="text-[11px] font-semibold text-[#2563EB] hover:underline">
                    View all
                  </button>
                </div>
                <div className="space-y-4">
                  {[
                    { name: "Sarah Johnson", dept: "Computer Science", grade: "A-", risk: "Low", riskColor: "bg-emerald-50 text-emerald-700", avatar: "bg-emerald-100 text-emerald-600" },
                    { name: "Michael Chen", dept: "Mathematics", grade: "C+", risk: "Medium", riskColor: "bg-amber-50 text-amber-700", avatar: "bg-amber-100 text-amber-600" },
                    { name: "Emma Rodriguez", dept: "Physics", grade: "D+", risk: "High", riskColor: "bg-red-50 text-red-700", avatar: "bg-red-100 text-red-600" },
                  ].map((student) => (
                    <div key={student.name} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${student.avatar}`}
                        >
                          {student.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                          <p className="text-[11px] text-slate-400">{student.dept}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-slate-700">{student.grade}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${student.riskColor}`}>
                          {student.risk}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Prediction panel */}
                <div className="mt-5 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] p-4 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-100">Next prediction batch</span>
                    <Brain className="h-4 w-4 text-blue-200" />
                  </div>
                  <p className="mt-1.5 text-lg font-extrabold">7 days</p>
                  <p className="text-[11px] leading-snug text-blue-200">
                    New risk assessments will be generated for 1,204 students.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  Benefits                                                           */
/* ------------------------------------------------------------------ */

const BENEFITS = [
  "Improve student retention",
  "Detect risks early",
  "Save faculty time",
  "AI-assisted decision making",
  "Real-time monitoring",
  "Accurate performance predictions",
];

const BenefitsSection = () => (
  <section id="about" className="bg-white py-24">
    <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
      {/* Illustration */}
      <div className="relative order-2 lg:order-1">
        <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-blue-100/50 via-indigo-50/40 to-teal-100/40 blur-2xl" />
        <div className="relative rounded-[22px] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-900/10">
          {/* Floating chart card */}
          <div className="rounded-2xl border border-slate-100 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Intervention Impact</p>
                <p className="text-[11px] text-slate-400">Students supported this semester</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                ▲ 18%
              </span>
            </div>
            <div className="flex h-40 items-end justify-between gap-3">
              {[35, 48, 42, 60, 55, 74, 82].map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      i === 6
                        ? "bg-gradient-to-t from-[#1E3A8A] to-[#2563EB]"
                        : "bg-blue-100"
                    }`}
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[9px] font-medium text-slate-400">
                    {["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Educator review card */}
          <div className="mt-4 rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["bg-blue-100 text-[#1E3A8A]", "bg-emerald-100 text-[#10B981]", "bg-amber-100 text-[#F59E0B]"].map(
                  (c, i) => (
                    <div
                      key={i}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold ${c}`}
                    >
                      {["JD", "KM", "AR"][i]}
                    </div>
                  )
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Faculty Reviews</p>
                <p className="text-[11px] text-slate-400">3 educators reviewing analytics</p>
              </div>
              <div className="ml-auto">
                <div className="flex items-center gap-1 text-[#F59E0B]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-1 text-right text-[11px] font-semibold text-slate-500">4.9/5 rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="order-1 lg:order-2">
        <SectionBadge>Why Institutions Choose Us</SectionBadge>
        <SectionTitle>Empower Educators with Data-Driven Confidence</SectionTitle>
        <SectionSubtitle>
          Our platform transforms raw academic data into clear, actionable intelligence — helping
          faculty and administrators make better decisions, faster.
        </SectionSubtitle>

        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="group flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-100 hover:bg-white hover:shadow-lg hover:shadow-emerald-900/5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#10B981] transition-transform duration-300 group-hover:scale-110">
                <CheckCircle2 className="h-[1.125rem] w-[1.125rem]" />
              </span>
              <span className="text-sm font-semibold text-slate-700">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  Testimonials                                                       */
/* ------------------------------------------------------------------ */

const TESTIMONIALS = [
  {
    quote:
      "AI EduPredict transformed how we support at-risk students. Our retention rate improved by 12% within the first two semesters of using the platform.",
    name: "Dr. Jennifer Adams",
    role: "Dean of Academic Affairs",
    institution: "Westfield University",
    initials: "JA",
    color: "bg-blue-100 text-[#1E3A8A]",
  },
  {
    quote:
      "The early warning alerts are a game changer. We can now intervene weeks before a student's performance declines, instead of after the fact.",
    name: "Marcus Thompson",
    role: "Director of Student Success",
    institution: "Riverside College",
    initials: "MT",
    color: "bg-emerald-100 text-[#10B981]",
  },
  {
    quote:
      "The dashboard gives our faculty a complete picture of every student in seconds. It's the most intuitive analytics tool we've ever used in higher ed.",
    name: "Dr. Priya Sharma",
    role: "Vice Provost",
    institution: "Northbridge Institute",
    initials: "PS",
    color: "bg-amber-100 text-[#F59E0B]",
  },
];

const TestimonialsSection = () => (
  <section className="bg-[#F6F8FC] py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <SectionBadge>Testimonials</SectionBadge>
        <SectionTitle>Trusted by Educational Leaders</SectionTitle>
        <SectionSubtitle>
          Hear from the deans, directors, and administrators who use AI EduPredict to improve
          academic outcomes every day.
        </SectionSubtitle>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <figure
            key={t.name}
            className="flex flex-col rounded-[18px] border border-slate-200 bg-white p-8 shadow-[0_10px_30px_-12px_rgb(15_23_42/0.12)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_-12px_rgb(37_99_235/0.18)]"
          >
            <div className="flex items-center gap-1 text-[#F59E0B]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <blockquote className="mt-5 flex-1 leading-relaxed text-slate-600">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-7 flex items-center gap-4 border-t border-slate-100 pt-6">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${t.color}`}
              >
                {t.initials}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-400">{t.role}</p>
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB]">
                  <GraduationCap className="h-3 w-3" />
                  {t.institution}
                </p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  CTA                                                                */
/* ------------------------------------------------------------------ */

const CTASection = () => (
  <section className="bg-white py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#14B8A6] px-8 py-16 text-center shadow-2xl shadow-blue-900/30 sm:px-16 lg:py-20">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute right-1/4 top-0 h-40 w-40 rounded-full bg-white/5 blur-xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Start Today
          </span>
          <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            Ready to Transform Student Success?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
            Join educational institutions using AI to improve academic outcomes.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/register-user"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-[#1E3A8A] shadow-xl shadow-blue-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Start Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20"
            >
              <Play className="h-4 w-4" />
              Schedule Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: ["Features", "Dashboard", "Pricing", "Integrations", "Changelog", "Roadmap"],
  },
  {
    title: "Resources",
    links: ["Documentation", "API Reference", "Case Studies", "Blog", "Help Center", "Community"],
  },
  {
    title: "Company",
    links: ["About Us", "Careers", "Press", "Partners", "Contact", "Privacy Policy"],
  },
];

const Footer = () => (
  <footer id="contact" className="border-t border-slate-100 bg-white">
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
        {/* Brand */}
        <div className="lg:col-span-2">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white shadow-lg shadow-blue-700/25">
              <GraduationCap className="h-[1.375rem] w-[1.375rem]" strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <span className="block text-[17px] font-bold tracking-tight text-slate-900">AI EduPredict</span>
              <span className="block text-[11px] font-medium uppercase tracking-widest text-slate-400">
                Student Success AI
              </span>
            </div>
          </a>
          <p className="mt-5 max-w-sm leading-relaxed text-slate-500">
            AI-powered student performance prediction and analytics for educational institutions
            committed to student success.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#2563EB] hover:bg-blue-50 hover:text-[#2563EB]"
              aria-label="Twitter"
            >
              <Twitter className="h-[1.125rem] w-[1.125rem]" />
            </a>
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#2563EB] hover:bg-blue-50 hover:text-[#2563EB]"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-[1.125rem] w-[1.125rem]" />
            </a>
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#2563EB] hover:bg-blue-50 hover:text-[#2563EB]"
              aria-label="YouTube"
            >
              <Youtube className="h-[1.125rem] w-[1.125rem]" />
            </a>
          </div>
        </div>

        {/* Link columns */}
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">{col.title}</h4>
            <ul className="mt-5 space-y-3">
              {col.links.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-slate-500 transition-colors duration-200 hover:text-[#2563EB]"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row">
        <p className="text-sm text-slate-400">
          &copy; {new Date().getFullYear()} AI EduPredict. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <a href="#" className="text-sm text-slate-400 transition-colors hover:text-slate-600">
            Privacy Policy
          </a>
          <a href="#" className="text-sm text-slate-400 transition-colors hover:text-slate-600">
            Terms of Service
          </a>
          <a href="#" className="text-sm text-slate-400 transition-colors hover:text-slate-600">
            Security
          </a>
        </div>
      </div>
    </div>
  </footer>
);

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <DashboardPreviewSection />
        <BenefitsSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}