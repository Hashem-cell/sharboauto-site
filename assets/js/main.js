const dict = {
  fr: {
    inventory: "Inventaire",
    financing: "Financement",
    about: "À propos",
    contact: "Contact",
    heroTitle: "Trouvez votre prochain véhicule chez Sharbo Auto",
    heroText: "Véhicules d'occasion de qualité, financement flexible et service professionnel au Québec.",
    viewInventory: "Voir l'inventaire",
    apply: "Demande de financement",
    why: "Pourquoi choisir Sharbo Auto",
    featured: "Véhicules en vedette",
    details: "Voir les détails"
  },
  en: {
    inventory: "Inventory",
    financing: "Financing",
    about: "About",
    contact: "Contact",
    heroTitle: "Find your next vehicle at Sharbo Auto",
    heroText: "Quality pre-owned vehicles, flexible financing and professional service in Quebec.",
    viewInventory: "View inventory",
    apply: "Apply for financing",
    why: "Why choose Sharbo Auto",
    featured: "Featured vehicles",
    details: "View details"
  }
};

let lang = localStorage.getItem("lang") || "fr";

function t() {
  document.querySelectorAll("[data-t]").forEach(e => {
    e.textContent = dict[lang][e.dataset.t] || e.textContent;
  });
  document.documentElement.lang = lang;
}

function toggleLang() {
  lang = lang === "fr" ? "en" : "fr";
  localStorage.setItem("lang", lang);
  t();
}

async function getCars() {
  try {
    if (window.supabase && window.SHARBO_SUPABASE_URL && window.SHARBO_SUPABASE_KEY) {
      const client = window.supabase.createClient(window.SHARBO_SUPABASE_URL, window.SHARBO_SUPABASE_KEY);
      const { data, error } = await client
        .from("vehicles")
        .select("*, vehicle_images(*)")
        .is("archived_at", null)
        .neq("published", false)
        .order("pinned", { ascending: false })
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!error && data && data.length) {
        return data.map(v => ({
          ...v,
          id: v.id,
          brand: v.make,
          title: v.title || [v.make, v.model, v.year].filter(Boolean).join(" "),
          images: (v.vehicle_images || [])
            .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
            .map(i => i.image_url)
        }));
      }
    }

    const local = await fetch("/data/vehicles.json", { cache: "no-store" }).then(r => r.json());
    return local.vehicles || [];
  } catch (e) {
    console.error(e);
    try {
      const local = await fetch("/data/vehicles.json", { cache: "no-store" }).then(r => r.json());
      return local.vehicles || [];
    } catch (_) {
      return [];
    }
  }
}

function money(value) {
  return "$" + Number(value || 0).toLocaleString("fr-CA");
}

function km(value) {
  return Number(value || 0).toLocaleString("fr-CA") + " km";
}

function safeImages(car) {
  return car.images && car.images.length ? car.images : ["/assets/images/logo.png"];
}

function statusBadge(c) {
  if (!c.status || c.status === "Disponible") return "";
  return `<div class="status-badge">${c.status}</div>`;
}

function carCard(c) {
  const img = safeImages(c)[0];

  return `
    <article class="car">
      <div style="position:relative;">
        ${statusBadge(c)}
        <img src="${img}" alt="${c.title}" loading="lazy">
      </div>
      <div class="car-body">
        <h3>${c.title || ""}</h3>
        <div class="price">${money(c.price)}</div>
        <div class="specs">
          <span>${c.year || ""}</span>
          <span>${km(c.mileage)}</span>
          <span>${c.transmission || ""}</span>
          <span>${c.fuel || ""}</span>
        </div>
        <a class="btn" href="/vehicle.html?id=${encodeURIComponent(c.id)}" data-t="details">Voir les détails</a>
      </div>
    </article>
  `;
}

