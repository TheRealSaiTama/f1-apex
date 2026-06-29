import React, { useState, useEffect, useRef } from 'react'

// Character split helper for Hero Headline
function splitLetters(text, className = "hero-char") {
  return text.split("").map((char, i) => (
    <span key={i} className={className} style={{ display: 'inline-block' }}>
      {char === " " ? "\u00A0" : char}
    </span>
  ))
}

// Word split helper for Hero Subtitle
function splitWords(text, className = "subtitle-word") {
  return text.split(" ").map((word, i) => (
    <span key={i} className="subtitle-word-wrapper" style={{ display: 'inline-block', marginRight: '0.25em', overflow: 'hidden' }}>
      <span className={className} style={{ display: 'inline-block' }}>
        {word}
      </span>
    </span>
  ))
}

// Convert seconds (e.g. 72.909) back to "m:ss.ms" for odometer update
function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  const ms = Math.round((sec % 1) * 1000)
  return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
}

// Map key strings to their inline React SVG component representation
function getTechIcon(iconType) {
  switch (iconType) {
    case 'power':
      return (
        <svg className="tech-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 36 L24 12 L40 36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 28 L34 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
          <circle cx="24" cy="12" r="3" fill="currentColor"/>
        </svg>
      )
    case 'aero':
      return (
        <svg className="tech-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 38 C10 20 38 20 42 38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M14 38 C17 28 31 28 34 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
          <line x1="24" y1="10" x2="24" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    case 'tyres':
      return (
        <svg className="tech-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2.5"/>
          <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
          <path d="M24 8 L24 12 M24 36 L24 40 M8 24 L12 24 M36 24 L40 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    case 'telemetry':
      return (
        <svg className="tech-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <rect x="12" y="16" width="24" height="16" rx="3" stroke="currentColor" strokeWidth="2.5"/>
          <path d="M18 24 L22 20 L26 24 L30 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
          <path d="M12 24 L8 24 M36 24 L40 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
        </svg>
      )
    default:
      return null
  }
}

export default function App() {
  const [ticker, setTicker] = useState([])
  const [featured, setFeatured] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [calendar, setCalendar] = useState([])
  const [tech, setTech] = useState([])
  const [teams, setTeams] = useState([])
  const [circuit, setCircuit] = useState(null)
  const [news, setNews] = useState([])
  const [gallery, setGallery] = useState([])

  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [introPlaying, setIntroPlaying] = useState(true)

  // DOM Refs for scroll triggers
  const pathRef = useRef(null)
  const subscribeTitleRef = useRef(null)
  const videoRef = useRef(null)

  // Fetch all dashboard metrics from the Go REST API
  // ponytail: fetch everything in Promise.all to trigger a single state update, avoiding multiple re-renders and GSAP/DOM pinning clashes
  useEffect(() => {
    Promise.all([
      fetch('/api/ticker').then(res => res.json()),
      fetch('/api/featured-race').then(res => res.json()),
      fetch('/api/drivers').then(res => res.json()),
      fetch('/api/calendar').then(res => res.json()),
      fetch('/api/tech').then(res => res.json()),
      fetch('/api/teams').then(res => res.json()),
      fetch('/api/circuit').then(res => res.json()),
      fetch('/api/news').then(res => res.json()),
      fetch('/api/gallery').then(res => res.json())
    ]).then(([tickerVal, featuredVal, driversVal, calendarVal, techVal, teamsVal, circuitVal, newsVal, galleryVal]) => {
      setTicker(tickerVal)
      setFeatured(featuredVal)
      setDrivers(driversVal)
      setCalendar(calendarVal)
      setTech(techVal)
      setTeams(teamsVal)
      setCircuit(circuitVal)
      setNews(newsVal)
      setGallery(galleryVal)
      setLoading(false)
    }).catch(console.error)
  }, [])

  // Autoplay video handling and scroll/time transitions
  useEffect(() => {
    if (loading) return
    const video = videoRef.current
    if (!video) return

    video.play().catch(console.error)

    const handleTimeUpdate = () => {
      if (video.currentTime >= 5 && introPlaying) {
        setIntroPlaying(false)
        video.loop = true
        video.play().catch(console.error)
      }
    }

    const handleScroll = () => {
      if (window.scrollY > 10 && introPlaying) {
        setIntroPlaying(false)
        video.loop = true
        video.play().catch(console.error)
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [loading, introPlaying])

  // Hook up GSAP, ScrollTrigger, and Lenis smooth scrolling
  useEffect(() => {
    if (loading) return

    // Make sure global scripts are loaded
    const { gsap, ScrollTrigger, Lenis } = window
    if (!gsap || !ScrollTrigger || !Lenis) return

    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger)

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      // Setup simple counts and skip timeline builds
      gsap.to('.points-fill', { width: (i, el) => el.getAttribute('data-pct') + '%', duration: 1 })
      return
    }

    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      gestureOrientation: 'vertical',
    })

    // Hook Lenis into GSAP ticker
    const tickHandler = (time) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tickHandler)
    gsap.ticker.lagSmoothing(0)

    lenis.on('scroll', ScrollTrigger.update)

    // 0. Red Scroll Progress Bar
    gsap.to('#scroll-progress', {
      width: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: true
      }
    })

    // 1. Navigation Scrolled Highlight
    const handleScroll = () => {
      setScrolled(window.scrollY > 60)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Update active nav highlights on scroll
    const sections = ['races', 'drivers', 'teams', 'circuits', 'news']
    sections.forEach((id) => {
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top 40%',
        end: 'bottom 40%',
        onToggle: (self) => {
          if (self.isActive) {
            document.querySelectorAll('.nav-links a').forEach(link => {
              if (link.getAttribute('href') === `#${id}`) {
                link.classList.add('active')
              } else {
                link.classList.remove('active')
              }
            })
          }
        }
      })
    })

    // 2. HERO Pinned Cinematic Timeline (300vh)
    const heroTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: '+=300%',
        pin: true,
        scrub: 1
      }
    })

    // Fanning headline letters setup
    const chars = gsap.utils.toArray('.hero-char')
    chars.forEach((char) => {
      gsap.set(char, {
        x: () => gsap.utils.random(-300, 300),
        y: () => gsap.utils.random(-150, 150),
        rotation: () => gsap.utils.random(-45, 45),
        opacity: 0
      })
    })

    heroTl.to(chars, {
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      stagger: {
        each: 0.015,
        from: 'random'
      },
      willChange: 'transform, opacity',
      ease: 'power3.out'
    }, 0)

    // Silhouette scale + blur
    heroTl.to('.hero-car-silhouette', {
      scale: 1.25,
      filter: 'blur(15px)',
      opacity: 0.3,
      willChange: 'transform, filter',
      ease: 'power1.out'
    }, 0)

    // Speed lines
    heroTl.to('.speed-line', {
      width: '100%',
      opacity: 0.8,
      stagger: 0.1,
      willChange: 'width',
      ease: 'none'
    }, 0)

    // Subtitle reveal clipPath
    heroTl.to('.subtitle-word', {
      clipPath: 'inset(0 0% 0 0)',
      stagger: 0.04,
      willChange: 'clip-path',
      ease: 'power2.out'
    }, 0.2)

    // Hero Stats Count up (Fires once on scroll entry)
    ScrollTrigger.create({
      trigger: '.hero-stats',
      start: 'top 90%',
      onEnter: () => {
        document.querySelectorAll('.hero-stat-value').forEach((el) => {
          const targetStr = el.getAttribute('data-target')
          const match = targetStr.match(/^([0-9.]+)(.*)$/)
          if (!match) return
          const targetNum = parseFloat(match[1])
          const suffix = match[2]

          const obj = { val: 0 }
          gsap.to(obj, {
            val: targetNum,
            duration: 2.2,
            ease: 'power3.out',
            onUpdate: () => {
              if (targetNum % 1 !== 0) {
                el.innerText = obj.val.toFixed(1) + suffix
              } else {
                el.innerText = Math.round(obj.val) + suffix
              }
            }
          })
        })
      },
      once: true
    })

    // 3. FEATURED RACE Timeline (Diptych Reveal)
    if (featured) {
      const featuredTl = gsap.timeline({
        scrollTrigger: {
          trigger: '.featured-race',
          start: 'top 85%',
          end: 'bottom 30%',
          scrub: 1
        }
      })

      featuredTl.from('.race-flag', {
        x: -120,
        opacity: 0,
        willChange: 'transform, opacity',
        ease: 'power2.out'
      }, 0)

      featuredTl.from('.race-round', {
        y: 20,
        opacity: 0,
        willChange: 'transform, opacity',
        duration: 0.4
      }, 0.2)

      featuredTl.from('.featured-race-word', {
        y: 15,
        opacity: 0,
        stagger: 0.08,
        willChange: 'transform, opacity',
        duration: 0.4
      }, 0.3)

      featuredTl.from('.race-location', {
        y: 15,
        opacity: 0,
        willChange: 'transform, opacity',
        duration: 0.4
      }, 0.5)

      featuredTl.from('.race-meta-item', {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        willChange: 'transform, opacity',
        duration: 0.4
      }, 0.6)

      featuredTl.from('.featured-race .btn-primary', {
        y: 20,
        opacity: 0,
        willChange: 'transform, opacity',
        duration: 0.4
      }, 0.8)

      featuredTl.from('.lap-timer', {
        y: 20,
        opacity: 0,
        willChange: 'transform, opacity',
        duration: 0.4
      }, 0.9)

      // Lap Record odometer counter (Snap + onUpdate)
      const timerObj = { val: 0 }
      featuredTl.to(timerObj, {
        val: 72.909,
        ease: 'power1.inOut',
        duration: 1.6,
        onUpdate: () => {
          const el = document.querySelector('.lap-timer-value')
          if (el) el.innerText = formatTime(timerObj.val)
        }
      }, 0.4)
    }

    // 4. DRIVER STANDINGS Pinning + Card Fan out (200vh)
    const standingsTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.standings-section',
        start: 'top top',
        end: '+=200%',
        pin: true,
        scrub: 1
      }
    })

    const cards = gsap.utils.toArray('.driver-card-absolute')
    if (cards.length === 3) {
      // Set initial center stack offsets
      gsap.set(cards[0], { x: '105%', y: 0, clipPath: 'inset(0 0 100% 0)' })
      gsap.set(cards[1], { x: '0%', y: 20, clipPath: 'inset(0 0 100% 0)' })
      gsap.set(cards[2], { x: '-105%', y: 40, clipPath: 'inset(0 0 100% 0)' })

      standingsTl.to(cards, {
        x: '0%',
        y: 0,
        clipPath: 'inset(0 0 0% 0)',
        stagger: 0.15,
        willChange: 'transform, clip-path',
        ease: 'power3.inOut'
      })

      // Points bar filling with trailing glow
      const bars = gsap.utils.toArray('.points-fill')
      bars.forEach((bar) => {
        const targetVal = bar.getAttribute('data-pct')
        standingsTl.fromTo(bar,
          { width: '0%' },
          { width: `${targetVal}%`, willChange: 'width', ease: 'power2.out' },
          0.6
        )
      })
    }

    // 5. RACE CALENDAR Timeline (Parallax grid + clipPath reveal)
    const calendarTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.calendar-section',
        start: 'top 85%',
        end: 'bottom 30%',
        scrub: 1
      }
    })

    calendarTl.from('[role="table"]', {
      y: 120,
      willChange: 'transform',
      ease: 'power2.out'
    }, 0)

    calendarTl.to('.calendar-row', {
      clipPath: 'inset(0 0% 0 0)',
      stagger: 0.05,
      willChange: 'clip-path',
      ease: 'power1.out'
    }, 0)

    // 6. TECH SECTION Pinned modular display (400vh)
    const techTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.tech-section',
        start: 'top top',
        end: '+=400%',
        pin: true,
        scrub: 1
      }
    })

    const techCards = gsap.utils.toArray('.tech-card, .tech-card-big')
    if (techCards.length === 4) {
      gsap.set(techCards, { scale: 0.6, opacity: 0, clipPath: 'inset(100% 0 0 0)' })

      // Power Unit card scale + clip reveal
      techTl.to(techCards[0], {
        scale: 1,
        opacity: 1,
        clipPath: 'inset(0% 0 0 0)',
        willChange: 'transform, opacity, clip-path',
        duration: 1,
        ease: 'power2.out'
      }, 0)

      const count0 = { val: 0 }
      techTl.to(count0, {
        val: 1000,
        snap: 'val',
        duration: 0.8,
        onUpdate: () => {
          const el = document.querySelector('.tech-metric-value-0')
          if (el) el.innerText = Math.round(count0.val) + "+ HP"
        }
      }, 0.2)

      // Aero card entrance, PU fades to 60%
      techTl.to(techCards[1], {
        scale: 1,
        opacity: 1,
        clipPath: 'inset(0% 0 0 0)',
        willChange: 'transform, opacity, clip-path',
        duration: 1,
        ease: 'power2.out'
      }, 1.2)
      techTl.to(techCards[0], { opacity: 0.6, willChange: 'opacity', duration: 0.8 }, 1.2)

      const count1 = { val: 0 }
      techTl.to(count1, {
        val: 750,
        snap: 'val',
        duration: 0.8,
        onUpdate: () => {
          const el = document.querySelector('.tech-metric-value-1')
          if (el) el.innerText = Math.round(count1.val) + " kg"
        }
      }, 1.4)

      // Tyres card entrance, previous card opacity fades further
      techTl.to(techCards[2], {
        scale: 1,
        opacity: 1,
        clipPath: 'inset(0% 0 0 0)',
        willChange: 'transform, opacity, clip-path',
        duration: 1,
        ease: 'power2.out'
      }, 2.4)
      techTl.to(techCards[0], { opacity: 0.35, willChange: 'opacity', duration: 0.8 }, 2.4)
      techTl.to(techCards[1], { opacity: 0.6, willChange: 'opacity', duration: 0.8 }, 2.4)

      const count2 = { val: 0 }
      techTl.to(count2, {
        val: 5,
        snap: 'val',
        duration: 0.8,
        onUpdate: () => {
          const el = document.querySelector('.tech-metric-value-2')
          if (el) el.innerText = Math.round(count2.val) + " Types"
        }
      }, 2.6)

      // Telemetry card entrance
      techTl.to(techCards[3], {
        scale: 1,
        opacity: 1,
        clipPath: 'inset(0% 0 0 0)',
        willChange: 'transform, opacity, clip-path',
        duration: 1,
        ease: 'power2.out'
      }, 3.6)
      techTl.to(techCards[1], { opacity: 0.35, willChange: 'opacity', duration: 0.8 }, 3.6)
      techTl.to(techCards[2], { opacity: 0.6, willChange: 'opacity', duration: 0.8 }, 3.6)

      const count3 = { val: 0 }
      techTl.to(count3, {
        val: 1500,
        snap: 'val',
        duration: 0.8,
        onUpdate: () => {
          const el = document.querySelector('.tech-metric-value-3')
          if (el) el.innerText = Math.round(count3.val) + "+"
        }
      }, 3.8)

      // Settle all back to full opacity at the 100% mark
      techTl.to(techCards, {
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out'
      }, 4.6)
    }

    // 7. TEAMS MARQUEE Cursor parallax depth
    const teamsSection = document.querySelector('.teams-section')
    let onTeamsMouseMove
    if (teamsSection) {
      const targetX1 = gsap.quickTo('.teams-marquee-container-row-1', 'x', { duration: 0.8, ease: 'power3.out' })
      const targetX2 = gsap.quickTo('.teams-marquee-container-row-2', 'x', { duration: 0.8, ease: 'power3.out' })

      onTeamsMouseMove = (e) => {
        const rect = teamsSection.getBoundingClientRect()
        const pct = (e.clientX - rect.left) / rect.width - 0.5
        targetX1(pct * 40)  // shift row 1 by ±20px
        targetX2(-pct * 40) // shift row 2 by opposite
      }
      teamsSection.addEventListener('mousemove', onTeamsMouseMove)
    }

    // 8. CIRCUIT SPOTLIGHT Timeline (SVG drawing + turn labels)
    const circuitTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.circuit-section',
        start: 'top 80%',
        end: 'bottom 35%',
        scrub: 1
      }
    })

    if (pathRef.current) {
      const len = pathRef.current.getTotalLength()
      gsap.set(pathRef.current, { strokeDasharray: len, strokeDashoffset: len })

      circuitTl.to(pathRef.current, {
        strokeDashoffset: 0,
        willChange: 'stroke-dashoffset',
        duration: 2,
        ease: 'none'
      }, 0)
    }

    // Fade Monaco turn labels at path checkpoints
    gsap.set(['.label-mirabeau', '.label-fairmont', '.label-rascasse'], { opacity: 0 })
    circuitTl.to('.label-mirabeau', { opacity: 0.85, duration: 0.3 }, 0.6)
    circuitTl.to('.label-fairmont', { opacity: 0.85, duration: 0.3 }, 1.0)
    circuitTl.to('.label-rascasse', { opacity: 0.85, duration: 0.3 }, 1.6)

    // Specs grid items pop in with bounce stagger
    circuitTl.from('.circuit-spec', {
      scale: 0.9,
      opacity: 0,
      stagger: 0.1,
      willChange: 'transform, opacity',
      duration: 0.6,
      ease: 'back.out(1.7)'
    }, 0.6)

    // Data text slides in
    circuitTl.from('.circuit-data', {
      x: 60,
      opacity: 0,
      willChange: 'transform, opacity',
      duration: 1.2
    }, 0)

    // 9. GALLERY Grid wipe reveal + parallax
    const galleryTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.gallery-section',
        start: 'top 90%',
        end: 'bottom 20%',
        scrub: 1
      }
    })

    galleryTl.from('.gallery-grid', {
      y: 40,
      willChange: 'transform',
      ease: 'none'
    }, 0)

    galleryTl.to('.gallery-item img', {
      clipPath: 'inset(0% 0 0 0)',
      stagger: 0.08,
      willChange: 'clip-path',
      ease: 'power2.out'
    }, 0)

    // 10. NEWS CARDS 3D tilt entry
    const newsTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.news-section',
        start: 'top 85%',
        end: 'bottom 40%',
        scrub: 1
      }
    })

    newsTl.from('.news-card', {
      rotateX: 12,
      y: 60,
      opacity: 0,
      stagger: 0.12,
      willChange: 'transform, opacity',
      ease: 'power2.out'
    })

    // 11. SUBSCRIBE BANNER character scramble resolution
    ScrollTrigger.create({
      trigger: '.subscribe-section',
      start: 'top 85%',
      onEnter: () => {
        const el = subscribeTitleRef.current
        if (!el) return

        const targetText = "NEVER MISS A LAP"
        const charsList = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
        let iteration = 0

        const interval = setInterval(() => {
          el.innerHTML = targetText.split("")
            .map((char, index) => {
              if (char === " " || char === "\n") return char
              if (index < iteration) {
                return targetText[index]
              }
              return charsList[Math.floor(Math.random() * charsList.length)]
            })
            .join("")

          if (iteration >= targetText.length) {
            clearInterval(interval)
            el.innerHTML = "NEVER MISS<br />A LAP"
          }
          iteration += 1 / 3
        }, 35)
      },
      once: true
    })

    // Cleanup scrolling bindings on unmount
    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill())
      if (typeof tickHandler === 'function') {
        gsap.ticker.remove(tickHandler)
      }
      lenis.destroy()
      window.removeEventListener('scroll', handleScroll)
      if (teamsSection && onTeamsMouseMove) {
        teamsSection.removeEventListener('mousemove', onTeamsMouseMove)
      }
    }
  }, [loading, ticker, featured, drivers, calendar, tech, teams, circuit, news, gallery])

  const handleSubscribe = async (e) => {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (response.ok) {
        setSubscribed(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // News mouse tilt callbacks (Quick 3D hover)
  const handleNewsMouseMove = (e) => {
    const { gsap } = window
    if (!gsap) return
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const rX = -(y / (rect.height / 2)) * 6
    const rY = (x / (rect.width / 2)) * 6

    gsap.to(card, {
      rotateX: rX,
      rotateY: rY,
      transformPerspective: 1000,
      duration: 0.4,
      ease: 'power2.out'
    })
  }

  const handleNewsMouseLeave = (e) => {
    const { gsap } = window
    if (!gsap) return
    const card = e.currentTarget
    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.6,
      ease: 'power2.out'
    })
  }

  const doubledTeams = [...teams, ...teams]
  const doubledTicker = [...ticker, ...ticker]

  return (
    <>
      {/* GLOBAL RED SCROLL PROGRESS BAR */}
      <div id="scroll-progress" aria-hidden="true"></div>

      {/* SKIP LINK FOR ACCESSIBILITY */}
      <a href="#main" className="sr-only" style={{
        position: 'absolute',
        top: 'var(--space-2)',
        left: 'var(--space-2)',
        background: 'var(--color-primary)',
        color: '#fff',
        padding: 'var(--space-2) var(--space-4)',
        borderRadius: 'var(--radius-sm)',
        zIndex: 999,
        fontFamily: 'var(--font-display)',
        textTransform: 'uppercase',
        fontWeight: 700,
        letterSpacing: '0.08em'
      }}>
        Skip to content
      </a>

      {/* NAVIGATION */}
      <nav id="navbar" role="navigation" aria-label="Main navigation" className={scrolled ? 'scrolled' : ''}>
        <a href="#" className="nav-logo" aria-label="F1 Apex home">
          <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <polygon points="0,18 12,0 24,0 12,18 24,36 12,36" fill="#e10600"/>
            <polygon points="14,18 26,4 36,4 24,18 36,32 26,32" fill="#ffffff" opacity="0.85"/>
          </svg>
          <span>F1<span className="logo-f1-red"> APEX</span></span>
        </a>
        <ul className="nav-links" role="list">
          <li><a href="#races">Races</a></li>
          <li><a href="#drivers">Drivers</a></li>
          <li><a href="#teams">Teams</a></li>
          <li><a href="#circuits">Circuits</a></li>
          <li><a href="#news">News</a></li>
        </ul>
        <a href="#subscribe" className="nav-cta">Get Passes</a>
      </nav>

      {/* LIVE TICKER MARQUEE */}
      <div className="ticker-bar" aria-label="Live race updates ticker" role="marquee">
        <div className="ticker-track" aria-hidden="true">
          {doubledTicker.map((item, idx) => (
            <span className="ticker-item" key={idx}>
              <span className="ticker-dot"></span>
              {item.text}
            </span>
          ))}
        </div>
      </div>

      <main id="main">
        {/* HERO SECTION */}
        <section className="hero" aria-label="Hero">
          <div className="hero-bg" aria-hidden="true"></div>
          {/* HERO BACKGROUND VIDEO */}
          <video
            ref={videoRef}
            className={`hero-video ${scrolled || !introPlaying ? 'background-blurred' : 'center-active'}`}
            src="/ferrari.mp4"
            muted
            playsInline
            autoPlay
          />
          {/* VIDEO QUALITY ENHANCEMENT MESH OVERLAY */}
          <div
            className={`hero-video-overlay ${scrolled || !introPlaying ? 'blurred' : 'active'}`}
            aria-hidden="true"
          ></div>
          <div className="hero-speed-lines" aria-hidden="true">
            <div className="speed-line" style={{ top: '20%', width: '0vw', animation: 'none' }}></div>
            <div className="speed-line" style={{ top: '32%', width: '0vw', animation: 'none' }}></div>
            <div className="speed-line" style={{ top: '48%', width: '0vw', animation: 'none' }}></div>
            <div className="speed-line" style={{ top: '62%', width: '0vw', animation: 'none' }}></div>
            <div className="speed-line" style={{ top: '75%', width: '0vw', animation: 'none' }}></div>
          </div>

          <div className="hero-car-silhouette" aria-hidden="true" style={{ transform: 'scale(0.1)' }}>
            <svg viewBox="0 0 900 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M60 140 Q80 90 160 80 L200 60 L420 50 Q480 48 520 55 L600 70 Q640 75 680 80 L780 90 Q820 100 840 120 L860 140 Z" fill="white"/>
              <ellipse cx="180" cy="148" rx="45" ry="32" fill="white"/>
              <ellipse cx="700" cy="148" rx="45" ry="32" fill="white"/>
              <path d="M200 75 L240 30 L320 28 L360 70" fill="white"/>
              <path d="M440 52 L460 20 L500 18 L520 50" fill="white"/>
              <rect x="800" y="100" width="80" height="8" rx="4" fill="white" opacity="0.6"/>
              <rect x="10" y="108" width="90" height="8" rx="4" fill="white" opacity="0.6"/>
            </svg>
          </div>

          <div className="hero-content">
            <div className="hero-eyebrow">2026 Formula 1 World Championship</div>
            <h1 className="hero-title">
              <div className="hero-title-line">
                {splitLetters("Where Speed")}
              </div>
              <div className="hero-title-line red">
                {splitLetters("Becomes")}
              </div>
              <div className="hero-title-line">
                {splitLetters("Legend")}
              </div>
            </h1>
            <p className="hero-subtitle">
              {splitWords("24 races. 20 drivers. 10 teams. One world champion. Follow every overtake, every pit stop, and every heartbeat of the greatest motorsport on Earth.")}
            </p>
            <div className="hero-actions">
              <a href="#races" className="btn-primary">View Race Calendar</a>
              <a href="#drivers" className="btn-ghost">Driver Standings</a>
            </div>
            <div className="hero-stats" role="list">
              <div role="listitem">
                <div className="hero-stat-value" data-target="24">0</div>
                <div className="hero-stat-label">Grands Prix</div>
              </div>
              <div role="listitem">
                <div className="hero-stat-value" data-target="20">0</div>
                <div className="hero-stat-label">Drivers</div>
              </div>
              <div role="listitem">
                <div className="hero-stat-value" data-target="350+">0+</div>
                <div className="hero-stat-label">km/h Top Speed</div>
              </div>
              <div role="listitem">
                <div className="hero-stat-value" data-target="1.5s">0s</div>
                <div className="hero-stat-label">Pit Stop Record</div>
              </div>
            </div>
          </div>

          {!introPlaying && !scrolled && (
            <div className="scroll-prompt">
              <span className="scroll-prompt-text">Scroll to Begin</span>
              <svg className="scroll-prompt-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          <div className="scroll-indicator" aria-hidden="true">
            <span>Scroll</span>
            <div className="scroll-line"></div>
          </div>
        </section>

        {/* FEATURED RACE SECTION */}
        {featured && (
          <section className="featured-race" id="races" aria-labelledby="featured-race-title">
            <div className="container">
              <div className="section-eyebrow">Next Race</div>
              <div className="featured-grid">
                <div>
                  <div className="race-flag">
                    <img
                      src="https://picsum.photos/seed/monaco-f1-circuit/800/500"
                      alt="Monaco street circuit aerial view"
                      className="race-flag-img"
                      width="800" height="500" loading="lazy"
                    />
                    <div className="race-flag-overlay"></div>
                    <div className="race-flag-badge">{featured.round}</div>
                  </div>
                </div>
                <div className="race-info">
                  <div className="race-round">{featured.roundLong}</div>
                  <h2 className="race-name" id="featured-race-title">
                    {splitWords(featured.name, "featured-race-word")}
                  </h2>
                  <div className="race-location">{featured.location}</div>
                  <div className="race-meta">
                    <div className="race-meta-item">
                      <div className="race-meta-label">Race Date</div>
                      <div className="race-meta-value">{featured.date}</div>
                    </div>
                    <div className="race-meta-item">
                      <div className="race-meta-label">Laps</div>
                      <div className="race-meta-value">{featured.laps}</div>
                    </div>
                    <div className="race-meta-item">
                      <div className="race-meta-label">Distance</div>
                      <div className="race-meta-value">{featured.distance}</div>
                    </div>
                  </div>
                  <a href="#" className="btn-primary" style={{ display: 'inline-block' }}>Race Preview →</a>
                  <div className="lap-timer" role="group" aria-label="Circuit lap record">
                    <div>
                      <div className="lap-timer-label">Lap Record</div>
                      <div className="lap-timer-value">0:00.000</div>
                    </div>
                    <div style={{ color: 'var(--color-text-faint)', fontFamily: 'var(--font-display)', fontSize: 'var(--text-xs)', marginLeft: 'auto', textAlign: 'right' }}>
                      {featured.recordHolder}<br />{featured.recordYear}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* DRIVER STANDINGS SECTION */}
        <section className="standings-section" id="drivers" aria-labelledby="standings-title">
          <div className="container">
            <div className="section-eyebrow">2026 Season</div>
            <h2 className="section-title reveal" id="standings-title">Driver<br />Standings</h2>
            <p className="section-desc reveal">The championship battle tightens with every lap. Track every point, every podium, and every fastest lap in the 2026 season.</p>
            
            <div className="standings-wrapper">
              {drivers.map((driver, index) => {
                const getDriverImg = (name) => {
                  if (name.includes("Verstappen")) return "/max_verstappen.png"
                  if (name.includes("Leclerc")) return "/charles_leclerc.png"
                  if (name.includes("Norris")) return "/lando_norris.png"
                  return ""
                }
                const imgUrl = getDriverImg(driver.name)
                return (
                  <article
                    className="driver-card driver-card-absolute"
                    key={driver.number}
                    aria-label={`Driver card: ${driver.name}`}
                    style={{ left: `${index * 34}%` }}
                  >
                    <div className="driver-card-header" style={{ background: 'linear-gradient(135deg,#1a0000,#0d0d0d)' }}>
                      {imgUrl && (
                        <img 
                          className="driver-card-image" 
                          src={imgUrl} 
                          alt={driver.name} 
                          loading="lazy"
                        />
                      )}
                      <div className="driver-number">{driver.number}</div>
                      <div className={`driver-pos ${driver.position === 2 ? 'p2' : driver.position === 3 ? 'p3' : ''}`} aria-label={`Position ${driver.position}`}>
                        {driver.position}
                      </div>
                    </div>
                  <div className="driver-card-body">
                    <div className="driver-team">{driver.team}</div>
                    <div className="driver-name">{driver.name}</div>
                    <div className="points-bar">
                      <div
                        className="points-fill"
                        data-pct={driver.pct}
                        style={{
                          width: '0%',
                          background: driver.position === 2 ? 'var(--color-text-muted)' : driver.position === 3 ? 'var(--color-gold-dim)' : 'var(--color-primary)'
                        }}
                        role="progressbar"
                        aria-valuenow={driver.pct}
                        aria-label="Points relative to leader"
                      ></div>
                    </div>
                    <div className="driver-stats">
                      <div><div className="driver-stat-label">Points</div><div className="driver-stat-value">{driver.points}</div></div>
                      <div><div className="driver-stat-label">Wins</div><div className="driver-stat-value">{driver.wins}</div></div>
                      <div><div className="driver-stat-label">Poles</div><div className="driver-stat-value">{driver.poles}</div></div>
                    </div>
                  </div>
                </article>
              )})}
            </div>

            <div style={{ textAlign: 'center', marginTop: 'var(--space-10)' }}>
              <a href="#" className="btn-ghost">Full Standings →</a>
            </div>
          </div>
        </section>

        {/* RACE CALENDAR LIST TABLE */}
        <section className="calendar-section" id="races-list" aria-labelledby="calendar-title">
          <div className="container">
            <div className="section-eyebrow">Schedule</div>
            <h2 className="section-title reveal" id="calendar-title">2026 Race<br />Calendar</h2>
            <p className="section-desc reveal">Every circuit, every date, every showdown. Mark your calendar for the races that will define a generation.</p>
            <div role="table" aria-label="2026 F1 Race Calendar">
              <div className="calendar-row calendar-header" role="row" aria-hidden="true" style={{ clipPath: 'inset(0 0 0 0)' }}>
                <div>Rnd</div><div>Grand Prix</div><div>Date</div><div>Status</div>
              </div>
              {calendar.map((race) => (
                <div className="calendar-row" role="row" key={race.round}>
                  <div className="calendar-rnd" role="cell">{race.round}</div>
                  <div role="cell">
                    <div className="calendar-name">{race.name}</div>
                    <div className="calendar-circuit">{race.circuit}</div>
                  </div>
                  <div className="calendar-date" role="cell">{race.date}</div>
                  <div role="cell">
                    <span className={`race-badge ${
                      race.status === 'Completed' ? 'badge-completed' :
                      race.status === 'Live Now' ? 'badge-live' : 'badge-upcoming'
                    }`}>
                      {race.status}
                    </span>
                  </div>
                  <div className="calendar-laps" role="cell">{race.laps} laps</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
              <a href="#" className="btn-ghost">View All 24 Races →</a>
            </div>
          </div>
        </section>

        {/* TECHNOLOGY ENGINEERING SECTION */}
        <section className="tech-section" aria-labelledby="tech-title">
          <div className="container">
            <div className="section-eyebrow">Engineering</div>
            <h2 className="section-title reveal" id="tech-title">The Science<br />of Speed</h2>
            <p className="section-desc reveal">Modern Formula 1 cars are the most sophisticated machines ever raced on public roads. Every component engineered for one purpose.</p>
            <div className="tech-grid">
              {tech.map((item, idx) => {
                if (idx === 0) {
                  return (
                    <div key={idx} className="tech-card-big" style={{ background: 'linear-gradient(160deg,var(--color-surface) 0%,var(--color-primary-highlight) 100%)' }}>
                      {getTechIcon(item.icon)}
                      <div className="tech-card-label">{item.category}</div>
                      <div className="tech-card-title">{item.title.split(' ').map((w, i) => <React.Fragment key={i}>{w}<br/></React.Fragment>)}</div>
                      <div className="tech-card-desc">{item.description}</div>
                      <div className="tech-metric">
                        <div><div className="tech-metric-label">{item.metricLabel}</div></div>
                        <div className="tech-metric-value tech-metric-value-0">0+ HP</div>
                      </div>
                    </div>
                  )
                }
                return (
                  <div key={idx} className="tech-card">
                    {getTechIcon(item.icon)}
                    <div className="tech-card-label">{item.category}</div>
                    <div className="tech-card-title">{item.title}</div>
                    <div className="tech-card-desc">{item.description}</div>
                    <div className="tech-metric">
                      <div><div className="tech-metric-label">{item.metricLabel}</div></div>
                      <div className={`tech-metric-value tech-metric-value-${idx}`}>0</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* TEAMS MARQUEE */}
        <section className="teams-section" id="teams" aria-labelledby="teams-title">
          <div className="container">
            <div className="section-eyebrow">Constructors</div>
            <h2 className="section-title reveal" id="teams-title">The Teams</h2>
          </div>
          <div className="teams-marquee" aria-label="F1 teams marquee" role="list">
            <div className="teams-marquee-container-row-1">
              <div className="teams-track-1" aria-hidden="true">
                {doubledTeams.map((team, idx) => (
                  <div className="team-card" role="listitem" key={idx}>
                    <div className="team-color-bar" style={{ backgroundColor: team.color }}></div>
                    <div className="team-name">{team.name}</div>
                    <div className="team-pts">{team.points} pts</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="teams-marquee-container-row-2" style={{ marginTop: 'var(--space-4)' }}>
              <div className="teams-track-2" aria-hidden="true">
                {doubledTeams.map((team, idx) => (
                  <div className="team-card" role="listitem" key={idx}>
                    <div className="team-color-bar" style={{ backgroundColor: team.color }}></div>
                    <div className="team-name">{team.name}</div>
                    <div className="team-pts">{team.points} pts</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CIRCUIT SPOTLIGHT SECTION */}
        {circuit && (
          <section className="circuit-section" id="circuits" aria-labelledby="circuit-title">
            <div className="container">
              <div className="section-eyebrow">Circuit Focus</div>
              <div className="circuit-layout">
                <div className="circuit-svg-wrap">
                  <div className="circuit-svg-bg" aria-hidden="true"></div>
                  <svg viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Monaco circuit layout" role="img">
                    <path
                      ref={pathRef}
                      d="M200 460 L60 420 L40 340 L80 280 L100 200 L140 150 L180 120 L220 100 L280 90 L340 100 L360 150 L340 220 L300 260 L340 300 L360 360 L320 420 L280 460 Z"
                      stroke="var(--color-primary)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
                    <circle cx="140" cy="150" r="5" fill="var(--color-gold)" opacity="0.8"/>
                    <text className="label-mirabeau" x="150" y="155" fill="var(--color-gold)" fontFamily="Barlow Condensed, sans-serif" fontSize="11" fontWeight="700">MIRABEAU</text>
                    <circle cx="80" cy="280" r="5" fill="var(--color-gold)" opacity="0.8"/>
                    <text className="label-fairmont" x="90" y="285" fill="var(--color-gold)" fontFamily="Barlow Condensed, sans-serif" fontSize="11" fontWeight="700">FAIRMONT</text>
                    <circle cx="300" cy="260" r="5" fill="var(--color-gold)" opacity="0.8"/>
                    <text className="label-rascasse" x="240" y="258" fill="var(--color-gold)" fontFamily="Barlow Condensed, sans-serif" fontSize="11" fontWeight="700">RASCASSE</text>
                    <rect x="185" y="454" width="30" height="10" fill="white" opacity="0.6" rx="2"/>
                    <text x="188" y="463" fill="var(--color-bg)" fontFamily="Barlow Condensed, sans-serif" fontSize="8" fontWeight="800">S/F</text>
                  </svg>
                </div>
                <div className="circuit-data">
                  <div className="section-eyebrow">Circuit Spotlight</div>
                  <h2 className="section-title" id="circuit-title" style={{ marginBottom: 'var(--space-4)' }}>Circuit de<br />Monaco</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-base)', lineHeight: 1.75, maxWidth: '52ch' }}>
                    {circuit.desc}
                  </p>
                  <div className="circuit-spec-grid">
                    {circuit.specs.map((spec, i) => (
                      <div className="circuit-spec" key={i}>
                        <div className="spec-label">{spec.label}</div>
                        <div className="spec-value">{spec.value}</div>
                      </div>
                    ))}
                  </div>
                  <a href="#" className="btn-primary" style={{ display: 'inline-block', marginTop: 'var(--space-8)' }}>Explore Circuit →</a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* RACE GALLERY */}
        <section className="gallery-section" aria-labelledby="gallery-title">
          <div className="container" style={{ paddingBottom: 'var(--space-12)' }}>
            <div className="section-eyebrow">Media</div>
            <h2 className="section-title reveal" id="gallery-title">Race Gallery</h2>
            <p className="section-desc reveal">Captured at 1/4000th of a second — the raw power and beauty of Formula 1 racing.</p>
          </div>
          <div className="gallery-grid">
            {gallery.map((img, i) => {
              const dims = [
                { w: 800, h: 500 },
                { w: 600, h: 400 },
                { w: 600, h: 400 },
                { w: 700, h: 500 },
                { w: 700, h: 500 },
                { w: 600, h: 400 }
              ][i] || { w: 600, h: 400 }
              return (
                <div className="gallery-item" key={i}>
                  <a href={img.link} target="_blank" rel="noopener noreferrer" aria-label={`Open photo gallery: ${img.title}`}>
                    <img src={img.image} alt={img.title} width={dims.w} height={dims.h} loading="lazy" />
                    <div className="gallery-overlay">
                      <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ margin: '0 auto var(--space-2)' }} aria-hidden="true">
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.35-4.35" />
                          <path d="M11 8v6M8 11h6" />
                        </svg>
                        <p style={{ color: 'white', fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 'var(--text-sm)', fontWeight: 700, letterSpacing: '0.05em' }}>
                          {img.title}
                        </p>
                      </div>
                    </div>
                  </a>
                </div>
              )
            })}
          </div>
        </section>

        {/* NEWS SECTION */}
        <section className="news-section" id="news" aria-labelledby="news-title">
          <div className="container news-grid-container">
            <div className="section-eyebrow">Latest</div>
            <h2 className="section-title reveal" id="news-title">News &amp;<br />Analysis</h2>
            <p className="section-desc reveal">Breaking news, technical deep-dives, and race reports from every corner of the F1 paddock.</p>
            <div className="news-grid">
              {news.map((item, idx) => (
                <article
                  className="news-card"
                  key={idx}
                  aria-label={`News: ${item.title}`}
                  onMouseMove={handleNewsMouseMove}
                  onMouseLeave={handleNewsMouseLeave}
                >
                  <div className="news-thumb">
                    <img src={item.image} alt={item.title} width="600" height="340" loading="lazy" />
                  </div>
                  <div className="news-body">
                    <div className="news-tag">{item.tag}</div>
                    <h3 className="news-title">{item.title}</h3>
                    <p className="news-excerpt">{item.excerpt}</p>
                  </div>
                  <div className="news-footer">
                    <span className="news-date">{item.date}</span>
                    <span className="news-read">Read →</span>
                  </div>
                </article>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 'var(--space-10)' }}>
              <a href="#" className="btn-ghost">All News →</a>
            </div>
          </div>
        </section>

        {/* NEWSLETTER SUBSCRIBE BANNER */}
        <section className="subscribe-section" id="subscribe" aria-labelledby="subscribe-title">
          <div className="container">
            <div className="subscribe-inner">
              <div className="section-eyebrow" style={{ justifyContent: 'center' }}>Stay Ahead</div>
              <h2 className="subscribe-title" id="subscribe-title" ref={subscribeTitleRef}>
                Never Miss<br />a Lap
              </h2>
              <p className="subscribe-desc">Race updates, qualifying results, breaking paddock news and exclusive analysis — delivered straight to your inbox before the podium celebrations end.</p>
              {subscribed ? (
                <p style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.05em', fontSize: 'var(--text-base)' }}>
                  ✓ You're on the grid. Check your inbox.
                </p>
              ) : (
                <form className="subscribe-form" aria-label="Email newsletter signup" onSubmit={handleSubscribe}>
                  <label htmlFor="email-subscribe" className="sr-only">Your email address</label>
                  <input
                    type="email"
                    id="email-subscribe"
                    className="subscribe-input"
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Signing up...' : 'Subscribe'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer role="contentinfo">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">F1<span className="red"> APEX</span></div>
            <p className="footer-brand-desc">Your definitive source for Formula 1 racing — from flag to flag, season to season. All the speed. All the drama. No filler.</p>
          </div>
          <div>
            <div className="footer-col-title">Racing</div>
            <ul className="footer-links" role="list">
              <li><a href="#">Race Calendar</a></li>
              <li><a href="#">Results & Standings</a></li>
              <li><a href="#">Sprint Races</a></li>
              <li><a href="#">Circuit Guide</a></li>
              <li><a href="#">Live Timing</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Drivers & Teams</div>
            <ul className="footer-links" role="list">
              <li><a href="#">Driver Profiles</a></li>
              <li><a href="#">Team Constructors</a></li>
              <li><a href="#">Hall of Champions</a></li>
              <li><a href="#">Car Tech Specs</a></li>
              <li><a href="#">Fantasy F1</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Media</div>
            <ul className="footer-links" role="list">
              <li><a href="#">Photo Gallery</a></li>
              <li><a href="#">Video Highlights</a></li>
              <li><a href="#">Paddock Radio</a></li>
              <li><a href="#">Newsletter</a></li>
              <li><a href="#">Merchandise</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">© 2026 F1 APEX. Fan site — not affiliated with Formula One Group.</div>
          <nav className="footer-legal" aria-label="Legal links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Cookie Settings</a>
          </nav>
        </div>
      </footer>
    </>
  )
}
