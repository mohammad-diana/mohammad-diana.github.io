const card = document.getElementById("openInvitation");
const invitation = document.getElementById("invitation");
const tourBtn = document.getElementById("tourBtn");
const form = document.getElementById("rsvpForm");
const formMessage = document.getElementById("formMessage");
const langToggle = document.getElementById("langToggle");
const musicBtn = document.getElementById("musicBtn");
const bgMusic = document.getElementById("bgMusic");

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isSmallScreen = window.matchMedia("(max-width: 760px)").matches;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const liteMode = isIOS || isSmallScreen || prefersReducedMotion;

if (liteMode) document.body.classList.add("lite-mode");
if (isIOS) document.body.classList.add("ios-lite");

// Preload and keep assets in memory so opening the card feels instant.
const ASSETS_TO_PRELOAD = [
  "assets/castle.webp",
  "assets/ballroom.webp",
  "assets/carriage.webp",
  "assets/glass_shoe_stairs.webp",
  "assets/cinderella_stairs.webp",
  "assets/shoe_closeup.webp",
  "assets/bird_royal_single.webp",
  "assets/bird_royal_single_mirror.webp",
  "assets/glass-slipper.svg"
];

const preloadedAssets = [];
let assetsPreloaded = false;

function preloadSiteAssets() {
  if (assetsPreloaded) return;
  assetsPreloaded = true;
  ASSETS_TO_PRELOAD.forEach((src) => {
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    img.src = src;
    preloadedAssets.push(img);
    if (img.decode) img.decode().catch(() => {});
  });

  if (bgMusic) {
    bgMusic.preload = "auto";
    bgMusic.load();
    // Same-origin fetch helps GitHub Pages cache the mp3 before the first click.
    fetch("assets/royal_music.mp3", { cache: "force-cache" }).catch(() => {});
  }
}

preloadSiteAssets();

["pointerdown", "touchstart", "click"].forEach((eventName) => {
  window.addEventListener(eventName, preloadSiteAssets, { once: true, passive: true });
});


const targetDate = new Date("2026-07-26T19:00:00+03:00").getTime();

let tourFrame = null;
let tourStarted = false;
let lastFrameTime = null;
let currentLang = "ar";

const SCROLL_SPEED = liteMode ? 96 : 104; 

function applyLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  langToggle.textContent = lang === "ar" ? "EN" : "ع";

  document.querySelectorAll("[data-ar][data-en]").forEach((element) => {
    element.innerHTML = element.dataset[lang];
  });

  document.querySelectorAll("[data-placeholder-ar][data-placeholder-en]").forEach((element) => {
    element.placeholder = element.dataset[`placeholder${lang === "ar" ? "Ar" : "En"}`];
  });

  if (formMessage && formMessage.dataset.lastState) {
    formMessage.textContent = formMessage.dataset.lastState === "missing"
      ? (lang === "ar" ? "يرجى اختيار تأكيد الحضور." : "Please select your attendance.")
      : formMessage.textContent;
  }
}

langToggle.addEventListener("click", () => {
  applyLanguage(currentLang === "ar" ? "en" : "ar");
});

function updateMusicButton(isPlaying) {
  if (!musicBtn) return;
  musicBtn.textContent = isPlaying ? "♫" : "♪";
  musicBtn.setAttribute("aria-label", isPlaying ? "Pause music" : "Play music");
}

async function playMusic() {
  if (!bgMusic) return;
  try {
    bgMusic.volume = 0.82;
    bgMusic.loop = true;
    bgMusic.load();
    await bgMusic.play();
    updateMusicButton(true);
  } catch (error) {
    updateMusicButton(false);
  }
}

// The music button was intentionally removed; music starts on opening and stays playing.
if (musicBtn) {
  musicBtn.addEventListener("click", () => {
    playMusic();
  });
}

if (bgMusic) {
  bgMusic.addEventListener("pause", () => {
    if (card && card.classList.contains("opened")) {
      setTimeout(playMusic, 80);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && card && card.classList.contains("opened")) {
      playMusic();
    }
  });

  playMusic();
}

function openInvitation() {
  if (card.classList.contains("opened")) return;
  card.classList.add("opened");
  document.body.classList.remove("locked");
  playMusic();

  setTimeout(() => {
    invitation.querySelector(".section").scrollIntoView({ behavior: "smooth", block: "start" });

    setTimeout(() => {
      startAutoTour();
    }, 1200);
  }, 5000);
}

card.addEventListener("click", openInvitation);
card.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openInvitation();
  }
});

function stopAutoTour() {
  document.documentElement.classList.remove("auto-scrolling");
  tourStarted = false;
  lastFrameTime = null;
  if (tourFrame) cancelAnimationFrame(tourFrame);
  tourFrame = null;
}

