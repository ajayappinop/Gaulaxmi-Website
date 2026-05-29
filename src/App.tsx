import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import logo from "./assets/gaulaxmi-logo.png";
import heroCow from "./assets/hero-cow.png";
import products from "./assets/images/cow_products_studio_1779970801272.png";
import farm from "./assets/farm.jpg";
import btxToken from "./assets/images/btx_token_logo_1779969091643.png";
import tradingIncomeImg from "./assets/images/trading_income_chart_1779969516816.png";
import realEstateImg from "./assets/images/real_estate_luxury_1779969905480.png";
import gheeJarImg from "./assets/images/ghee_jar_1779972795361.png";
import milkBottleImg from "./assets/images/milk_bottle_1779972816200.png";
import incenseSticksImg from "./assets/images/incense_sticks_1779972836448.png";
import cowProductsPackImg from "./assets/images/cow_products_pack_1779970125307.png";
import {
  Milk,
  Coins,
  TrendingUp,
  Building2,
  Shield,
  Sparkles,
  Phone,
  Mail,
  Globe,
  ArrowRight,
  Check,
  Leaf,
  Handshake,
  Users,
  Smartphone,
  Flower2,
  Activity,
  Heart,
  Flame,
  Music,
  Droplet,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Send,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileDown,
  Menu,
  X
} from "lucide-react";

const containerClass = "max-w-7xl mx-auto px-4 sm:px-6";
const sectionY = "py-16 sm:py-20 lg:py-24";
const sectionTagClass =
  "inline-flex items-center rounded-full bg-[#f2e2c9] px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] sm:tracking-[0.24em] text-[#9a5f23] mb-4 sm:mb-6";
const sectionHeadingClass =
  "text-[1.75rem] sm:text-[2.5rem] md:text-[44px] leading-[1.15] sm:leading-[1.08] text-[rgba(44,26,14,1)] font-display font-semibold text-balance";
const sectionParagraphClass = "mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-[#8f5f3a] leading-relaxed";
const ctaGradientClass =
  "bg-[linear-gradient(90deg,#9a4f12_0%,#7a3d0d_55%,#6a3208_100%)] text-white shadow-md hover:scale-[1.02] transition-all";

const navLinks = [
  { href: "#about", label: "About" },
  { href: "#why", label: "Why Gaulaxmi" },
  { href: "#income", label: "Income" },
  { href: "#plans", label: "Plans" },
  { href: "#calculator", label: "Calculator" },
  { href: "#bonus", label: "Bonus" },
  { href: "#join-form", label: "Contact" },
];

