import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChart3, Menu, X } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (user) {
    navigate('/top-setups');
    return null;
  }

  const handleGetStarted = () => navigate('/register');
  const handleClaim = (e) => {
    e.preventDefault();
    navigate('/register');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-dark-100 text-white flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-dark-300 py-4 px-4 sm:px-6 flex justify-between items-center sticky top-0 bg-dark-100 z-20">
        <div className="text-xl sm:text-2xl font-bold text-green-400 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" /> MacroPulse
        </div>

        {/* Desktop center links */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          <a href="#features" className="text-gray-400 hover:text-white transition">Features</a>
          <div className="relative group">
            <button className="text-gray-400 hover:text-white transition flex items-center gap-1">
              Free Tools
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute left-0 mt-2 w-56 bg-dark-200 border border-dark-300 rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30">
              <a href="/free-retail-sentiment" className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-300 hover:text-white transition">
                Retail Sentiment
              </a>
              <a href="/free-latest-cot" className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-300 hover:text-white transition">
                Latest COT
              </a>
              <a href="/free-position-size-calculator" className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-300 hover:text-white transition">
                Position Size Calculator
              </a>
            </div>
          </div>
          <a href="#contact" className="text-gray-400 hover:text-white transition">Contact</a>
        </div>

        {/* Desktop buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="bg-transparent border border-green-500 text-green-500 px-3 py-1.5 sm:px-4 rounded hover:bg-green-500 hover:text-dark-100 transition text-sm sm:text-base"
          >
            Login
          </button>
          <button
            onClick={handleGetStarted}
            className="bg-green-500 hover:bg-green-600 text-dark-100 font-bold px-3 py-1.5 sm:px-4 rounded transition text-sm sm:text-base"
          >
            Sign Up
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-400 hover:text-white transition"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-dark-200 border-b border-dark-300 px-4 py-4 flex flex-col gap-3 animate-slide-down z-10">
          <a href="#features" className="text-gray-400 hover:text-white transition" onClick={closeMobileMenu}>Features</a>
          <div className="flex flex-col gap-2">
            <span className="text-gray-400 text-sm font-medium">Free Tools</span>
            <a href="/free-retail-sentiment" className="pl-4 text-gray-400 hover:text-white transition" onClick={closeMobileMenu}>Retail Sentiment</a>
            <a href="/free-latest-cot" className="pl-4 text-gray-400 hover:text-white transition" onClick={closeMobileMenu}>Latest COT</a>
            <a href="/free-position-size-calculator" className="pl-4 text-gray-400 hover:text-white transition" onClick={closeMobileMenu}>Position Size Calculator</a>
          </div>
          <a href="#contact" className="text-gray-400 hover:text-white transition" onClick={closeMobileMenu}>Contact</a>
          <div className="flex flex-col gap-2 pt-2 border-t border-dark-300">
            <button
              onClick={() => { navigate('/login'); closeMobileMenu(); }}
              className="bg-transparent border border-green-500 text-green-500 px-4 py-2 rounded hover:bg-green-500 hover:text-dark-100 transition w-full text-center"
            >
              Login
            </button>
            <button
              onClick={() => { navigate('/register'); closeMobileMenu(); }}
              className="bg-green-500 hover:bg-green-600 text-dark-100 font-bold px-4 py-2 rounded transition w-full text-center"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}

      {/* Hero Section – unchanged */}
      <section className="bg-dark-100 relative flex flex-col overflow-hidden min-h-[calc(100vh-80px)]">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/[0.03] rounded-full blur-[100px] pointer-events-none"></div>
        <div className="flex-1 flex items-center max-w-7xl mx-auto w-full relative z-10 px-4 sm:px-8 py-8 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center w-full">
            {/* Left Column */}
            <div className="flex flex-col gap-4 lg:gap-10 text-center lg:text-left items-center lg:items-start">
              <button
                onClick={handleClaim}
                className="group inline-flex items-center gap-2.5 pl-3 pr-1.5 py-1.5 rounded-full bg-primary/15 border border-primary/40 hover:bg-primary/20 hover:border-primary/60 shadow-[0_0_20px_rgba(0,255,136,0.15)] hover:shadow-[0_0_28px_rgba(0,255,136,0.25)] transition-all animate-slide-up self-center lg:self-start text-xs sm:text-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-xs font-semibold text-green-400">Free for 1 month</span>
                <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-wider opacity-60">with TRADING ECONOMICS</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500 text-dark-100 text-[10px] font-bold font-mono uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">
                  Claim<span aria-hidden="true">→</span>
                </span>
              </button>
              <div className="flex flex-col gap-2 animate-slide-up stagger-1">
                <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-6xl tracking-tight">
                  Technicals give you levels. <br />
                  <span className="text-green-400 drop-shadow-[0_0_8px_rgba(0,255,136,0.3)]">Fundamentals give you the direction.</span>
                  <span className="block mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-green-400/80">
                    Real-time economic data · auto‑classification
                  </span>
                </h1>
              </div>
              <p className="text-sm sm:text-base lg:text-lg opacity-50 leading-relaxed animate-slide-up stagger-2 max-w-xl">
                Stop guessing. Start trading with a data‑driven edge that combines institutional positioning, macro surprises, and seasonal patterns into one clear direction.
              </p>
              <div className="flex flex-col items-center lg:items-start gap-3 animate-slide-up stagger-3 w-full">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleGetStarted}
                    className="bg-green-500 hover:bg-green-600 text-dark-100 font-bold px-6 sm:px-8 py-3 rounded-lg transition shadow-[0_0_8px_rgba(0,255,136,0.2)] hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,255,136,0.2)] w-full sm:w-auto text-center"
                  >
                    Get started
                  </button>
                  <a href="#features" className="border border-white/15 text-white/70 hover:border-green-400/40 hover:bg-green-400/5 hover:text-green-400 transition px-6 py-3 rounded-lg w-full sm:w-auto text-center">
                    See the features
                  </a>
                </div>
                <span className="text-xs opacity-30 font-mono whitespace-nowrap">30-day money-back guarantee</span>
              </div>
              <a href="https://macropulse254.vercel.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs opacity-50 hover:opacity-80 font-mono tracking-wider uppercase animate-slide-up transition-opacity duration-150 justify-center lg:justify-start">
                <span>a</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" className="w-4 h-4">
                  <circle cx="59.42" cy="59.42" r="37.59" fill="#54c7e2"></circle>
                  <path d="M59.42,118.85a59.43,59.43,0,1,1,59.43-59.43A59.49,59.49,0,0,1,59.42,118.85ZM59.42,12a47.43,47.43,0,1,0,47.43,47.42A47.47,47.47,0,0,0,59.42,12Z" fill="#54c7e2"></path>
                </svg>
                <span className="text-green-400/80">Repper's</span>
                <span>product</span>
              </a>
            </div>

            {/* Right Column - Speed Chart (unchanged) */}
            <div className="w-full animate-slide-up stagger-4">
              <div className="relative">
                <div className="absolute -inset-px rounded-lg bg-gradient-to-b from-green-400/10 to-transparent pointer-events-none"></div>
                <div className="bg-dark-200/30 backdrop-blur-sm rounded-lg border border-white/[0.04] p-3 sm:p-5 lg:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-[8px] sm:text-[10px] font-mono uppercase tracking-widest opacity-30">seconds after official release · typical timings</span>
                  </div>
                  <svg viewBox="0 0 580 220" className="w-full h-auto" role="img" aria-label="Speed comparison chart showing MacroPulse delivering data faster than competitors" style={{ fontFamily: 'monospace' }}>
                    {/* SVG content unchanged – keep the same chart */}
                    <line x1="140" y1="15" x2="140" y2="185" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="none"></line>
                    <line x1="350" y1="15" x2="350" y2="185" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="2 6"></line>
                    <line x1="560" y1="15" x2="560" y2="185" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="2 6"></line>
                    <text x="145" y="21" className="text-[9px] uppercase" fill="currentColor" fillOpacity="0.3" letterSpacing="0.1em">release</text>

                    <line x1="140" y1="45" x2="560" y2="45" stroke="currentColor" strokeOpacity="0.04"></line>
                    <text x="130" y="46" textAnchor="end" dominantBaseline="middle" className="text-[13px] font-semibold" fill="#00ff88" opacity="1">MacroPulse</text>
                    <rect x="140" y="41" width="168" height="8" rx="4" fill="#00ff88" fillOpacity="0.06"></rect>
                    <line x1="140" y1="45" x2="308" y2="45" stroke="#00ff88" strokeOpacity="1" strokeWidth="4" strokeLinecap="round"></line>
                    <circle cx="308" cy="45" r="6" fill="#00ff88" fillOpacity="1"></circle>
                    <circle cx="308" cy="45" r="14" fill="#00ff88" fillOpacity="0.1" className="animate-pulse"></circle>
                    <text x="308" y="31" textAnchor="middle" fill="#00ff88" fillOpacity="1" className="text-[10px] font-bold">~0.8s · scored</text>

                    <line x1="140" y1="87" x2="560" y2="87" stroke="currentColor" strokeOpacity="0.04"></line>
                    <text x="130" y="88" textAnchor="end" dominantBaseline="middle" className="text-[13px] font-medium" fill="currentColor" opacity="0.55">Tradion</text>
                    <line x1="140" y1="87" x2="392" y2="87" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round"></line>
                    <circle cx="392" cy="87" r="4" fill="currentColor" fillOpacity="0.4"></circle>
                    <text x="392" y="73" textAnchor="middle" fill="currentColor" fillOpacity="0.55" className="text-[10px]">~1.2s · data</text>

                    <line x1="140" y1="129" x2="560" y2="129" stroke="currentColor" strokeOpacity="0.04"></line>
                    <text x="130" y="130" textAnchor="end" dominantBaseline="middle" className="text-[13px] font-medium" fill="currentColor" opacity="0.55">Edge Finder</text>
                    <line x1="140" y1="129" x2="413" y2="129" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round"></line>
                    <circle cx="413" cy="129" r="4" fill="currentColor" fillOpacity="0.4"></circle>
                    <text x="413" y="115" textAnchor="middle" fill="currentColor" fillOpacity="0.55" className="text-[10px]">~1.3s · data</text>

                    <line x1="140" y1="171" x2="560" y2="171" stroke="currentColor" strokeOpacity="0.04"></line>
                    <text x="130" y="172" textAnchor="end" dominantBaseline="middle" className="text-[13px] font-medium" fill="currentColor" opacity="0.55">Reuters</text>
                    <line x1="140" y1="171" x2="455" y2="171" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round"></line>
                    <circle cx="455" cy="171" r="4" fill="currentColor" fillOpacity="0.4"></circle>
                    <text x="455" y="157" textAnchor="middle" fill="currentColor" fillOpacity="0.55" className="text-[10px]">~1.5s · data</text>

                    <line x1="140" y1="190" x2="560" y2="190" stroke="currentColor" strokeOpacity="0.08"></line>
                    <line x1="140" y1="186" x2="140" y2="194" stroke="currentColor" strokeOpacity="0.12"></line>
                    <text x="140" y="205" textAnchor="middle" fill="currentColor" fillOpacity="0.25" className="text-[10px]">0s</text>
                    <line x1="350" y1="186" x2="350" y2="194" stroke="currentColor" strokeOpacity="0.12"></line>
                    <text x="350" y="205" textAnchor="middle" fill="currentColor" fillOpacity="0.25" className="text-[10px]">1s</text>
                    <line x1="560" y1="186" x2="560" y2="194" stroke="currentColor" strokeOpacity="0.12"></line>
                    <text x="560" y="205" textAnchor="middle" fill="currentColor" fillOpacity="0.25" className="text-[10px]">2s</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticker */}
        <div className="relative bg-dark-200/40 border-y border-white/[0.08] animate-slide-up stagger-5">
          <div className="flex items-stretch h-10 sm:h-12 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 px-3 sm:px-5 border-r border-white/[0.08] flex-shrink-0">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-green-400/60 animate-pulse"></span>
                <span className="relative w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(0,255,136,0.8)]"></span>
              </span>
              <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-[0.22em] opacity-40">Covering</span>
            </div>
            <div className="relative flex-1 overflow-hidden group" style={{ maskImage: 'linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%)', WebkitMaskImage: 'linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%)' }}>
              <div className="flex items-center justify-center h-full gap-3 sm:gap-5 whitespace-nowrap animate-[ticker_20s_linear_infinite] md:animate-[ticker_40s_linear_infinite] group-hover:[animation-play-state:paused] will-change-transform text-[10px] sm:text-xs">
                <span className="flex items-center gap-2 sm:gap-5 opacity-40 hover:opacity-80 transition-opacity">
                  <span className="w-px h-2.5 bg-green-400/50 shadow-[0_0_3px_rgba(0,255,136,0.4)]"></span>GDP
                </span>
                <span className="flex items-center gap-2 sm:gap-5 opacity-40 hover:opacity-80 transition-opacity">
                  <span className="w-px h-2.5 bg-green-400/50 shadow-[0_0_3px_rgba(0,255,136,0.4)]"></span>NFP
                </span>
                <span className="flex items-center gap-2 sm:gap-5 opacity-40 hover:opacity-80 transition-opacity">
                  <span className="w-px h-2.5 bg-green-400/50 shadow-[0_0_3px_rgba(0,255,136,0.4)]"></span>RETAIL SALES
                </span>
                <span className="flex items-center gap-2 sm:gap-5 opacity-40 hover:opacity-80 transition-opacity">
                  <span className="w-px h-2.5 bg-green-400/50 shadow-[0_0_3px_rgba(0,255,136,0.4)]"></span>CONSUMER CONFIDENCE
                </span>
                <span className="flex items-center gap-2 sm:gap-5 opacity-40 hover:opacity-80 transition-opacity">
                  <span className="w-px h-2.5 bg-green-400/50 shadow-[0_0_3px_rgba(0,255,136,0.4)]"></span>CPI YOY
                </span>
                <span className="flex items-center gap-2 sm:gap-5 opacity-40 hover:opacity-80 transition-opacity">
                  <span className="w-px h-2.5 bg-green-400/50 shadow-[0_0_3px_rgba(0,255,136,0.4)]"></span>PPI YOY
                </span>
                <span className="flex items-center gap-2 sm:gap-5 opacity-40 hover:opacity-80 transition-opacity">
                  <span className="w-px h-2.5 bg-green-400/50 shadow-[0_0_3px_rgba(0,255,136,0.4)]"></span>Jobless Claims
                </span>
                <span className="flex items-center gap-2 sm:gap-5 opacity-40 hover:opacity-80 transition-opacity">
                  <span className="w-px h-2.5 bg-green-400/50 shadow-[0_0_3px_rgba(0,255,136,0.4)]"></span>ADP
                </span>
                <span className="flex items-center gap-2 sm:gap-5 opacity-40 hover:opacity-80 transition-opacity">
                  <span className="w-px h-2.5 bg-green-400/50 shadow-[0_0_3px_rgba(0,255,136,0.4)]"></span>UNEMPLOYMENT RATE
                </span>
                <span className="flex items-center gap-2 sm:gap-5 opacity-40 hover:opacity-80 transition-opacity">
                  <span className="w-px h-2.5 bg-green-400/50 shadow-[0_0_3px_rgba(0,255,136,0.4)]"></span>JOLTS
                </span>
                <span className="flex items-center gap-2 sm:gap-5 opacity-40 hover:opacity-80 transition-opacity">
                  <span className="w-px h-2.5 bg-green-400/50 shadow-[0_0_3px_rgba(0,255,136,0.4)]"></span>Manufaturing PMIs
                </span>
                <span className="flex items-center gap-2 sm:gap-5 opacity-40 hover:opacity-80 transition-opacity">
                  <span className="w-px h-2.5 bg-green-400/50 shadow-[0_0_3px_rgba(0,255,136,0.4)]"></span>Service PMIs
                </span>
                <span className="flex items-center gap-2 sm:gap-5 opacity-40 hover:opacity-80 transition-opacity">
                  <span className="w-px h-2.5 bg-green-400/50 shadow-[0_0_3px_rgba(0,255,136,0.4)]"></span>Household spending
                </span>
              </div>
            </div>
            <a className="group/more flex items-center gap-2 px-3 sm:px-5 border-l border-white/[0.08] flex-shrink-0 hover:bg-primary/5 transition-colors" href="#features">
              <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-[0.22em] opacity-40 group-hover/more:opacity-90 group-hover/more:text-green-400 transition-all">More</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" className="w-3 h-3 opacity-40 group-hover/more:opacity-90 group-hover/more:text-green-400 group-hover/more:translate-y-[1px] transition-all duration-200" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 4.5l3 3 3-3"></path>
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* The Problem Section – unchanged */}
      <section className="bg-dark-200 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 md:py-24 lg:py-32 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px w-8 bg-red-400/30"></div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-red-400/60">the problem</span>
            <div className="h-px w-8 bg-red-400/30"></div>
          </div>
          <h2 className="font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight text-center mb-4">You're trading only technicals</h2>
          <p className="text-sm sm:text-base md:text-lg opacity-60 text-center max-w-xl mx-auto mb-12 md:mb-16">Fundamentals tell the real direction, technicals tell the entry</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="group relative bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 md:p-8 hover:border-red-400/20 hover:bg-white/[0.05] hover:-translate-y-0.5 transition-all duration-150">
              <span className="text-red-400/60 mb-4 block">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                </svg>
              </span>
              <h3 className="font-bold text-lg mb-3">Fragmented data across tools</h3>
              <p className="opacity-50 leading-relaxed text-sm">Positioning, sentiment and fundamentals live in different sites and terminals — pulling together the full picture takes minutes, not seconds.</p>
            </div>
            <div className="group relative bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 md:p-8 hover:border-red-400/20 hover:bg-white/[0.05] hover:-translate-y-0.5 transition-all duration-150">
              <span className="text-red-400/60 mb-4 block">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </span>
              <h3 className="font-bold text-lg mb-3">Beat-or-miss judged by eye</h3>
              <p className="opacity-50 leading-relaxed text-sm">Reading tables under pressure and deciding whether a release surprises leaves your bias to emotion instead of a consistent scoring framework.</p>
            </div>
            <div className="group relative bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 md:p-8 hover:border-red-400/20 hover:bg-white/[0.05] hover:-translate-y-0.5 transition-all duration-150">
              <span className="text-red-400/60 mb-4 block">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" />
                </svg>
              </span>
              <h3 className="font-bold text-lg mb-3">Reaction, not preparation</h3>
              <p className="opacity-50 leading-relaxed text-sm">Without pre-built scorecards you scramble after the print — instead of knowing each market's institutional and macro setup ahead of time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section – unchanged */}
      <section className="bg-dark-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 md:py-24 lg:py-32 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px w-8 bg-green-400/50"></div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-green-400/80">how it works</span>
            <div className="h-px w-8 bg-green-400/50"></div>
          </div>
          <h2 className="font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight text-center mb-4">Three steps from data to decision</h2>
          <p className="text-sm sm:text-base md:text-lg opacity-40 text-center max-w-xl mx-auto mb-12 md:mb-16">Choose your market — we do the scoring.</p>
          <div className="flex flex-col md:flex-row justify-center items-start gap-0">
            <div className="flex-1 flex flex-col items-center text-center relative group">
              <div className="hidden md:block absolute top-7 left-[calc(50%+2rem)] right-[calc(-50%+2rem)] h-1 bg-gradient-to-r from-green-400/40 via-green-400/50 to-green-400/30 rounded-full shadow-[0_0_6px_rgba(0,255,136,0.25)]"></div>
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg border-2 border-green-400/50 bg-green-400/15 flex items-center justify-center mb-6 relative group-hover:border-green-400/80 group-hover:bg-green-400/25 group-hover:shadow-[0_0_30px_rgba(0,255,136,0.35)] shadow-[0_0_16px_rgba(0,255,136,0.15)] transition-all duration-150">
                <span className="text-lg font-bold font-mono text-green-400 relative z-10">1</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Select the asset</h3>
              <p className="opacity-40 leading-relaxed text-sm max-w-xs mb-3">Pick from 27 forex pairs plus metals, crypto, indices and oil.</p>
              <code className="text-xs font-mono text-green-400/40 bg-green-400/[0.04] px-3 py-1 rounded-full">select()</code>
            </div>
            <div className="flex-1 flex flex-col items-center text-center relative group">
              <div className="hidden md:block absolute top-7 left-[calc(50%+2rem)] right-[calc(-50%+2rem)] h-1 bg-gradient-to-r from-green-400/40 via-green-400/50 to-green-400/30 rounded-full shadow-[0_0_6px_rgba(0,255,136,0.25)]"></div>
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg border-2 border-green-400/50 bg-green-400/15 flex items-center justify-center mb-6 relative group-hover:border-green-400/80 group-hover:bg-green-400/25 group-hover:shadow-[0_0_30px_rgba(0,255,136,0.35)] shadow-[0_0_16px_rgba(0,255,136,0.15)] transition-all duration-150">
                <span className="text-lg font-bold font-mono text-green-400 relative z-10">2</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Open the scorecard</h3>
              <p className="opacity-40 leading-relaxed text-sm max-w-xs mb-3">Dive into asset & forex scorecards, COT, retail, seasonality or the economic calendar.</p>
              <code className="text-xs font-mono text-green-400/40 bg-green-400/[0.04] px-3 py-1 rounded-full">breakdown()</code>
            </div>
            <div className="flex-1 flex flex-col items-center text-center relative group">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg border-2 border-green-400/50 bg-green-400/15 flex items-center justify-center mb-6 relative group-hover:border-green-400/80 group-hover:bg-green-400/25 group-hover:shadow-[0_0_30px_rgba(0,255,136,0.35)] shadow-[0_0_16px_rgba(0,255,136,0.15)] transition-all duration-150">
                <span className="text-lg font-bold font-mono text-green-400 relative z-10">3</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Read the bias</h3>
              <p className="opacity-40 leading-relaxed text-sm max-w-xs mb-3">See the overall bullish/bearish bias and the five components driving it.</p>
              <code className="text-xs font-mono text-green-400/40 bg-green-400/[0.04] px-3 py-1 rounded-full">decide()</code>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section – unchanged */}
      <section className="bg-dark-200/30 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16 md:py-24 lg:py-32 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px w-8 bg-green-400/30"></div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-green-400/50">comparison</span>
            <div className="h-px w-8 bg-green-400/30"></div>
          </div>
          <h2 className="text-center font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight mb-12 md:mb-16">Trading releases with MacroPulse</h2>
          <div className="flex flex-col md:flex-row justify-center items-stretch gap-6 md:gap-0">
            <div className="flex-1 border-2 border-red-400/20 bg-dark-200/80 rounded-xl md:rounded-r-none p-5 md:p-8 lg:p-10 relative overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.1)]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400/50 via-red-400/30 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-red-400/5 to-transparent pointer-events-none"></div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-red-400/70 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400/50"></span>Without MacroPulse
              </h3>
              <ul className="space-y-3">
                <li className="flex gap-3 items-start text-sm opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0 text-red-400/60 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                  Refreshing overloaded release sites by hand
                </li>
                <li className="flex gap-3 items-start text-sm opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0 text-red-400/60 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                  Reading tables and judging beat-or-miss under pressure
                </li>
                <li className="flex gap-3 items-start text-sm opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0 text-red-400/60 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                  Placing orders manually, 5–10 seconds late
                </li>
                <li className="flex gap-3 items-start text-sm opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0 text-red-400/60 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                  Third-party feeds adding seconds of latency
                </li>
                <li className="flex gap-3 items-start text-sm opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0 text-red-400/60 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                  Paying thousands per month for institutional terminals
                </li>
                <li className="flex gap-3 items-start text-sm opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0 text-red-400/60 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                  Locked to MetaTrader or a single platform
                </li>
              </ul>
            </div>
            <div className="flex-1 border-2 border-green-400/30 bg-green-400/[0.08] rounded-xl md:rounded-l-none p-5 md:p-8 lg:p-10 relative overflow-hidden shadow-[0_0_50px_rgba(0,255,136,0.2)]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400/60 via-green-400/40 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-green-400/10 to-transparent pointer-events-none"></div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-green-400/80 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>With MacroPulse
              </h3>
              <ul className="space-y-3">
                <li className="flex gap-3 items-start text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0 text-green-400 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Macro, positioning and sentiment data combined in one dashboard
                </li>
                <li className="flex gap-3 items-start text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0 text-green-400 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Beat-or-miss vs forecast evaluated for you, instantly
                </li>
                <li className="flex gap-3 items-start text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0 text-green-400 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Contrarian read on retail crowding and options flows
                </li>
                <li className="flex gap-3 items-start text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0 text-green-400 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Retail sentiment auto-refreshes every 30 minutes; put/call ratios update before the close
                </li>
                <li className="flex gap-3 items-start text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0 text-green-400 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  From $99/mo (billed annually), transparent pricing
                </li>
                <li className="flex gap-3 items-start text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0 text-green-400 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Works with any broker or platform
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Updated Features Section – now "Built for Insight" */}
      <section className="py-16 md:py-24 lg:py-32 max-w-7xl mx-auto bg-dark-100 relative" id="features">
        <div className="px-4 sm:px-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-px w-8 bg-green-400/50"></div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-green-400/80">features</span>
          </div>
          <h2 className="font-extrabold text-3xl sm:text-4xl lg:text-6xl tracking-tight mb-4">Built for Insight</h2>
          <p className="text-base sm:text-lg opacity-40 mb-12 md:mb-16 max-w-xl">
            Every component engineered to turn economic data into actionable macro scores.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            <div className="group relative flex flex-col gap-3 p-6 rounded-xl border border-white/[0.04] bg-dark-200/30 hover:border-green-400/30 hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(0,255,136,0.1)] transition-all duration-150">
              <span className="text-green-400/80 group-hover:text-green-400 group-hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.35)] transition-all duration-150 relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                </svg>
              </span>
              <h3 className="font-bold text-base relative">Macro Surprise Engine</h3>
              <p className="text-sm opacity-40 leading-relaxed relative">GDP, CPI, PPI, NFP, PMIs and more are scored against forecast and history — the economic heatmap and eco-surprise gauges flag which economies are beating expectations.</p>
            </div>
            <div className="group relative flex flex-col gap-3 p-6 rounded-xl border border-white/[0.04] bg-dark-200/30 hover:border-green-400/30 hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(0,255,136,0.1)] transition-all duration-150">
              <span className="text-green-400/80 group-hover:text-green-400 group-hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.35)] transition-all duration-150 relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </span>
              <h3 className="font-bold text-base relative">Automated Refresh</h3>
              <p className="text-sm opacity-40 leading-relaxed relative">Retail sentiment is re-pulled every 30 minutes and put/call ratios update before the close — the dashboard never sits on stale numbers.</p>
            </div>
            <div className="group relative flex flex-col gap-3 p-6 rounded-xl border border-white/[0.04] bg-dark-200/30 hover:border-green-400/30 hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(0,255,136,0.1)] transition-all duration-150">
              <span className="text-green-400/80 group-hover:text-green-400 group-hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.35)] transition-all duration-150 relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </span>
              <h3 className="font-bold text-base relative">Institutional Positioning (COT)</h3>
              <p className="text-sm opacity-40 leading-relaxed relative">Latest COT reports, history and trends show where large speculators stand across forex, metals, indices and commodities.</p>
            </div>
            <div className="group relative flex flex-col gap-3 p-6 rounded-xl border border-white/[0.04] bg-dark-200/30 hover:border-green-400/30 hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(0,255,136,0.1)] transition-all duration-150">
              <span className="text-green-400/80 group-hover:text-green-400 group-hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.35)] transition-all duration-150 relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
                </svg>
              </span>
              <h3 className="font-bold text-base relative">Retail & Options Sentiment</h3>
              <p className="text-sm opacity-40 leading-relaxed relative">Crowd long/short positioning and put/call ratios across the majors, metals, crypto, indices and oil give a contrarian read on sentiment.</p>
            </div>
            <div className="group relative flex flex-col gap-3 p-6 rounded-xl border border-white/[0.04] bg-dark-200/30 hover:border-green-400/30 hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(0,255,136,0.1)] transition-all duration-150">
              <span className="text-green-400/80 group-hover:text-green-400 group-hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.35)] transition-all duration-150 relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
                </svg>
              </span>
              <h3 className="font-bold text-base relative">Automated Scoring</h3>
              <p className="text-sm opacity-40 leading-relaxed relative">Every market is distilled into one clear bullish/bearish bias from five components — macro, institutional positioning, retail, trend and seasonality.</p>
            </div>
            <div className="group relative flex flex-col gap-3 p-6 rounded-xl border border-white/[0.04] bg-dark-200/30 hover:border-green-400/30 hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(0,255,136,0.1)] transition-all duration-150">
              <span className="text-green-400/80 group-hover:text-green-400 group-hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.35)] transition-all duration-150 relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              </span>
              <h3 className="font-bold text-base relative">Scorecards & Seasonality</h3>
              <p className="text-sm opacity-40 leading-relaxed relative">Dedicated asset and forex scorecards, 20+ indicators, and monthly & annual seasonality plus a live economic calendar — all in one dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Strip – unchanged */}
      <section className="bg-dark-200 border-y border-white/[0.04] relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16 md:py-20 lg:py-24 relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="relative">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-green-400/40 mb-2 block">auto-refresh</span>
              <p className="text-4xl md:text-5xl font-extrabold tracking-tight text-green-400 font-mono">30m</p>
              <p className="mt-2 text-sm opacity-40">Retail sentiment refreshes every 30 minutes</p>
            </div>
            <div className="relative">
              <div className="hidden md:block absolute -left-0 top-1/2 -translate-y-1/2 h-12 w-px bg-white/[0.06]"></div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-green-400/40 mb-2 block">coverage</span>
              <p className="text-4xl md:text-5xl font-extrabold tracking-tight text-green-400 font-mono">20+</p>
              <p className="mt-2 text-sm opacity-40">Macro indicators scored across 8 major economies</p>
            </div>
            <div className="relative">
              <div className="hidden md:block absolute -left-0 top-1/2 -translate-y-1/2 h-12 w-px bg-white/[0.06]"></div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-green-400/40 mb-2 block">markets</span>
              <p className="text-4xl md:text-5xl font-extrabold tracking-tight text-green-400 font-mono">27</p>
              <p className="mt-2 text-sm opacity-40">Forex pairs plus metals, crypto, indices and oil</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA – unchanged */}
      <section className="bg-dark-200 relative overflow-hidden">
        <div className="texture-grain absolute inset-0 pointer-events-none"></div>
        <div className="py-16 md:py-20 lg:py-24 px-4 sm:px-8 max-w-3xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px w-8 bg-green-400/50"></div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-green-400/80">get started</span>
            <div className="h-px w-8 bg-green-400/50"></div>
          </div>
          <h2 className="font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight mb-6">Be first to the next release</h2>
          <p className="text-base sm:text-lg opacity-50 mb-8 md:mb-10">Get the full MacroPulse dashboard — positioning, sentiment, seasonality and macro scoring in one place. 30-day money-back guarantee, cancel anytime.</p>
          <button
            onClick={handleGetStarted}
            className="bg-green-500 hover:bg-green-600 text-dark-100 font-bold px-8 py-3 rounded-lg transition shadow-[0_0_8px_rgba(0,255,136,0.2)] hover:shadow-[0_4px_16px_rgba(0,255,136,0.2)] w-full sm:w-auto"
          >
            Start trading faster
          </button>
        </div>
      </section>

      {/* Contact Section – new */}
      <section id="contact" className="bg-dark-200 border-y border-dark-300 py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">Get in Touch</h3>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Have questions about our data, scoring, or platform? We're here to help.
          </p>
          <div className="bg-dark-100 p-6 rounded-xl border border-dark-300 max-w-md mx-auto text-left space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">📧</span>
              <a href="mailto:support@macropulse.io" className="text-green-400 hover:underline">
                support@macropulse.io
              </a>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">💬</span>
              <a href="#" className="text-green-400 hover:underline">Join our WhatsApp Community</a>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">🐦</span>
              <a href="#" className="text-green-400 hover:underline">Follow @MacroPulse</a>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-6">We typically respond within 24 hours.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm border-t border-dark-300">
        <p>© 2026 MacroPulse. All rights reserved. | <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a> | <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></p>
        <p className="text-xs mt-1">Forex trading involves substantial risk. Past performance does not guarantee future results.</p>
      </footer>
    </div>
  );
};

export default Landing;