async function loadFeatured() {
  const el = document.getElementById("featuredCars");
  if (!el) return;

  const cars = await getCars();
  const list = cars.filter(c => c.featured !== false).slice(0, 6);

  el.innerHTML = list.length
    ? list.map(carCard).join("")
    : "<p>Aucun véhicule pour le moment.</p>";

  t();
}

async function setupInventory() {
  const grid = document.getElementById("inventoryGrid");
  if (!grid) return;

  const all = await getCars();

  const q = document.getElementById("q");
  const brand = document.getElementById("brand");
  const year = document.getElementById("year");
  const max = document.getElementById("maxPrice");

  brand.innerHTML =
    '<option value="">Marque</option>' +
    [...new Set(all.map(c => c.brand).filter(Boolean))]
      .sort()
      .map(x => `<option>${x}</option>`)
      .join("");

  year.innerHTML =
    '<option value="">Année</option>' +
    [...new Set(all.map(c => c.year).filter(Boolean))]
      .sort((a, b) => b - a)
      .map(x => `<option>${x}</option>`)
      .join("");

  function render() {
    const query = (q.value || "").toLowerCase();

    const list = all.filter(c =>
      (!query || `${c.title} ${c.brand} ${c.model} ${c.year}`.toLowerCase().includes(query)) &&
      (!brand.value || c.brand === brand.value) &&
      (!year.value || String(c.year) === String(year.value)) &&
      (!max.value || Number(c.price) <= Number(max.value))
    );

    grid.innerHTML = list.length
      ? list.map(carCard).join("")
      : "<p>Aucun véhicule trouvé.</p>";

    t();
  }

  document.querySelectorAll(".filter").forEach(e => e.addEventListener("input", render));
  render();
}

