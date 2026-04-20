import { ArrowRight } from "lucide-react";
import { Space_Grotesk } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export default function LandingPage() {
  return (
    <div
      className={`${spaceGrotesk.className} min-h-screen bg-[#09090B] text-[#FAFAFA] overflow-x-hidden selection:bg-[#DFE104] selection:text-black`}
    >
      {/* Noise Texture Overlay */}
      <svg
        className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.03] mix-blend-overlay"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="4"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>

      {/* Minimal Navbar */}
      <nav className="fixed top-0 w-full flex justify-between items-center p-8 z-40 bg-[#09090B]/80 backdrop-blur-sm border-b-2 border-[#3F3F46]">
        <div className="flex items-center gap-2">
          <Image
            src="/rampup-logo.png"
            alt="RampUP"
            width={32}
            height={32}
            className="rounded-none object-contain invert brightness-0"
          />
          <span className="text-xl font-bold uppercase tracking-tighter">RampUP</span>
        </div>
        <Link
          href="/sign-in"
          className="uppercase tracking-tighter font-bold border-2 border-[#3F3F46] px-6 py-2 hover:bg-[#FAFAFA] hover:text-black transition-all duration-300"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-4 md:px-12 max-w-[95vw] mx-auto flex flex-col justify-center min-h-[90vh]">
        <div className="absolute top-32 right-12 text-[12rem] md:text-[20rem] font-bold text-[#27272A] leading-none select-none -z-10 tracking-tighter">
          01
        </div>

        <h1 className="text-[clamp(3rem,12vw,14rem)] font-bold uppercase leading-[0.85] tracking-tighter mb-8 max-w-[90vw]">
          Hire <br />
          <span className="text-[#DFE104]">Without</span> <br />
          Hesitation.
        </h1>

        <p className="text-xl md:text-2xl text-[#A1A1AA] max-w-2xl font-medium leading-tight mb-12">
          Automate your technical interviews with our brutal, precision AI evaluator. Stop guessing.
          Start knowing. Scale your engineering pipeline 10x faster.
        </p>

        <Link
          href="/sign-up"
          className="group uppercase tracking-tighter font-bold bg-[#DFE104] text-black w-fit h-16 px-10 border-2 border-[#DFE104] flex items-center justify-center text-xl hover:scale-105 active:scale-95 transition-all duration-300"
        >
          Start For Free
          <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
        </Link>
      </section>

      {/* Marquee Section (Energy) */}
      <section className="py-20 border-y-2 border-[#3F3F46] bg-[#DFE104] text-black overflow-hidden flex whitespace-nowrap">
        <div className="animate-marquee flex items-center">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center mx-8">
              <span className="text-7xl font-bold uppercase tracking-tighter">300% ROI</span>
              <span className="text-7xl mx-8 font-bold">•</span>
              <span className="text-7xl font-bold uppercase tracking-tighter">10X FASTER</span>
              <span className="text-7xl mx-8 font-bold">•</span>
              <span className="text-7xl font-bold uppercase tracking-tighter">ZERO BIAS</span>
              <span className="text-7xl mx-8 font-bold">•</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid (Vertical overlapping) */}
      <section className="py-32 px-4 md:px-12 max-w-[95vw] mx-auto relative">
        <div className="absolute top-20 left-12 text-[12rem] md:text-[20rem] font-bold text-[#27272A] leading-none select-none -z-10 tracking-tighter">
          02
        </div>

        <h2 className="text-5xl md:text-8xl font-bold uppercase tracking-tighter mb-24 max-w-4xl">
          The Machine Doesn't Sleep.
        </h2>

        <div className="flex flex-col gap-16 relative">
          <div className="sticky top-32 group border-2 border-[#3F3F46] bg-[#09090B] p-8 md:p-16 transition-colors duration-300 hover:bg-[#DFE104] hover:border-[#DFE104]">
            <h3 className="text-3xl md:text-6xl font-bold uppercase tracking-tight mb-6 group-hover:text-black transition-colors duration-300">
              Autonomous Voice Interviews
            </h3>
            <p className="text-lg md:text-2xl text-[#A1A1AA] max-w-3xl group-hover:text-black/80 transition-colors duration-300">
              Drop a link. Let candidates take the interview on their schedule. Our voice agent asks
              dynamic follow-up questions in real-time, completely mirroring a senior engineer's
              probing logic.
            </p>
          </div>

          <div className="sticky top-40 group border-2 border-[#3F3F46] bg-[#09090B] p-8 md:p-16 transition-colors duration-300 hover:bg-[#DFE104] hover:border-[#DFE104]">
            <h3 className="text-3xl md:text-6xl font-bold uppercase tracking-tight mb-6 group-hover:text-black transition-colors duration-300">
              Savage Honesty Analytics
            </h3>
            <p className="text-lg md:text-2xl text-[#A1A1AA] max-w-3xl group-hover:text-black/80 transition-colors duration-300">
              Get an immediate score out of 100. We highlight exactly where candidates hesitated,
              where they faked knowledge, and where they proved competence. No fluff.
            </p>
          </div>

          <div className="sticky top-48 group border-2 border-[#3F3F46] bg-[#09090B] p-8 md:p-16 transition-colors duration-300 hover:bg-[#DFE104] hover:border-[#DFE104]">
            <h3 className="text-3xl md:text-6xl font-bold uppercase tracking-tight mb-6 group-hover:text-black transition-colors duration-300">
              Infinite Scale Pipeline
            </h3>
            <p className="text-lg md:text-2xl text-[#A1A1AA] max-w-3xl group-hover:text-black/80 transition-colors duration-300">
              Process 1 candidate or 10,000 simultaneously. Your hiring velocity instantly matches
              your ambition. We handle the heavy lifting while you cherry-pick the elite.
            </p>
          </div>
        </div>
      </section>

      {/* Action Marquee */}
      <section className="py-12 border-y-2 border-[#3F3F46] overflow-hidden flex whitespace-nowrap bg-[#27272A] text-[#FAFAFA]">
        <div className="animate-marquee-slow flex items-center">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center mx-8">
              <span className="text-4xl font-bold uppercase tracking-tighter">
                OVER 10,000 INTERVIEWS CONDUCTED
              </span>
              <span className="text-4xl mx-8 font-bold">/</span>
              <span className="text-4xl font-bold uppercase tracking-tighter">
                98% ACCURACY MATCH RATE
              </span>
              <span className="text-4xl mx-8 font-bold">/</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-48 px-4 md:px-12 flex flex-col items-center justify-center text-center bg-[#DFE104] text-black">
        <h2 className="text-6xl md:text-[clamp(4rem,10vw,12rem)] font-bold uppercase leading-[0.8] tracking-tighter mb-12">
          Your Next <br /> Hire Is Waiting.
        </h2>
        <Link
          href="/sign-up"
          className="uppercase tracking-tighter font-bold border-4 border-black px-12 py-6 text-3xl hover:bg-black hover:text-[#FAFAFA] transition-all duration-300"
        >
          Initialize Agent
        </Link>
      </footer>
    </div>
  );
}