function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleNavClick = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    closeMenu();
    const id = href.replace("#", "");
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", href);
    } else if (href === "#top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.pushState(null, "", "#top");
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-[100]">
      <div className="backdrop-blur-md bg-background/95 border-b border-border/50">
        <div className={`${containerClass} h-14 sm:h-16 flex items-center justify-between gap-3`}>
          <a href="#top" className="flex items-center gap-2 min-w-0 relative z-10" onClick={handleNavClick("#top")}>
            <img src={logo} alt="Gaulaxmi" className="h-9 w-9 sm:h-10 sm:w-10 object-contain shrink-0" referrerPolicy="no-referrer" />
            <div className="leading-tight min-w-0">
              <div className="font-display text-base sm:text-lg text-primary font-bold truncate">Gaulaxmi</div>
              <div className="text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.25em] text-muted-foreground uppercase truncate">Global Wellness</div>
            </div>
          </a>
          <nav className="hidden lg:flex items-center gap-5 xl:gap-6">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-foreground/80 hover:text-accent transition-colors whitespace-nowrap">{l.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative z-10">
            <a href="#contact" className="hidden sm:inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium hover:bg-accent transition-all shadow-soft hover:scale-105">
              Invest Now <ArrowRight className="w-4 h-4" />
            </a>
            <button
              type="button"
              className="lg:hidden w-10 h-10 rounded-full border border-border flex items-center justify-center text-primary bg-card/80 cursor-pointer"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden absolute left-0 right-0 top-full border-t border-border/50 bg-background shadow-lg"
          >
            <nav className={`${containerClass} py-4 flex flex-col gap-1 relative z-[100]`} aria-label="Mobile navigation">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={handleNavClick(l.href)}
                  className="relative z-10 block py-3 px-3 rounded-xl text-sm font-medium text-foreground/90 hover:bg-secondary/60 active:bg-secondary transition-colors cursor-pointer touch-manipulation"
                >
                  {l.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={handleNavClick("#contact")}
                className="relative z-10 mt-2 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full text-sm font-semibold cursor-pointer touch-manipulation"
              >
                Invest Now <ArrowRight className="w-4 h-4" />
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

interface FlyingParticle {
  id: number;
  char: string;
  x: number;
}

function Hero() {
  return (
    <section id="top" className="relative min-h-screen flex items-center overflow-hidden isolate bg-[#1c120c]">
      {/* Background image with slow Ken Burns zoom shifted to the right */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroCow}
          alt="Sacred Gir cow at golden hour"
          width={1920}
          height={1080}
          className="w-full h-full object-cover object-right sm:object-[85%_center] animate-zoom-slow opacity-90 scale-x-[-1]"
          referrerPolicy="no-referrer"
        />
        {/* Layered gradient overlays for legibility + warmth - fading completely to transparent on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-bark via-bark/90 md:via-bark/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-bark/90 via-transparent to-bark/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,oklch(0.78_0.13_75/0.25),transparent_55%)]" />
      </div>

      {/* Floating ornamental glows */}
      <div className="absolute top-16 right-4 sm:top-20 sm:right-10 w-40 h-40 sm:w-72 sm:h-72 rounded-full bg-gradient-gold opacity-20 blur-3xl animate-float -z-10 pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 sm:left-1/3 w-56 h-56 sm:w-96 sm:h-96 rounded-full bg-accent/15 blur-3xl animate-float delay-300 -z-10 pointer-events-none" />

      {/* Main Container styled for full-screen hero text presentation with high-contrast placement */}
      <div className={`relative ${containerClass} py-20 sm:py-24 lg:py-28 w-full`}>
        <div className="max-w-3xl text-cream flex flex-col justify-center">
          
          {/* Elegant Welcome Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex self-start items-center gap-2 backdrop-blur-md bg-cream/10 border border-cream/20 rounded-full px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs tracking-[0.12em] sm:tracking-[0.2em] uppercase text-cream/90 mb-5 sm:mb-6 hover:bg-cream/20 transition-all cursor-default max-w-full"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold animate-spin-slow shrink-0" /> 
            <span className="leading-snug">Multi-Income · Cow-Backed Wealth</span>
          </motion.div>

          {/* Typography Heading with custom character stagger */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="font-display text-[2rem] min-[480px]:text-4xl sm:text-5xl lg:text-[72px] text-balance leading-[1.08] sm:leading-[1.05] font-bold"
          >
            Where the{" "}
            <span className="text-gold bg-gradient-to-r from-gold via-cream to-gold bg-clip-text text-transparent animate-shimmer font-display font-bold">
              sacred Gir cow
            </span>{" "}
            multiplies your wealth.
          </motion.h1>

          {/* Sub-text paragraph with fluid delay animate */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="mt-6 text-[17px] md:text-[19px] font-light text-cream/90 leading-relaxed text-balance"
          >
            Gaulaxmi seamlessly unites timeless rural heritage with digital multi-income engines. Earn a fully structured{" "}
            <span className="text-gold font-semibold bg-cream/10 px-2 py-0.5 rounded-md border border-gold/20 inline-block">5% passive monthly ROI</span> safely for 60 months, backed by high-yield organic assets, token growth, and physical dairy allocations.
          </motion.p>

          {/* Interactive Call to Action buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center"
          >
            <a
              href="#plans"
              className="group inline-flex items-center justify-center gap-2 bg-gradient-gold text-bark px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold shadow-deep hover:scale-[1.04] transition-all duration-300 animate-pulse-glow text-sm sm:text-base"
            >
              Explore Active Tiers
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                const pdfContent = `%PDF-1.4\n1 0 obj < < /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj < < /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj < < /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 595 842] /Contents 4 0 R >> endobj\n4 0 obj < < /Length 195 >> stream\nBT\n/F1 18 Tf\n50 780 Td\n(Gaulaxmi Global Wellness) Tj\n0 -30 Td\n/F1 12 Tf\n(Corporate Presentation & Executive Project Report) Tj\n0 -40 Td\n(Welcome to Gaulaxmi. This document acts as your overview.) Tj\n0 -25 Td\n(Timeless heritage meets multi-income yield engines.) Tj\n0 -25 Td\n(Secured passive monthly ROI of 5% for 60 months.) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000282 00000 n \ntrailer < < /Size 5 /Root 1 0 R >>\nstartxref\n549\n%%EOF`;
                const blob = new Blob([pdfContent], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "Gaulaxmi_Corporate_Presentation.pdf";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center justify-center gap-2 backdrop-blur-md bg-cream/10 border border-cream/35 text-cream px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-medium hover:bg-cream/20 transition-all duration-300 text-sm sm:text-base"
            >
              <FileDown className="w-4 h-4 text-gold shrink-0" />
              Download Full PDF
            </a>
          </motion.div>

          {/* Staggered animated badges on sub-hero status block */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.65 }}
            className="mt-10 sm:mt-14 grid grid-cols-1 min-[420px]:grid-cols-3 gap-5 sm:gap-6 border-t border-cream/20 pt-6 sm:pt-8"
          >
            {[
              { v: "5.0%", l: "Assured Monthly return", s: "Every 30 Days" },
              { v: "60 Mo.", l: "Sustained Wealth loop", s: "Complete Tenure" },
              { v: "100%", l: "Tangible Cow Backing", s: "Heritage Assets" },
            ].map((s, idx) => (
              <div key={s.l} className="border-l border-gold/50 pl-4 hover:border-cream transition-colors min-[420px]:border-l max-[419px]:border-l-0 max-[419px]:pl-0 max-[419px]:pt-4 max-[419px]:border-t max-[419px]:border-gold/30 first:max-[419px]:pt-0 first:max-[419px]:border-t-0">
                <span className="block font-display text-3xl sm:text-4xl text-gold font-bold leading-none">{s.v}</span>
                <span className="block text-[10px] sm:text-[11px] uppercase tracking-[0.12em] sm:tracking-[0.15em] text-cream/70 mt-1.5 font-semibold">
                  {s.l}
                </span>
                <span className="block text-[8px] tracking-[0.05em] text-cream/40 mt-0.5">
                  {s.s}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll hint absolute overlay */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-cream/60 text-[10px] uppercase tracking-[0.3em] animate-fade-in delay-500 flex flex-col items-center gap-2 pointer-events-none">
        <span>Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-cream/60 to-transparent animate-float" />
      </div>
    </section>
  );
}


function About() {
  return (
    <section id="about" className={`${sectionY} bg-gradient-warm animate-fade-in`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <div className={sectionTagClass}>Our Vision</div>
        <h2 className={`${sectionHeadingClass} max-w-3xl mx-auto`}>
          A 5-year plan that grows like a tree — rooted in soil, branching into markets.
        </h2>
        <p className={`${sectionParagraphClass} max-w-2xl mx-auto`}>
          Gaulaxmi is a multi-income platform combining organic and digital revenue streams.
          Your capital fuels real cows, real land and real markets — while you earn passive,
          transparent returns every month.
        </p>
        <div className="mt-10 sm:mt-12 grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: Shield, t: "Asset-Backed Security", d: "Your capital directly funds Gir cow health and dairy infrastructures, creating physical asset security." },
            { icon: Sparkles, t: "Passive Income", d: "Hands-free wealth growth — no complex knowledge of assets, trading, or maintenance required on your end." },
            { icon: TrendingUp, t: "Full Transparency", d: "Standardised legal agreements, complete clarity, and open business support at every milestone." },
          ].map((f) => (
            <div key={f.t} className="bg-card border border-border rounded-2xl p-8 text-left shadow-soft hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl text-bark mb-2 font-bold">{f.t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const streams = [
  {
    icon: Milk,
    tag: "Stream 01",
    title: "Cow Products",
    desc: "A2 dairy and premium organic derivatives made from purebred heritage Gir cows — providing stable physical revenue.",
    items: [
      "Pure A2 Gir Milk",
      "Vedic Ghee (Bilona Method)",
      "Organic Curd & Paneer",
      "Artisanal Cheese & Butter",
      "Traditional Cow Dung Cakes",
      "Herb-Infused Incense Sticks",
      "Premium Panchgavya Medicines",
      "Bio-Dung Organic Fertilizers"
    ],
    image: products,
  },
  {
    icon: Coins,
    tag: "Stream 02",
    title: "Token Income",
    desc: "Digital assets on blockchain that represent ownership and grow in value as the Gaulaxmi community expands.",
    items: ["Token buying & selling", "Value growth", "Community expansion", "On-chain rewards"],
    image: btxToken,
  },
  {
    icon: TrendingUp,
    tag: "Stream 03",
    title: "Trading Income",
    desc: "Profit from price movements across crypto, forex and equities — executed by professional desks on your behalf.",
    items: ["Crypto trading", "Forex trading", "Stock market", "Daily P&L reports"],
    image: tradingIncomeImg,
  },
  {
    icon: Building2,
    tag: "Stream 04",
    title: "Real Estate",
    desc: "Strategic property investments — land acquisition, residential trading, rental yield and commercial projects.",
    items: ["Land investment", "Property trading", "Rental income", "Commercial assets"],
    image: realEstateImg,
  },
];

function Income() {
  return (
    <section id="income" className={sectionY}>
      <div className={containerClass}>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 mb-10 sm:mb-14">
          <div>
            <div className={sectionTagClass}>Four Income Streams</div>
            <h2 className={`${sectionHeadingClass} max-w-2xl`}>
              One investment. Four engines of wealth.
            </h2>
          </div>
          <p className={`${sectionParagraphClass} mt-0 max-w-md`}>
            Diversification isn't a strategy here — it's the foundation. Each stream balances the next beautifully.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {streams.map((s, i) => (
            <div key={s.title} className="group relative rounded-3xl border border-border overflow-hidden bg-card shadow-soft hover:shadow-deep transition-all duration-300">
              <div className="relative h-56 overflow-hidden bg-gradient-to-br from-[#6c3d16] via-[#8e5a2c] to-[#c89055]">
                {s.image ? (
                  <img src={s.image} alt={s.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_45%)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-bark/70 to-transparent" />
              </div>
              <div className="p-5 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <s.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-accent font-bold">{s.tag}</span>
                </div>
                <h3 className="font-display text-2xl text-bark mb-3 font-bold">{s.title}</h3>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{s.desc}</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {s.items.map((it) => (
                    <li key={it} className="flex items-center gap-2 text-sm text-foreground/80">
                      <Check className="w-4 h-4 text-accent" /> {it}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const cowProductsList = [
  {
    title: "Vedic A2 Bilona Gir Cow Ghee",
    desc: "Handcrafted ghee prepared using the traditional Bilona churning method with pure A2 Gir Cow milk.",
    image: gheeJarImg,
    badge: "100% Pure",
    specs: ["Vedic Bilona Processed", "Cruelty-Free Churning", "Rich in vital nutrients"]
  },
  {
    title: "Pure A2 Gir Cow Fresh Milk",
    desc: "Fresh, creamy and nutrient-rich A2 milk delivered directly from local organic farms.",
    image: milkBottleImg,
    badge: "Fresh Daily",
    specs: ["No preservatives added", "Rich in A2 Beta-Casein", "Eco-friendly glass container"]
  },
  {
    title: "Herb-Infused Cow Dung Incense",
    desc: "Organic dhoop sticks handcrafted with healthy Gir cow dung and Ayurvedic healing herbs.",
    image: incenseSticksImg,
    badge: "Air Purifying",
    specs: ["Herbal formula", "Chemical-free & non-toxic", "Authentic Vedic fragrance"]
  },
  {
    title: "Gaulaxmi Signature Hamper",
    desc: "An ultimate selection of premium organic dairy and wellness derivatives for complete family wellness.",
    image: products,
    badge: "Best Seller",
    specs: ["Vedic formulation", "Complete pure milk range", "Eco-friendly packaging"]
  },
  {
    title: "A2 Gir Cow Premium Collection",
    desc: "A luxurious gift-worthy collection of pure Vedic Ghee, artisanal organic cheeses, and fresh A2 dairy products.",
    image: cowProductsPackImg,
    badge: "Limited Edition",
    specs: ["Elegant jar packing", "Artisanal cheeses included", "Cinematic presentation"]
  }
];

function CowProductsCarousel() {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      checkScroll();
    }
    return () => {
      if (el) {
        el.removeEventListener("scroll", checkScroll);
      }
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scrollIdx = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.8;
      scrollRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <section id="cow-products-carousel" className={`${sectionY} bg-[#faf5ef] overflow-visible`}>
      <div className={containerClass}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className={sectionTagClass}>Premium Curations</div>
            <h2 className={sectionHeadingClass}>
              A2 Gir Cow <span className="text-primary font-display font-bold">Signature Series</span>
            </h2>
            <p className={sectionParagraphClass}>
              Experience pure wellness from the heart of our sacred pastures. Every product is prepared using age-old Vedic methodologies.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => scrollIdx("left")}
              disabled={!canScrollLeft}
              className="w-12 h-12 rounded-full border border-border flex items-center justify-center transition-all bg-card shadow-soft disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer md:hover:bg-primary md:hover:text-primary-foreground text-primary"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollIdx("right")}
              disabled={!canScrollRight}
              className="w-12 h-12 rounded-full border border-border flex items-center justify-center transition-all bg-card shadow-soft disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer md:hover:bg-primary md:hover:text-primary-foreground text-primary"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto overflow-y-visible scrollbar-none snap-x snap-mandatory py-8 -mx-6 px-6"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {cowProductsList.map((product, i) => (
            <motion.div
              key={product.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex-shrink-0 w-[min(85vw,280px)] sm:w-[350px] md:w-[380px] bg-white rounded-3xl border border-border/80 overflow-visible shadow-soft hover:shadow-deep transition-all duration-300 snap-start flex flex-col group"
            >
              <div className="relative h-64 overflow-hidden rounded-t-3xl bg-gradient-to-br from-[#efe5db] to-[#f4eee6]">
                <img
                  src={product.image}
                  alt={product.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-4 left-4 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 bg-bark text-cream rounded-full">
                  {product.badge}
                </span>
              </div>
              <div className="p-6 md:p-8 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-xl md:text-2xl text-bark font-bold mb-3">{product.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">{product.desc}</p>
                </div>
                
                <div className="border-t border-border pt-5 mt-auto">
                  <div className="space-y-2">
                    {product.specs.map((spec) => (
                      <div key={spec} className="flex items-center gap-2 text-xs text-foreground/80">
                        <Check className="w-4 h-4 text-accent flex-shrink-0" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const plans = [
  { tier: "Starter", invest: "₹1,00,000", monthly: "₹5,000", total: "₹3,00,000", earnings: "₹4,00,000" },
  { tier: "Basic", invest: "₹2,00,000", monthly: "₹10,000", total: "₹6,00,000", earnings: "₹8,00,000" },
  { tier: "Bronze", invest: "₹3,00,000", monthly: "₹15,000", total: "₹9,00,000", earnings: "₹12,00,000" },
  { tier: "Copper", invest: "₹4,00,000", monthly: "₹20,000", total: "₹12,00,000", earnings: "₹16,00,000" },
  { tier: "Silver", invest: "₹5,00,000", monthly: "₹25,000", total: "₹15,00,000", earnings: "₹20,00,000", featured: true },
  { tier: "Gold", invest: "₹10,00,000", monthly: "₹50,000", total: "₹30,00,000", earnings: "₹40,00,000" },
  { tier: "Platinum", invest: "₹15,00,000", monthly: "₹75,000", total: "₹45,00,000", earnings: "₹60,00,000" },
  { tier: "Diamond", invest: "₹20,00,000", monthly: "₹1,00,000", total: "₹60,00,000", earnings: "₹80,00,000" },
];

function Plans() {
  return (
    <section id="plans" className={`${sectionY} bg-gradient-warm`}>
      <div className={containerClass}>
        <div className="text-center mb-12">
          <div className={sectionTagClass}>
            Investment Plans
          </div>
          <h2 className={sectionHeadingClass}>
            5-Year <span className="text-[#8b4513] font-display font-bold">Wealth Plans</span>
          </h2>
          <p className={`${sectionParagraphClass} md:text-base max-w-xl mx-auto`}>
            Choose the plan that fits your vision. Every rupee invested grows 3× over 5 years.
          </p>
        </div>

        <div className="w-full mb-8 sm:mb-10 py-2 sm:py-3 px-2 sm:px-4 flex justify-center">
          <div className="bg-card/60 border border-border rounded-2xl sm:rounded-full px-4 sm:px-6 py-3 sm:py-3.5 text-foreground/85 shadow-soft flex items-start sm:items-center gap-3 max-w-full">
            <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 font-mono mt-0.5 sm:mt-0">i</div>
            <p className="leading-relaxed sm:leading-snug text-[11px] sm:text-xs md:text-sm text-left sm:text-center">
              <span className="font-semibold text-primary">How it works:</span> Invest your chosen amount → Earn{" "}
              <span className="font-semibold text-accent">5% every month</span> for{" "}
              <span className="font-semibold">60 months</span> → Receive your principal back at maturity ={" "}
              <span className="font-semibold">Total: 3× your investment</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-7">
          {plans.map((p) => (
            <div
              key={p.invest}
              id={`plan-${p.tier.toLowerCase()}`}
              className={`relative rounded-[1.35rem] bg-[#fffdf9] border overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                p.featured ? "border-[#b36a18] shadow-[0_10px_28px_rgba(130,84,30,0.16)] ring-1 ring-[#b36a18]/20" : "border-[#d8cec1] shadow-[0_4px_16px_rgba(86,58,29,0.08)]"
              }`}
            >
              {p.featured && (
                <span className="absolute top-0 right-0 z-10 bg-gradient-to-r from-[#7b3f08] to-[#b86a1f] text-white text-[10px] uppercase tracking-wide px-3 py-1.5 rounded-bl-xl font-semibold shadow-sm">
                  ★ Most Popular
                </span>
              )}
              <div className="p-4 md:p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="text-center">
                    <span
                      className="inline-block px-3 py-1 rounded-full bg-[linear-gradient(90deg,rgba(249,236,220,1)_0%,rgba(216,197,171,1)_100%)] border border-[#f3ded3] text-[9px] uppercase tracking-[0.2em] text-[rgba(177,102,32,1)] font-semibold"
                    >
                      {p.tier}
                    </span>
                    <div className="mt-3 font-display text-xl font-bold text-[#2e241b] leading-tight">{p.invest}</div>
                    <div className="text-[9px] uppercase tracking-[0.18em] text-[#8a7a68] mt-1 font-semibold">Investment</div>
                  </div>

                  <div className="my-3 border-t border-[#ece3d8]" />

                  <div className="text-center">
                    <div>
                      <span className="font-display text-xl font-bold text-[#7f4e1c] leading-tight">{p.monthly}</span>
                      <span className="text-xs text-[#7f7266]"> /month</span>
                    </div>
                    <div className="text-[11px] text-[#8a7a68] mt-1 font-medium">Monthly Return</div>
                  </div>

                  <div className="mt-4 space-y-0 text-xs">
                    <div className="flex justify-between py-2 border-b border-[#eee5db]">
                      <span className="text-[#76695d]">Monthly Income</span>
                      <span className="text-[#473527] font-semibold">{p.monthly}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#eee5db]">
                      <span className="text-[#76695d]">Over 60 Months</span>
                      <span className="text-[#473527] font-semibold">{p.total}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-[#76695d]">Capital Back</span>
                      <span className="text-[#b07a2c] font-semibold">{p.invest}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className={`mt-3 rounded-lg px-3 py-2 flex justify-between items-center ${p.featured ? "bg-[#f7ebdd]" : "bg-[#f7f3ee]"}`}>
                    <span className="text-xs text-[#6d4e34] font-semibold">Total Earnings</span>
                    <span className="font-display text-lg font-bold text-[#8b5a23] leading-none">{p.earnings}</span>
                  </div>

                  <a
                    href="#contact"
                    className={`mt-4 block w-full py-2.5 rounded-full font-semibold text-sm text-center transition-transform hover:scale-[1.02] ${
                      p.featured
                        ? "bg-[linear-gradient(90deg,#9a4f12_0%,#7a3d0d_55%,#6a3208_100%)] text-white shadow-md"
                        : "border border-[#9d6d3f] text-[#7b4b1d] bg-transparent hover:bg-[#f8f1e8]"
                    }`}
                  >
                    Get Started
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center mt-10 text-sm text-muted-foreground">
          Capital withdrawal: 15-day prior notice. <span className="text-primary font-medium">Profit withdrawal anytime.</span>
        </p>
      </div>
    </section>
  );
}

function ReturnCalculator() {
  const [amount, setAmount] = useState<number>(500000);

  // Return calculation variables based on 5% monthly return schema
  const monthlyReturn = amount * 0.05;
  const totalMonthlyPayout = monthlyReturn * 60;
  const totalReturn = totalMonthlyPayout + amount;

  return (
    <section id="calculator" className={`${sectionY} bg-[#fffdf9]`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className={sectionTagClass}>Return Calculator</div>
          <h2 className={sectionHeadingClass}>
            Calculate Your <span className="text-[#8b4513] font-display font-bold">Gau Laxmi</span> Prosperity
          </h2>
          <p className={`${sectionParagraphClass} md:text-base max-w-xl mx-auto`}>
            See exactly how your investment multiplies under our structured 60-month wellness model.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-deep">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-bark">Investment Amount</label>
                <div className="text-xl font-bold text-primary font-display">₹{amount.toLocaleString("en-IN")}</div>
              </div>
              <input
                id="calc-range"
                type="range"
                min="50000"
                max="5000000"
                step="50000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-2 bg-[#f2e2c9] rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between gap-1 text-[9px] sm:text-[11px] text-[#8a7a68] mt-2 font-medium">
                <span className="shrink-0">₹50K</span>
                <span className="shrink-0 hidden min-[400px]:inline">₹10L</span>
                <span className="shrink-0">₹25L</span>
                <span className="shrink-0">₹50L</span>
              </div>
            </div>

            <div className="border-t border-[#ece3d8] my-6" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
              <div className="bg-[#fcf8f2] border border-[#eee5db] rounded-2xl p-5">
                <div className="text-xs uppercase tracking-wider text-[#8a7a68] font-semibold">Monthly Return (5%)</div>
                <div className="text-2xl font-bold text-[#7f4e1c] font-display mt-2">
                  ₹{monthlyReturn.toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-[#8a7a68] mt-1">Paid directly every month</div>
              </div>

              <div className="bg-[#fcf8f2] border border-[#eee5db] rounded-2xl p-5">
                <div className="text-xs uppercase tracking-wider text-[#8a7a68] font-semibold">60-Month Total Payout</div>
                <div className="text-2xl font-bold text-primary font-display mt-2">
                  ₹{totalMonthlyPayout.toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-[#8a7a68] mt-1">Sum of monthly returns</div>
              </div>

              <div className="bg-gradient-gold text-primary-foreground rounded-2xl p-5 shadow-soft">
                <div className="text-xs uppercase tracking-wider text-primary-foreground/80 font-bold">Total Prosperity (3×)</div>
                <div className="text-2xl font-black font-display mt-2">
                  ₹{totalReturn.toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-primary-foreground/90 mt-1 font-medium">Includes principal refund</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-secondary/30 border border-border/50 rounded-xl p-4 mt-6">
              <div className="text-left">
                <div className="text-xs font-semibold text-bark uppercase tracking-wider">Milestone Reward Eligibility</div>
                <div className="text-sm text-[#8c5f3a] mt-0.5">
                  {amount >= 10000000 ? (
                    <span className="font-semibold text-accent">🐄 Qualifies for 100+ Free Gir Cows milestone bonus!</span>
                  ) : amount >= 5000000 ? (
                    <span className="font-semibold text-accent">🐄 Qualifies for 50 Free Gir Cows milestone bonus!</span>
                  ) : amount >= 3000000 ? (
                    <span className="font-semibold text-accent">🐄 Qualifies for 30 Free Gir Cows milestone bonus!</span>
                  ) : amount >= 1000000 ? (
                    <span className="font-semibold text-accent">🐄 Qualifies for 10 Free Gir Cows milestone bonus!</span>
                  ) : (
                    <span>Invest ₹10,00,000+ to qualify for free Gir cows milestone rewards.</span>
                  )}
                </div>
              </div>
              <a href="#contact" className={`${ctaGradientClass} font-semibold text-xs py-2 px-5 rounded-full shrink-0 whitespace-nowrap inline-flex items-center`}>
                Lock Plan Returns
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const bonuses = [
  { invest: "₹10 Lakh", cows: "10 Cows" },
  { invest: "₹30 Lakh", cows: "30 Cows" },
  { invest: "₹50 Lakh", cows: "50 Cows" },
  { invest: "₹1 Crore", cows: "100 Cows" },
];

function Bonus() {
  const perks = [
    { title: "Zero Maintenance", value: "We manage feeding, housing, shelter & expert veterinary care at 0% cost to you." },
    { title: "Ancestry Certified", value: "Every Gir cow is tagged, certified purebred, with full pedigree documentation." },
    { title: "Breeding Yields", value: "New offspring born to your herd are registered under your direct ownership." }
  ];

  return (
    <section id="bonus" className={`${sectionY} bg-[#faf6f0] scroll-mt-10 overflow-hidden relative`}>
      {/* Decorative ambient background accents */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-72 h-72 bg-[#f2e2c9] rounded-full filter blur-3xl opacity-40 -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#edd8c4] rounded-full filter blur-3xl opacity-35 -z-10" />

      <div className={containerClass}>
        <div className="grid lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Copy & Value Proposition */}
          <div className="lg:col-span-5 text-left">
            <div className={sectionTagClass}>Milestone Bonus</div>
            <h2 className={sectionHeadingClass}>
              Real cows. Real assets. <span className="text-[#8b4513] font-display font-bold">Yours to keep.</span>
            </h2>
            <p className={`${sectionParagraphClass} md:text-base`}>
              After 3 years, your milestone investment doesn't just return high-yield compound interest — it earns you living, breeding physical wealth. Free Gir cows are awarded to you with zero liability.
            </p>

            {/* Quick feature perks */}
            <div className="mt-8 space-y-5">
              {perks.map((p, idx) => (
                <div key={idx} className="flex gap-4 items-start p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-[#edd8c4]/30 hover:border-[#9a5f23]/30 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-[#f2e2c9] text-[#9a5f23] font-display font-black text-sm flex items-center justify-center shrink-0">
                    0{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#3d1e03] tracking-tight">{p.title}</h4>
                    <p className="text-xs text-[#6d5138] mt-0.5 leading-relaxed">{p.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive hint */}
            <div className="mt-8 p-4 rounded-2xl bg-[#5c2d11]/5 border border-[#5c2d11]/10 flex items-center gap-3">
              <span className="text-xl">✨</span>
              <span className="text-xs text-[#5c2d11] font-semibold leading-relaxed">
                Receive fully registered asset certificates of ownership upon lockup maturity.
              </span>
            </div>
          </div>

          {/* Right Column: Premium Interactive Milestone Tiers Grid */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                { 
                  invest: "₹10 Lakh", 
                  cows: "10 Gir Cows", 
                  bonus: "Purity Certified Lineage", 
                  bg: "bg-white",
                  borderColor: "border-[#edd8c4]/40 hover:border-[#9a5f23]"
                },
                { 
                  invest: "₹30 Lakh", 
                  cows: "30 Gir Cows", 
                  bonus: "Premium Milking Lineage", 
                  bg: "bg-white",
                  borderColor: "border-[#edd8c4]/40 hover:border-[#9a5f23]"
                },
                { 
                  invest: "₹50 Lakh", 
                  cows: "50 Gir Cows", 
                  bonus: "Elite Breed Certification", 
                  bg: "bg-white", 
                  borderColor: "border-[#edd8c4]/40 hover:border-[#5c2d11]"
                },
                { 
                  invest: "₹1 Crore +", 
                  cows: "100+ Gir Cows", 
                  bonus: "VVIP Direct Farm Share", 
                  bg: "bg-gradient-to-br from-[#5c2d11] to-[#3d1e03] text-white",
                  borderColor: "border-transparent shadow-xl"
                }
              ].map((b, idx) => (
                <div 
                  key={idx} 
                  className={`relative p-6 sm:p-8 rounded-3xl border-2 ${b.bg} ${b.borderColor} transition-all duration-300 group hover:shadow-lg flex flex-col justify-between overflow-hidden`}
                >
                  <div>
                    {/* Top badging */}
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        b.bg.includes("text-white") ? "bg-white/10 text-cream" : "bg-[#f2e2c9] text-[#9a5f23]"
                      }`}>
                        Tier 0{idx+1}
                      </span>
                      <span className="text-xl">🐄</span>
                    </div>

                    <div className="text-xs uppercase font-semibold tracking-wider opacity-60">
                      MINIMUM INVEST
                    </div>
                    <div className="font-display text-2xl font-black mt-1">
                      {b.invest}
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-current/10">
                    <div className="text-xs uppercase font-semibold tracking-wider opacity-65">
                      ASSET BONUS REWARD
                    </div>
                    <div className="font-display text-base font-bold mt-1">
                      {b.cows}
                    </div>
                    <p className="text-[11px] opacity-65 mt-0.5">
                      {b.bonus}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual Farm Banner */}
            <div className="relative rounded-[2rem] overflow-hidden shadow-lg border border-[#edd8c4]/40 group h-40 sm:h-48">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-90" />
              <img 
                src={farm} 
                alt="Gaulaxmi cow farm at sunrise" 
                loading="lazy" 
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                referrerPolicy="no-referrer" 
              />
              <div className="absolute bottom-4 sm:bottom-5 left-4 sm:left-6 right-4 sm:right-6 z-10 text-left text-white flex flex-col sm:flex-row sm:items-end gap-3 sm:justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#f2e2c9]">Our Standard</p>
                  <h4 className="font-display font-bold text-base sm:text-lg leading-tight mt-0.5">State-of-the-Art Caring Farms</h4>
                </div>
                <a 
                  href="#contact" 
                  className="bg-white/10 hover:bg-white text-white hover:text-[#5c2d11] backdrop-blur-sm rounded-full text-[11px] font-bold px-4 py-2 transition-all shrink-0 hover:scale-105 self-start sm:self-auto"
                >
                  View Details
                </a>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section 
      id="contact" 
      className={`${sectionY} text-primary-foreground relative overflow-hidden isolate`}
    >
      <div className="absolute inset-0 -z-10 bg-[#1c0f05]">
        {/* Base rich glowing central light gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at center, oklch(0.48 0.12 45) 0%, oklch(0.20 0.04 45) 100%)"
          }}
        />
        {/* Beautiful repeating striped diagonal lines matching the reference screenshot */}
        <div 
          className="absolute inset-0 mix-blend-overlay opacity-20" 
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.5) 0px, rgba(0, 0, 0, 0.5) 10px, transparent 10px, transparent 20px)",
          }}
        />
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative">
        <img src={logo} alt="Gaulaxmi" className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-5 sm:mb-6 opacity-90 animate-float bg-[#faf6f0] rounded-[50px] p-2.5" referrerPolicy="no-referrer" />
        <h2 className={`${sectionHeadingClass} text-white`}>
          Begin your journey with Gaulaxmi.
        </h2>
        <p className="mt-5 text-cream/90 max-w-2xl mx-auto text-base sm:text-lg">
          Questions about plans, returns, or automated onboarding? Our dedicated advisors are one message away.
        </p>
        <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: Phone, label: "Call us", value: "+91 · Contact Team" },
            { icon: Mail, label: "Email Support", value: "info@gaulaxmi.io" },
            { icon: Globe, label: "Official Portal", value: "www.gaulaxmi.io" },
          ].map((c) => (
            <div key={c.label} className="bg-cream/10 backdrop-blur border border-cream/20 rounded-2xl p-6 hover:bg-cream/20 transition-all duration-300">
              <c.icon className="w-6 h-6 mx-auto mb-3 text-gold" />
              <div className="text-xs uppercase tracking-widest text-cream/70 font-semibold">{c.label}</div>
              <div className="font-display text-base mt-2 font-semibold text-white">{c.value}</div>
            </div>
          ))}
        </div>
        <a href="mailto:info@gaulaxmi.io" className="inline-flex items-center gap-2 mt-12 bg-gold text-bark px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform shadow-deep">
          Talk to an Advisor <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}

function GetInTouch() {
  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullname.trim() || !phone.trim() || !plan) {
      setErrorMsg("Please fill out all required fields (*).");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    
    // Simulate API registration submit
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      // Reset fields
      setFullname("");
      setPhone("");
      setEmail("");
      setPlan("");
      setMessage("");
    }, 1200);
  };

  return (
    <section id="join-form" className={`${sectionY} bg-[#faf6f0] scroll-mt-10`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header centered */}
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center rounded-full bg-[#f2e2c9] px-6 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#9a5f23] mb-5">
            GET IN TOUCH
          </div>
          <h2 className={sectionHeadingClass}>
            Join <span className="text-[#8b4513] font-display font-bold">Gaulaxmi</span> Today
          </h2>
          <p className="mt-3 text-base text-[#6d5138] max-w-xl mx-auto leading-relaxed">
            Fill in your details and our team will reach out within 24 hours
          </p>
        </div>

        {/* Form and Info Section Grid */}
        <div className="grid lg:grid-cols-12 gap-6 sm:gap-10 items-stretch">
          
          {/* Left card - Gaulaxmi Info Card */}
          <div className="lg:col-span-5 bg-[#5c2d11] rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 lg:p-10 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center">
              {/* Premium Circular Cow Logo */}
              <div className="w-16 h-16 bg-[#faf6f0] rounded-full p-2.5 flex items-center justify-center mb-6 shadow-inner">
                <img src={logo} alt="Gaulaxmi Logo" className="w-12 h-12 object-contain opacity-95 animate-float" referrerPolicy="no-referrer" />
              </div>
              
              <h3 className="font-display text-2xl font-bold text-center text-white tracking-tight">
                Gaulaxmi Global Wellness
              </h3>
              <p className="text-xs uppercase tracking-[0.16em] text-center text-cream/75 mt-1 font-medium">
                India's Premier Organic MLM Platform
              </p>
              
              <div className="w-full border-t border-white/10 my-8" />
              
              {/* Info Items List */}
              <div className="w-full space-y-6">
                {[
                  { icon: Globe, label: "Website", value: "www.gaulaxmi.io", sub: "Official Portal" },
                  { icon: Mail, label: "Email", value: "info@gaulaxmi.io", sub: "Round-the-clock sales" },
                  { icon: MessageCircle, label: "WhatsApp", value: "Available 24/7", sub: "Priority Support" },
                  { icon: MapPin, label: "Operations", value: "Pan India", sub: "HQ - Delhi NCR & Farm" }
                ].map((item, id) => (
                  <div key={id} className="flex items-center gap-4 group">
                    <div className="w-11 h-11 bg-white/10 text-cream rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:bg-[#f2e2c9] group-hover:text-[#5c2d11] duration-300">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-xs text-cream/60 font-medium tracking-wide">{item.label}</div>
                      <div className="text-sm font-bold text-white mt-0.5">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Social Links */}
            <div className="relative z-10 pt-10 flex items-center justify-center gap-4 border-t border-white/10 mt-10">
              {[
                { icon: Facebook, href: "https://facebook.com" },
                { icon: Instagram, href: "https://instagram.com" },
                { icon: Youtube, href: "https://youtube.com" },
                { icon: Send, href: "https://t.me" }
              ].map((soc, sid) => (
                <a 
                  key={sid} 
                  href={soc.href} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-10 h-10 bg-white/10 hover:bg-[#f2e2c9] hover:text-[#5c2d11] text-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <soc.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Right card - Form Card */}
          <div className="lg:col-span-7 bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 lg:p-10 shadow-lg border border-border/10 flex flex-col justify-between">
            <h3 className="font-display text-2xl font-bold text-[#3d1e03] mb-6 text-left">
              Registration Inquiry
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Form elements side-by-side on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-left">
                  <label className="text-xs font-bold tracking-wider text-[#3d1e03] uppercase mb-2 block">
                    Full Name *
                  </label>
                  <input 
                    type="text" 
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    placeholder="Your full name" 
                    required
                    className="w-full bg-[#faf6f0] border-2 border-[#edd8c4] focus:ring-2 focus:ring-[#9a5f23]/20 focus:border-[#5c2d11] outline-none rounded-[10px] px-5 py-3.5 text-sm text-[#3d1e03] transition-all placeholder:text-[#ab927f]"
                  />
                </div>
                <div className="text-left">
                  <label className="text-xs font-bold tracking-wider text-[#3d1e03] uppercase mb-2 block">
                    Phone Number *
                  </label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX" 
                    required
                    className="w-full bg-[#faf6f0] border-2 border-[#edd8c4] focus:ring-2 focus:ring-[#9a5f23]/20 focus:border-[#5c2d11] outline-none rounded-[10px] px-5 py-3.5 text-sm text-[#3d1e03] transition-all placeholder:text-[#ab927f]"
                  />
                </div>
              </div>

              <div className="text-left">
                <label className="text-xs font-bold tracking-wider text-[#3d1e03] uppercase mb-2 block">
                  Email Address
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" 
                  className="w-full bg-[#faf6f0] border-2 border-[#edd8c4] focus:ring-2 focus:ring-[#9a5f23]/20 focus:border-[#5c2d11] outline-none rounded-[10px] px-5 py-3.5 text-sm text-[#3d1e03] transition-all placeholder:text-[#ab927f]"
                />
              </div>

              <div className="text-left">
                <label className="text-xs font-[#3d1e03] tracking-wider text-[#3d1e03] font-bold uppercase mb-2 block">
                  Investment Plan *
                </label>
                <div className="relative w-full">
                  <select 
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    required
                    className="w-full bg-[#faf6f0] border-2 border-[#edd8c4] focus:ring-2 focus:ring-[#9a5f23]/20 focus:border-[#5c2d11] outline-none rounded-[10px] pl-5 pr-12 py-3.5 text-sm text-[#3d1e03] transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select a Plan</option>
                    <option value="bronze">Bronze Gau Advisor (₹10,000 - ₹50,000)</option>
                    <option value="silver">Silver Gau Patron (₹50,000 - ₹2,000,000)</option>
                    <option value="gold">Gold Gau Partner (₹2,000,000 - ₹5,000,000)</option>
                    <option value="diamond">Diamond Gau Visionary (₹5,000,000+)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#9a5f23]">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="text-left">
                <label className="text-xs font-bold tracking-wider text-[#3d1e03] uppercase mb-2 block">
                  Message (Optional)
                </label>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Any questions or how you heard about us..." 
                  rows={3}
                  className="w-full bg-[#faf6f0] border-2 border-[#edd8c4] focus:ring-2 focus:ring-[#9a5f23]/20 focus:border-[#5c2d11] outline-none rounded-[10px] px-5 py-3.5 text-sm text-[#3d1e03] transition-all placeholder:text-[#ab927f] resize-none"
                />
              </div>

              {errorMsg && (
                <div className="text-xs text-red-600 font-semibold">{errorMsg}</div>
              )}

              {/* Alert Feedback messaging */}
              <AnimatePresence>
                {submitted && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-sm font-medium"
                  >
                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">Registration Submitted!</p>
                      <p className="text-xs text-emerald-700 font-normal">Thank you for joining. Our regional manager will call you within 24 hours.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button with paper plane icon */}
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full ${ctaGradientClass} disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 font-bold py-4 rounded-full flex items-center justify-center gap-2.5 mt-4 group cursor-pointer`}
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                    <span>Submit Registration</span>
                  </>
                )}
              </button>
            </form>
          </div>
          
        </div>
      </div>
    </section>
  );
}

function WhyChoose() {
  const items = [
    { icon: Shield, t: "Asset-Backed Security", d: "Your investment is backed by real, tangible Desi cow assets — not virtual promises. True wealth with physical foundation." },
    { icon: Leaf, t: "100% Organic Products", d: "All products are pure, chemical-free and directly sourced from healthy, free-grazing Desi cows raised with care." },
    { icon: Handshake, t: "Transparent System", d: "Every rupee, every return, every commission — all clearly defined, transparent and trackable in your digital dashboard." },
    { icon: Users, t: "Community-Driven", d: "Join a growing family of thousands of members who are building wealth together while supporting organic farming." },
    { icon: Smartphone, t: "Digital Platform", d: "Manage investments, track ROI, monitor referrals and withdraw income — all through our smart digital platform." },
    { icon: Flower2, t: "Spiritual Purpose", d: "Every investment supports the welfare of Desi cows and promotes the ancient Vedic tradition of Gau Seva." },
  ];
  return (
    <section id="why" className={`${sectionY} bg-gradient-warm`}>
      <div className={containerClass}>
        <div className="text-center mb-14">
          <div className={sectionTagClass}>Our Edge</div>
          <h2 className={sectionHeadingClass}>
            Why Choose <span className="text-[#8b4513] font-display font-bold">Gaulaxmi?</span>
          </h2>
          <p className={sectionParagraphClass}>Built on trust, backed by assets, driven by purpose</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {items.map((f, i) => (
            <div
              key={f.t}
              className="group bg-card border border-border p-6 sm:p-8 rounded-[20px] shadow-soft hover:-translate-y-2 hover:shadow-deep transition-all duration-300"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-14 h-14 bg-secondary/60 rounded-[15px] flex items-center justify-center mb-6 group-hover:bg-brand-gradient transition-all duration-300">
                <f.icon className="w-6 h-6 text-accent group-hover:text-primary-foreground transition-colors duration-300" />
              </div>
              <h3 className="font-display text-xl text-bark mb-3 font-bold">{f.t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-bark text-cream/80 py-8 sm:py-10">
      <div className={`${containerClass} flex flex-col md:flex-row gap-6 items-center md:justify-between text-center md:text-left`}>
        <div className="flex items-center gap-3 justify-center md:justify-start">
          <img src={logo} alt="" className="h-9 w-9" referrerPolicy="no-referrer" />
          <div>
            <div className="font-display text-cream font-bold">Gaulaxmi Global Wellness</div>
            <div className="text-xs text-cream/60">© {new Date().getFullYear()} · All rights reserved</div>
          </div>
        </div>
        <div className="text-xs text-cream/60 max-w-md md:text-right leading-relaxed mx-auto md:mx-0">
          Investments are subject to market and operational risks. Past performance does not guarantee future returns.
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground antialiased selection:bg-[#f2e2c9] selection:text-[#9a5f23]">
      <Nav />
      <main className="pt-14 sm:pt-16">
        <Hero />
        <About />
        <WhyChoose />
        <Income />
        <CowProductsCarousel />
        <Plans />
        <ReturnCalculator />
        <Bonus />
        <Contact />
        <GetInTouch />
      </main>
      <Footer />
    </div>
  );
}