function startAutoTour(options = {}) {
  stopAutoTour();
  document.body.classList.remove("locked");
  document.documentElement.classList.add("auto-scrolling");
  tourStarted = true;
  lastFrameTime = null;
  if (tourBtn) tourBtn.classList.add("show");

  const firstSection = invitation.querySelector(".section");
  if (options.replay && firstSection) {
    firstSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const delay = options.replay ? 1100 : 150;

  setTimeout(() => {
    if (!tourStarted) return;
    tourFrame = requestAnimationFrame(stepAutoScroll);
  }, delay);
}

function stepAutoScroll(timestamp) {
  if (!tourStarted) {
    stopAutoTour();
    return;
  }

  if (lastFrameTime === null) lastFrameTime = timestamp;
  const elapsed = Math.min(80, timestamp - lastFrameTime);
  lastFrameTime = timestamp;

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight - 2;
  if (window.scrollY >= maxScroll) {
    stopAutoTour();
    return;
  }

  const nextScroll = Math.min(maxScroll, window.scrollY + (SCROLL_SPEED * elapsed) / 1000);
  window.scrollTo({ top: nextScroll, behavior: "auto" });

  tourFrame = requestAnimationFrame(stepAutoScroll);
}



function keepAutoTourNatural() {
  if (!tourStarted) return;
  document.documentElement.classList.add("auto-scrolling");
  if (!tourFrame) {
    lastFrameTime = null;
    tourFrame = requestAnimationFrame(stepAutoScroll);
  }
}

["wheel", "touchend", "scroll", "keydown"].forEach((eventName) => {
  window.addEventListener(eventName, keepAutoTourNatural, { passive: true });
});

if (tourBtn) {
  tourBtn.addEventListener("click", () => {
    startAutoTour({ replay: true });
  });
}

function createSectionSparkles(target) {
  if (liteMode || target.dataset.sparkled === "true") return;
  target.dataset.sparkled = "true";

  for (let i = 0; i < (liteMode ? 1 : 4); i += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "section-sparkle";
    sparkle.style.setProperty("--x", `${18 + Math.random() * 64}%`);
    sparkle.style.setProperty("--y", `${16 + Math.random() * 68}%`);
    sparkle.style.setProperty("--dx", `${-50 + Math.random() * 100}px`);
    sparkle.style.setProperty("--dy", `${-90 + Math.random() * 55}px`);
    sparkle.style.animationDelay = `${Math.random() * 0.45}s`;
    target.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 2100);
  }
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      createSectionSparkles(entry.target);
    }
  });
}, { threshold: 0.18 });

document.querySelectorAll(".reveal").forEach(element => revealObserver.observe(element));

function updateCountdown() {
  const now = Date.now();
  let diff = Math.max(0, targetDate - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * 1000 * 60 * 60 * 24;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * 1000 * 60 * 60;

  const minutes = Math.floor(diff / (1000 * 60));
  diff -= minutes * 1000 * 60;

  const seconds = Math.floor(diff / 1000);

  document.getElementById("days").textContent = String(days).padStart(2, "0");
  document.getElementById("hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);

if (form && formMessage) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = data.get("name")?.toString().trim() || (currentLang === "ar" ? "ضيفنا الكريم" : "Guest");
    const attending = data.get("attending");

    if (!attending) {
      formMessage.dataset.lastState = "missing";
      formMessage.textContent = currentLang === "ar" ? "يرجى اختيار تأكيد الحضور." : "Please select your attendance.";
      return;
    }

    formMessage.dataset.lastState = "saved";
    formMessage.textContent = currentLang === "ar"
      ? `شكراً ${name}، تم حفظ ردك على هذا الجهاز.`
      : `Thank you, ${name}. Your response has been saved on this device.`;
    form.reset();
  });
}

const sparkleCount = liteMode ? 5 : 14;
const stars = document.querySelector(".stars");

for (let i = 0; i < sparkleCount; i += 1) {
  const dot = document.createElement("i");
  dot.style.left = `${Math.random() * 100}%`;
  dot.style.top = `${Math.random() * 100}%`;
  dot.style.animationDelay = `${Math.random() * 4}s`;
  dot.style.animationDuration = `${3 + Math.random() * 4}s`;
  stars.appendChild(dot);
}


function createFairytaleEffects() {
  if (prefersReducedMotion) return;
  const snowLayer = document.getElementById("snowLayer");
  const magicStarLayer = document.getElementById("magicStarLayer");

  if (snowLayer && !snowLayer.dataset.ready) {
    snowLayer.dataset.ready = "true";
    const count = liteMode ? 6 : 18;

    for (let i = 0; i < count; i += 1) {
      const flake = document.createElement("span");
      flake.className = "snowflake";
      flake.style.left = `${Math.random() * 100}%`;
      flake.style.setProperty("--size", `${1.6 + Math.random() * 3.1}px`);
      flake.style.setProperty("--opacity", `${0.16 + Math.random() * 0.26}`);
      flake.style.setProperty("--duration", `${9 + Math.random() * 13}s`);
      flake.style.setProperty("--delay", `${-Math.random() * 18}s`);
      flake.style.setProperty("--start-x", `${-26 + Math.random() * 52}px`);
      flake.style.setProperty("--end-x", `${-70 + Math.random() * 140}px`);
      snowLayer.appendChild(flake);
    }
  }

  if (magicStarLayer && !magicStarLayer.dataset.ready) {
    magicStarLayer.dataset.ready = "true";
    const count = liteMode ? 3 : 10;

    for (let i = 0; i < count; i += 1) {
      const star = document.createElement("span");
      star.className = "magic-star";
      star.style.setProperty("--x", `${Math.random() * 100}%`);
      star.style.setProperty("--y", `${Math.random() * 100}%`);
      star.style.setProperty("--size", `${4 + Math.random() * 8}px`);
      star.style.setProperty("--duration", `${3.3 + Math.random() * 4.5}s`);
      star.style.setProperty("--delay", `${-Math.random() * 7}s`);
      magicStarLayer.appendChild(star);
    }
  }
}

createFairytaleEffects();


applyLanguage("ar");
