/**
 * Ember Steakhouse – Wine Supplier Website
 * Data-driven with JSON + Vanilla JavaScript
 */

(function () {
  "use strict";

  // State
  let allWines = [];
  let company = {};
  let currentSlide = 0;
  let autoplayInterval = null;
  const AUTOPLAY_DELAY = 5500;

  // DOM references
  const carouselTrack = document.getElementById("carousel-track");
  const carouselDots = document.getElementById("carousel-dots");
  const wineGrid = document.getElementById("wine-grid");
  const filterBar = document.getElementById("filter-bar");
  const prevBtn = document.getElementById("carousel-prev");
  const nextBtn = document.getElementById("carousel-next");

  /* ---------- Data Loading ---------- */
  async function loadData() {
    try {
      const response = await fetch("wines.json");
      if (!response.ok) throw new Error("Failed to load wine data");
      const data = await response.json();
      company = data.company;
      allWines = data.wines;
      initPage();
    } catch (err) {
      console.error(err);
      document.getElementById("carousel-wrapper").innerHTML =
        '<p class="loading">Unable to load wines. Please refresh the page.</p>';
      wineGrid.innerHTML =
        '<p class="loading">Unable to load collection.</p>';
    }
  }

  /* ---------- Page Initialisation ---------- */
  function initPage() {
    // Company info
    document.getElementById("company-name").textContent = company.name;
    document.getElementById("company-tagline").textContent = company.tagline;
    document.getElementById("about-description").textContent = company.description;
    document.getElementById("contact-email").textContent = company.email;
    document.getElementById("contact-email").href = `mailto:${company.email}`;
    document.getElementById("contact-phone").textContent = company.phone;
    document.getElementById("contact-address").textContent = company.address;
    document.getElementById("footer-name").textContent = company.name;

    // Hero & about images
    if (company.heroImage) {
      const hero = document.querySelector(".hero");
      if (hero) hero.style.backgroundImage = `url('${company.heroImage}')`;
    }
    if (company.aboutImage) {
      const aboutImg = document.getElementById("about-img");
      if (aboutImg) {
        aboutImg.src = company.aboutImage;
        aboutImg.alt = company.name + " wine selection";
      }
    }

    // Stats
    document.getElementById("stat-wines").textContent = allWines.length;
    const countries = [...new Set(allWines.map((w) => w.country))];
    document.getElementById("stat-countries").textContent = countries.length;
    document.getElementById("stat-brands").textContent = [
      ...new Set(allWines.map((w) => w.brand)),
    ].length;

    // Build UI
    buildCarousel();
    buildFilters(countries);
    renderWineGrid(allWines);
    setupEventListeners();
    startAutoplay();
  }

  /* ---------- Carousel ---------- */
  function buildCarousel() {
    // Select a nice mix of featured wines (one or two from each country)
    const featured = [];
    const countries = ["England", "France", "Belgium", "Germany", "Italy", "Spain", "Ireland"];
    countries.forEach((c) => {
      const countryWines = allWines.filter((w) => w.country === c);
      if (countryWines.length) featured.push(countryWines[0]);
    });
    // Add a couple more premium ones
    featured.push(allWines.find((w) => w.name.includes("Cristal")));
    featured.push(allWines.find((w) => w.name.includes("Único")));
    featured.push(allWines.find((w) => w.name.includes("Tignanello")));

    const uniqueFeatured = featured.filter(Boolean).slice(0, 10);

    carouselTrack.innerHTML = uniqueFeatured
      .map(
        (wine) => `
      <div class="carousel-slide">
        <div class="carousel-card">
          <div class="carousel-image">
            <span class="country-badge">${wine.country}</span>
            <img src="${wine.image}" alt="${wine.name}" loading="lazy" />
          </div>
          <div class="carousel-info">
            <div class="brand">${wine.brand}</div>
            <h3>${wine.name}</h3>
            <div class="carousel-meta">
              <span>${wine.region}</span>
              <span>${wine.type}</span>
              <span>${wine.year}</span>
              <span>${wine.grape}</span>
            </div>
            <p>${wine.description}</p>
            <div class="carousel-price">${wine.price}</div>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    // Dots
    carouselDots.innerHTML = uniqueFeatured
      .map(
        (_, i) =>
          `<button class="dot ${i === 0 ? "active" : ""}" data-index="${i}" aria-label="Go to slide ${i + 1}"></button>`
      )
      .join("");

    // Store length for navigation
    carouselTrack.dataset.slides = uniqueFeatured.length;
    goToSlide(0);
  }

  function goToSlide(index) {
    const total = parseInt(carouselTrack.dataset.slides, 10) || 0;
    if (total === 0) return;
    currentSlide = (index + total) % total;
    carouselTrack.style.transform = `translateX(-${currentSlide * 100}%)`;

    // Update dots
    document.querySelectorAll(".dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === currentSlide);
    });
  }

  function nextSlide() {
    goToSlide(currentSlide + 1);
  }

  function prevSlide() {
    goToSlide(currentSlide - 1);
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayInterval = setInterval(nextSlide, AUTOPLAY_DELAY);
  }

  function stopAutoplay() {
    if (autoplayInterval) clearInterval(autoplayInterval);
  }

  /* ---------- Filters & Grid ---------- */
  function buildFilters(countries) {
    const sorted = ["All", ...countries.sort()];
    filterBar.innerHTML = sorted
      .map(
        (c) =>
          `<button class="filter-btn ${c === "All" ? "active" : ""}" data-country="${c}">${c}</button>`
      )
      .join("");
  }

  function renderWineGrid(wines) {
    if (!wines.length) {
      wineGrid.innerHTML = '<p class="loading">No wines found for this selection.</p>';
      return;
    }

    wineGrid.innerHTML = wines
      .map(
        (wine) => `
      <article class="wine-card" data-country="${wine.country}">
        <div class="wine-card-header">
          <img src="${wine.image}" alt="${wine.name}" loading="lazy" />
          <span class="country-tag">${wine.country}</span>
          <div class="overlay">
            <h3>${wine.name}</h3>
            <div class="brand">${wine.brand}</div>
          </div>
        </div>
        <div class="wine-card-body">
          <div class="wine-meta">
            <span>${wine.region}</span>
            <span>${wine.type}</span>
            <span>${wine.year}</span>
          </div>
          <p>${wine.description}</p>
          <div class="wine-card-footer">
            <span class="wine-price">${wine.price}</span>
            <span style="font-family:'Source Sans 3',sans-serif;font-size:0.8rem;color:var(--soft-gray)">${wine.grape}</span>
          </div>
        </div>
      </article>
    `
      )
      .join("");
  }

  function filterWines(country) {
    if (country === "All") {
      renderWineGrid(allWines);
    } else {
      renderWineGrid(allWines.filter((w) => w.country === country));
    }
  }

  /* ---------- Helpers ---------- */
  function getWineEmoji(type) {
    const map = {
      Red: "🍷",
      White: "🥂",
      Sparkling: "🍾",
      Dessert: "🍇",
    };
    return map[type] || "🍷";
  }

  // Graceful fallback if a remote image fails to load
  document.addEventListener(
    "error",
    function (e) {
      if (e.target.tagName === "IMG" && !e.target.dataset.fallback) {
        e.target.dataset.fallback = "1";
        e.target.src =
          "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80";
      }
    },
    true
  );

  /* ---------- Events ---------- */
  function setupEventListeners() {
    // Carousel controls
    prevBtn.addEventListener("click", () => {
      prevSlide();
      startAutoplay();
    });
    nextBtn.addEventListener("click", () => {
      nextSlide();
      startAutoplay();
    });

    carouselDots.addEventListener("click", (e) => {
      if (e.target.classList.contains("dot")) {
        goToSlide(parseInt(e.target.dataset.index, 10));
        startAutoplay();
      }
    });

    // Pause autoplay on hover
    const wrapper = document.getElementById("carousel-wrapper");
    wrapper.addEventListener("mouseenter", stopAutoplay);
    wrapper.addEventListener("mouseleave", startAutoplay);

    // Filters
    filterBar.addEventListener("click", (e) => {
      if (e.target.classList.contains("filter-btn")) {
        document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
        filterWines(e.target.dataset.country);
      }
    });

    // Mobile menu
    const toggle = document.getElementById("menu-toggle");
    const navList = document.getElementById("nav-list");
    toggle.addEventListener("click", () => {
      navList.classList.toggle("open");
    });

    // Close mobile menu on link click
    navList.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => navList.classList.remove("open"));
    });

    // Header scroll effect
    window.addEventListener("scroll", () => {
      document.querySelector("header").classList.toggle("scrolled", window.scrollY > 40);
    });

    // Contact form (demo only)
    const form = document.getElementById("contact-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.textContent = "Message Sent – Thank You";
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
        form.reset();
      }, 2800);
    });
  }

  /* ---------- Start ---------- */
  document.addEventListener("DOMContentLoaded", loadData);
})();
