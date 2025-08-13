"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionTemplate } from "framer-motion";
import { useAppDispatch } from "@/components/reduxHooks";
import { setHarvesting } from "@/components/UISlice";
import { Poppins } from "next/font/google";

// Font import
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

// Custom hook: Count-up animation
function useCountUp(isVisible: boolean, target: number, duration = 1800) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    const start = performance.now();

    function animate(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.floor(progress * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isVisible, target, duration]);

  return value;
}

// Custom hook: Fire only once when element is in view
function useInViewOnce(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current || inView) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    }, options);

    io.observe(ref.current!);
    return () => io.disconnect();
  }, [options, inView]);

  return { ref, inView };
}

// Color palette
const colors = {
  emerald: "#064e3b",
  emeraldDarker: "#022c22",
  aqua: "#06b6d4",
  yellow: "#fbbf24",
  offwhite: "#f8fafc",
};

// Page background gradient
const gradientBg =
  "bg-[radial-gradient(1200px_600px_at_70%_-10%,rgba(6,182,212,0.35),transparent_60%),radial-gradient(800px_400px_at_10%_10%,rgba(251,191,36,0.28),transparent_60%),linear-gradient(180deg,#043C35_0%,#032722_45%,#000000_100%)]";

export default function Home() {
  const dispatch = useAppDispatch();
  const [active, setActive] = useState("Front");

  // Navbar animation on scroll
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.05], [0.4, 1]);
  const headerBlur = useTransform(scrollYProgress, [0, 0.05], [0, 10]);
  const headerBackdropFilter = useMotionTemplate`blur(${headerBlur}px)`;

  // Section observer for navbar highlight
  useEffect(() => {
    const sections = ["Front", "Stats", "Process", "Footer"];
    const observers: IntersectionObserver[] = [];

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { rootMargin: "-40% 0px -55% 0px", threshold: [0, 0.5, 1] }
      );
      io.observe(el);
      observers.push(io);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Navbar items
  const navItems = useMemo(
    () => [
      { id: "Process", label: "Process" },
      { id: "Stats", label: "Stats" },
      { id: "Footer", label: "Connect" },
    ],
    []
  );

  // Utility: Smooth scroll to section
  const smoothScrollTo = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  // Stats section hooks
  const { ref: statsRef, inView: statsInView } = useInViewOnce();
  const energy = useCountUp(statsInView, 3245);
  const co2 = useCountUp(statsInView, 11398587);
  const savings = useCountUp(statsInView, 1567);

  return (
    <main className={`${poppins.className} ${gradientBg} text-white min-h-screen`}>
      {/* Navbar */}
      <motion.header
        style={{ opacity: headerOpacity, backdropFilter: headerBackdropFilter as any }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
      >
        <nav className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/20 px-4 py-2 shadow-2xl backdrop-blur-lg">
          <button
            onClick={() => smoothScrollTo("Front")}
            className={`text-xs sm:text-sm px-3 py-1 rounded-xl transition font-semibold ${
              active === "Front" ? "bg-white/30" : "hover:bg-white/20"
            }`}
          >
            Neolectra
          </button>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => smoothScrollTo(item.id)}
              className={`text-xs sm:text-sm px-3 py-1 rounded-xl transition font-semibold ${
                active === item.id ? "bg-white/30" : "hover:bg-white/20"
              }`}
            >
              {item.label}
            </button>
          ))}
          <Link href="/map" className="ml-2">
            <button className="text-xs sm:text-sm px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 transition shadow-lg">
              Explore Map
            </button>
          </Link>
          <Link href="/suggestions" className="ml-2">
            <button className="text-xs sm:text-sm px-3 py-1 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-300 hover:to-orange-300 transition shadow-lg">
              View Suggestions
            </button>
          </Link>
        </nav>
      </motion.header>

      {/* HERO */}
      <section id="Front" className="relative h-[100vh] flex items-center justify-center overflow-hidden">
        <video className="absolute inset-0 w-full h-full object-cover brightness-110 contrast-110" muted autoPlay loop playsInline src="/hero_video.mp4" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-cyan-400/30 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-yellow-300/20 blur-3xl animate-pulse" />

        <div className="relative z-10 mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight bg-gradient-to-r from-emerald-300 via-cyan-300 to-yellow-300 bg-clip-text text-transparent animate-[shimmer_3s_infinite]"
          >
            Power Tomorrow with Sun & Rain
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8 }}
            className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-white/90"
          >
            Smart solar planning and rainwater harvesting—designed for impact, optimized by data, and beautiful on any rooftop.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.8 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
          <Link href="/userinput">
            <button className="group rounded-2xl border border-emerald-300/60 bg-emerald-400/30 px-6 py-3 text-sm font-semibold backdrop-blur-md hover:-translate-y-0.5 hover:bg-emerald-400/40 transition shadow-lg hover:shadow-emerald-400/40">
              ☀️ Solar Setup <span className="ml-2 inline-block group-hover:translate-x-1 transition">→</span>
            </button>
          </Link>

          <Link href="/map" onClick={() => dispatch(setHarvesting(false))}>
            <button className="group rounded-2xl border border-emerald-300/60 bg-emerald-400/30 px-6 py-3 text-sm font-semibold backdrop-blur-md hover:-translate-y-0.5 hover:bg-emerald-400/40 transition shadow-lg hover:shadow-emerald-400/40">
              🗺️ Solar Map <span className="ml-2 inline-block group-hover:translate-x-1 transition">→</span>
            </button>
          </Link>            <Link href="/map" onClick={() => dispatch(setHarvesting(true))}>
              <button className="group rounded-2xl border border-cyan-300/60 bg-cyan-400/30 px-6 py-3 text-sm font-semibold backdrop-blur-md hover:-translate-y-0.5 hover:bg-cyan-400/40 transition shadow-lg hover:shadow-cyan-400/40">
                💧 Rainwater Harvesting <span className="ml-2 inline-block group-hover:translate-x-1 transition">→</span>
              </button>
            </Link>

            <Link href="/rainwater-input">
              <button className="group rounded-2xl border border-blue-300/60 bg-blue-400/30 px-6 py-3 text-sm font-semibold backdrop-blur-md hover:-translate-y-0.5 hover:bg-blue-400/40 transition shadow-lg hover:shadow-blue-400/40">
                🏠 RWH Setup <span className="ml-2 inline-block group-hover:translate-x-1 transition">→</span>
              </button>
            </Link>

            <Link href="/suggestions">
              <button className="group rounded-2xl border border-yellow-300/60 bg-yellow-400/30 px-6 py-3 text-sm font-semibold backdrop-blur-md hover:-translate-y-0.5 hover:bg-yellow-400/40 transition shadow-lg hover:shadow-yellow-400/40">
                🛒 Equipment Guide <span className="ml-2 inline-block group-hover:translate-x-1 transition">→</span>
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section id="Stats" className="relative py-24 md:py-28 pb-16">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-950/30 via-transparent to-cyan-900/20" />
        <div ref={statsRef} className="mx-auto max-w-6xl px-6">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
            className="text-center text-3xl sm:text-4xl font-extrabold"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-emerald-200 to-cyan-200">
              Real-time Impact
            </span>
          </motion.h2>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                id: "energy",
                label: "Solar Energy Generated Today",
                value: `${energy.toLocaleString()} KW`,
              },
              {
                id: "co2",
                label: "CO₂ Emissions This Year",
                value: `${co2.toLocaleString()} KT`,
              },
              {
                id: "savings",
                label: "Solar Energy Savings Today",
                value: `${savings.toLocaleString()} KW`,
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md shadow-xl hover:shadow-2xl hover:shadow-emerald-600/10"
              >
                <div className="text-4xl font-extrabold tracking-tight drop-shadow-sm">
                  <span className="[text-shadow:0_0_20px_rgba(6,182,212,0.5)]">{stat.value}</span>
                </div>
                <p className="mt-2 text-sm text-white/80">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solar Animation Section */}
      <section className="relative py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-200 via-cyan-200 to-yellow-200 bg-clip-text text-transparent mb-4">
              Solar Panel Technology
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Watch how solar panels harness sunlight and convert it into clean electricity for your home
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="rounded-3xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 p-8 shadow-2xl"
          >
            <div className="aspect-video w-full max-w-3xl mx-auto">
              <iframe 
                src="https://lottie.host/embed/51b67322-2882-42b5-9ad4-326a1b8a08ac/SqulRXHZnI.lottie"
                className="w-full h-full rounded-2xl"
                style={{ border: 'none' }}
                title="Solar Panel Animation"
              />
            </div>
          </motion.div>
        </div>
      </section>
        
 

      {/* PROCESS */}
      <section id="Process" className="relative py-24 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
            className="text-center text-3xl sm:text-4xl font-extrabold"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 via-cyan-200 to-yellow-200">
              Our Process
            </span>
          </motion.h2>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5 }}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl hover:shadow-emerald-600/20 hover:translate-y-[-2px] transition"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/20 ring-1 ring-emerald-300/30">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">Smart Site Assessment</h3>
              <p className="mt-2 text-sm text-white/80">
                Enter your address to get a data-driven rooftop analysis and the ideal solar configuration for your energy goals.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl hover:shadow-cyan-600/20 hover:translate-y-[-2px] transition"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/20 ring-1 ring-cyan-300/30">
                <span className="text-2xl">🔧</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">Best Vendors & Hardware</h3>
              <p className="mt-2 text-sm text-white/80">
                Compare top-rated panels and components optimized for efficiency, reliability, and total cost of ownership.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl hover:shadow-yellow-600/20 hover:translate-y-[-2px] transition"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/20 ring-1 ring-yellow-300/30">
                <span className="text-2xl">💸</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">Finance & Net Metering</h3>
              <p className="mt-2 text-sm text-white/80">
                Unlock incentives, rebates, and easy financing; we guide your net-metering setup to maximize savings.
              </p>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="my-14 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />

          {/* Rainwater Row */}
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5 }}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl hover:shadow-cyan-600/20 hover:translate-y-[-2px] transition"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/20 ring-1 ring-cyan-300/30">
                <span className="text-2xl">💧</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">Harvest Potential</h3>
              <p className="mt-2 text-sm text-white/80">
                Analyze rooftop area & local precipitation to estimate yield and optimal storage placement.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl hover:shadow-emerald-600/20 hover:translate-y-[-2px] transition"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/20 ring-1 ring-emerald-300/30">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">Design & Monitoring</h3>
              <p className="mt-2 text-sm text-white/80">
                Tailored system design plus smart sensors and dashboards for seamless ongoing management.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl hover:shadow-yellow-600/20 hover:translate-y-[-2px] transition"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/20 ring-1 ring-yellow-300/30">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">Economics & Benefits</h3>
              <p className="mt-2 text-sm text-white/80">
                Evaluate payback, ROI and environmental gains; navigate subsidies with clear guidance.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <section id="Footer" className="relative">
        <footer className="border-t border-white/10 bg-black/60 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <h3 className="text-sm md:text-base font-semibold text-white/90">neolectra@gmail.com</h3>
              <ul className="flex items-center gap-4">
                <li>
                  <a href="#" aria-label="Instagram" className="rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition">
                    <img src="/images/instagram.png" alt="Instagram" className="h-6 w-6" />
                  </a>
                </li>
                <li>
                  <a href="#" aria-label="Facebook" className="rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition">
                    <img src="/images/facebook.png" alt="Facebook" className="h-6 w-6" />
                  </a>
                </li>
                <li>
                  <a href="#" aria-label="LinkedIn" className="rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition">
                    <img src="/images/linkedin.png" alt="LinkedIn" className="h-6 w-6" />
                  </a>
                </li>
              </ul>
              <p className="text-xs text-white/60">© {new Date().getFullYear()} Neolectra India</p>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}