async function setupVehicle() {
  const el = document.getElementById("vehicleDetail");
  if (!el) return;

  const id = new URLSearchParams(location.search).get("id");
  const cars = await getCars();
  const c = cars.find(x => String(x.id) === String(id)) || cars[0];

  if (!c) {
    el.innerHTML = '<div class="vehicle-empty"><h1>Véhicule introuvable</h1><a class="btn dark" href="/inventaire.html">Retour à l’inventaire</a></div>';
    return;
  }

  const images = safeImages(c);
  const title = c.title || [c.year, c.make || c.brand, c.model, c.trim].filter(Boolean).join(" ");
  document.title = `${title} | Sharbo Auto`;

  const esc = value => String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const specs = [
    ["Année", c.year],
    ["Kilométrage", c.mileage !== null && c.mileage !== undefined ? km(c.mileage) : ""],
    ["Transmission", c.transmission],
    ["Carburant", c.fuel],
    ["Version", c.trim],
    ["Couleur", c.color],
    ["Moteur", c.engine],
    ["No d’inventaire", c.stock_number]
  ].filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "");

  const description = (lang === "en" ? c.description_en : c.description_fr) || c.description_fr || c.description_en ||
    "Rapport Carfax disponible sur demande. Contactez-nous pour obtenir plus d’information sur ce véhicule.";

  const carfax = c.carfax
    ? `<a class="vehicle-btn vehicle-btn-secondary" href="${esc(c.carfax)}" target="_blank" rel="noopener">Voir le Carfax</a>`
    : "";

  const status = c.status || "Disponible";
  const statusClass = String(status).toLowerCase().includes("vend") ? "sold" : String(status).toLowerCase().includes("réserv") ? "reserved" : "available";

  el.dataset.vehicleV2 = "1";
  el.innerHTML = `
    <article class="vehicle-v2">
      <div class="vehicle-breadcrumb"><a href="/inventaire.html">Inventaire</a><span>/</span><span>${esc(title)}</span></div>

      <div class="vehicle-layout">
        <section class="vehicle-gallery" aria-label="Photos du véhicule">
          <div class="vehicle-main-media">
            <span class="vehicle-status ${statusClass}">${esc(status)}</span>
            <button class="gallery-arrow prev" type="button" aria-label="Photo précédente">‹</button>
            <img id="mainVehicleImage" src="${esc(images[0])}" alt="${esc(title)}" data-index="0">
            <button class="gallery-arrow next" type="button" aria-label="Photo suivante">›</button>
            <button class="gallery-count" type="button" aria-label="Ouvrir la galerie">1 / ${images.length}</button>
          </div>
          <div class="vehicle-thumbs" role="list">
            ${images.map((img, i) => `<button type="button" class="vehicle-thumb ${i === 0 ? "active" : ""}" data-index="${i}" aria-label="Afficher la photo ${i + 1}"><img src="${esc(img)}" alt="${esc(title)} — photo ${i + 1}" loading="lazy"></button>`).join("")}
          </div>
        </section>

        <aside class="vehicle-summary">
          <div class="vehicle-summary-top">
            <p class="vehicle-eyebrow">VÉHICULE D’OCCASION</p>
            <h1>${esc(title)}</h1>
            <div class="vehicle-price">${money(c.price)}</div>
            <p class="vehicle-price-note">Prix affiché avant taxes et immatriculation.</p>
          </div>

          <dl class="vehicle-key-specs">
            ${specs.slice(0, 4).map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}
          </dl>

          <div class="vehicle-actions">
            <a class="vehicle-btn vehicle-btn-primary" href="/financement.html?vehicle=${encodeURIComponent(title)}&vehicle_id=${encodeURIComponent(c.id)}">Demande de financement</a>
            <button class="vehicle-btn vehicle-btn-secondary" type="button" onclick="openTestDrive('${String(title).replace(/'/g, "\\'")}')">Réserver un essai routier</button>
            <div class="vehicle-actions-row">
              <a class="vehicle-btn vehicle-btn-quiet" href="tel:4389277272">Appeler</a>
              <a class="vehicle-btn vehicle-btn-quiet" target="_blank" rel="noopener" href="https://wa.me/14389277272?text=${encodeURIComponent('Bonjour, je suis intéressé par ce véhicule : ' + title + ' — ' + location.href)}">WhatsApp</a>
            </div>
            ${carfax}
          </div>

          <div class="vehicle-contact-note">
            <strong>Sharbo Auto</strong>
            <span>2260 Boulevard des Laurentides, Laval</span>
            <span>438-927-7272</span>
          </div>
        </aside>
      </div>

      <div class="vehicle-content-grid">
        <section class="vehicle-panel">
          <p class="vehicle-section-kicker">PRÉSENTATION</p>
          <h2>À propos de ce véhicule</h2>
          <p class="vehicle-description">${esc(description)}</p>
        </section>

        <section class="vehicle-panel">
          <p class="vehicle-section-kicker">INFORMATIONS</p>
          <h2>Fiche technique</h2>
          <dl class="vehicle-spec-table">
            ${specs.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}
            <div><dt>VIN</dt><dd>${esc(c.vin || "Disponible sur demande")}</dd></div>
            <div><dt>Statut</dt><dd>${esc(status)}</dd></div>
          </dl>
        </section>
      </div>

      <section class="vehicle-confidence">
        <div><span>01</span><strong>Financement flexible</strong><p>Solutions de financement adaptées à votre situation.</p></div>
        <div><span>02</span><strong>Carfax disponible</strong><p>Historique du véhicule accessible lorsqu’il est fourni.</p></div>
        <div><span>03</span><strong>Service professionnel</strong><p>Accompagnement clair avant, pendant et après l’achat.</p></div>
      </section>
    </article>

    <div class="vehicle-mobile-bar">
      <div><span>${esc(title)}</span><strong>${money(c.price)}</strong></div>
      <a href="/financement.html?vehicle=${encodeURIComponent(title)}&vehicle_id=${encodeURIComponent(c.id)}">Financement</a>
    </div>

    <div class="vehicle-lightbox" id="vehicleLightbox" aria-hidden="true">
      <button class="vehicle-lightbox-close" type="button" aria-label="Fermer">×</button>
      <button class="vehicle-lightbox-prev" type="button" aria-label="Photo précédente">‹</button>
      <img src="${esc(images[0])}" alt="${esc(title)}">
      <button class="vehicle-lightbox-next" type="button" aria-label="Photo suivante">›</button>
      <span class="vehicle-lightbox-count">1 / ${images.length}</span>
    </div>
  `;

  let activeIndex = 0;
  const mainImage = el.querySelector("#mainVehicleImage");
  const count = el.querySelector(".gallery-count");
  const lightbox = el.querySelector("#vehicleLightbox");
  const lightboxImage = lightbox.querySelector("img");
  const lightboxCount = lightbox.querySelector(".vehicle-lightbox-count");

  const showImage = index => {
    activeIndex = (index + images.length) % images.length;
    mainImage.src = images[activeIndex];
    mainImage.dataset.index = activeIndex;
    count.textContent = `${activeIndex + 1} / ${images.length}`;
    lightboxImage.src = images[activeIndex];
    lightboxCount.textContent = `${activeIndex + 1} / ${images.length}`;
    el.querySelectorAll(".vehicle-thumb").forEach((thumb, i) => thumb.classList.toggle("active", i === activeIndex));
    el.querySelector(`.vehicle-thumb[data-index="${activeIndex}"]`)?.scrollIntoView({behavior:"smooth", block:"nearest", inline:"center"});
  };

  const openGallery = () => {
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  };
  const closeGallery = () => {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  };

  el.querySelectorAll(".vehicle-thumb").forEach(thumb => thumb.addEventListener("click", () => showImage(Number(thumb.dataset.index))));
  el.querySelector(".gallery-arrow.prev").addEventListener("click", () => showImage(activeIndex - 1));
  el.querySelector(".gallery-arrow.next").addEventListener("click", () => showImage(activeIndex + 1));
  el.querySelector(".gallery-count").addEventListener("click", openGallery);
  mainImage.addEventListener("click", openGallery);
  lightbox.querySelector(".vehicle-lightbox-close").addEventListener("click", closeGallery);
  lightbox.querySelector(".vehicle-lightbox-prev").addEventListener("click", () => showImage(activeIndex - 1));
  lightbox.querySelector(".vehicle-lightbox-next").addEventListener("click", () => showImage(activeIndex + 1));
  lightbox.addEventListener("click", e => { if (e.target === lightbox) closeGallery(); });
  document.addEventListener("keydown", e => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeGallery();
    if (e.key === "ArrowLeft") showImage(activeIndex - 1);
    if (e.key === "ArrowRight") showImage(activeIndex + 1);
  });

  let touchStartX = 0;
  mainImage.addEventListener("touchstart", e => touchStartX = e.changedTouches[0].screenX, {passive:true});
  mainImage.addEventListener("touchend", e => {
    const delta = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(delta) > 45) showImage(activeIndex + (delta < 0 ? 1 : -1));
  }, {passive:true});
}

function openTestDrive(vehicleName) {
  const form = document.getElementById("testDriveForm");
  const vehicleInput = document.getElementById("testDriveVehicle");

  if (vehicleInput) vehicleInput.value = vehicleName;

  if (form) {
    form.style.display = "block";
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function setupTestDriveForm() {
  const form = document.getElementById("testDriveForm");
  if (!form) return;

  form.addEventListener("submit", async function(e) {
    e.preventDefault();

    const data = new FormData(form);

    try {
      await fetch("/", {
        method: "POST",
        body: data
      });

      form.reset();

      const success = document.getElementById("testDriveSuccess");
      if (success) success.style.display = "block";
    } catch (error) {
      alert("Une erreur est survenue. Veuillez réessayer ou nous contacter directement.");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  t();
  loadFeatured();
  setupInventory();
  setupVehicle();
  setupTestDriveForm();
});
