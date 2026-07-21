function currentLang() { return window.SharboI18n ? window.SharboI18n.lang : (localStorage.getItem("lang") || "fr"); }
function tr(fr, en) { return window.SharboI18n ? window.SharboI18n.t(fr, en) : (currentLang() === "fr" ? fr : en); }
function vehicleValue(value) { return window.SharboI18n ? window.SharboI18n.translateVehicleValue(value) : value; }
function t() { if (window.SharboI18n) window.SharboI18n.applyLanguage({silent:true}); }
function toggleLang() { if (window.SharboI18n) window.SharboI18n.toggleLanguage(); }

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
  return "$" + Number(value || 0).toLocaleString(currentLang() === "fr" ? "fr-CA" : "en-CA");
}

function km(value) {
  return Number(value || 0).toLocaleString(currentLang() === "fr" ? "fr-CA" : "en-CA") + " km";
}

function safeImages(car) {
  return car.images && car.images.length ? car.images : ["/assets/images/logo.png"];
}

function statusBadge(c) {
  if (!c.status || c.status === "Disponible") return "";
  return `<div class="status-badge">${vehicleValue(c.status)}</div>`;
}

function carCard(c) {
  const img = safeImages(c)[0];
  const title = c.title || [c.year, c.make || c.brand, c.model, c.trim].filter(Boolean).join(" ");
  const status = vehicleValue(c.status || "Disponible");
  const isSold = String(status).toLowerCase().includes("vend");
  const stock = c.stock_number ? `<span>No ${String(c.stock_number).replace(/</g, "&lt;")}</span>` : "";

  return `
    <article class="car inventory-card-v2">
      <a class="inventory-card-media-v2" href="/vehicle.html?id=${encodeURIComponent(c.id)}" aria-label="${tr("Voir", "View")} ${title || tr("le véhicule", "vehicle")}">
        ${statusBadge(c)}
        <img src="${img}" alt="${title || tr("Véhicule", "Vehicle")}" loading="lazy">
        <span class="inventory-card-view-v2">${tr("Voir le véhicule", "View vehicle")}</span>
      </a>
      <div class="car-body inventory-card-body-v2">
        <div class="inventory-card-meta-v2"><span>${c.year || ""}</span>${stock}</div>
        <h3><a href="/vehicle.html?id=${encodeURIComponent(c.id)}">${title || ""}</a></h3>
        <div class="price inventory-price-v2">${money(c.price)}</div>
        <dl class="inventory-specs-v2">
          <div><dt>${tr("Kilométrage", "Mileage")}</dt><dd>${c.mileage !== null && c.mileage !== undefined ? km(c.mileage) : "—"}</dd></div>
          <div><dt>${tr("Transmission", "Transmission")}</dt><dd>${vehicleValue(c.transmission) || "—"}</dd></div>
          <div><dt>${tr("Carburant", "Fuel")}</dt><dd>${vehicleValue(c.fuel) || "—"}</dd></div>
          <div><dt>${tr("Version", "Trim")}</dt><dd>${c.trim || "—"}</dd></div>
        </dl>
        <div class="inventory-card-actions-v2">
          <a class="inventory-card-primary-v2 ${isSold ? "is-sold" : ""}" href="/vehicle.html?id=${encodeURIComponent(c.id)}">${tr("Voir les détails", "View details")}</a>
          <a class="inventory-card-secondary-v2" href="financement.html?vehicle=${encodeURIComponent(c.id)}">${tr("Financement", "Financing")}</a>
        </div>
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
    : `<p>${tr("Aucun véhicule pour le moment.", "No vehicles are currently available.")}</p>`;

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
  const sort = document.getElementById("inventorySort");
  const count = document.getElementById("inventoryCount");
  const reset = document.getElementById("resetInventoryFilters");

  brand.innerHTML = `<option value="">${tr('Toutes', 'All')}</option>` + [...new Set(all.map(c => c.brand || c.make).filter(Boolean))]
    .sort((a,b) => String(a).localeCompare(String(b), currentLang() === "fr" ? "fr" : "en"))
    .map(x => `<option value="${x}">${x}</option>`).join("");

  year.innerHTML = `<option value="">${tr('Toutes', 'All')}</option>` + [...new Set(all.map(c => c.year).filter(Boolean))]
    .sort((a,b) => b-a).map(x => `<option value="${x}">${x}</option>`).join("");

  function render() {
    const query = (q.value || "").trim().toLowerCase();
    let list = all.filter(c => {
      const haystack = [c.title, c.brand, c.make, c.model, c.trim, c.year, c.stock_number].filter(Boolean).join(" ").toLowerCase();
      return (!query || haystack.includes(query)) &&
        (!brand.value || (c.brand || c.make) === brand.value) &&
        (!year.value || String(c.year) === String(year.value)) &&
        (!max.value || Number(c.price || 0) <= Number(max.value));
    });

    const mode = sort?.value || "featured";
    list = [...list].sort((a,b) => {
      if (mode === "price-asc") return Number(a.price || 0) - Number(b.price || 0);
      if (mode === "price-desc") return Number(b.price || 0) - Number(a.price || 0);
      if (mode === "year-desc") return Number(b.year || 0) - Number(a.year || 0);
      if (mode === "mileage-asc") return Number(a.mileage || 0) - Number(b.mileage || 0);
      return Number(Boolean(b.pinned || b.featured)) - Number(Boolean(a.pinned || a.featured));
    });

    if (count) count.textContent = currentLang() === "fr" ? `${list.length} véhicule${list.length === 1 ? "" : "s"}` : `${list.length} vehicle${list.length === 1 ? "" : "s"}`;
    grid.innerHTML = list.length ? list.map(carCard).join("") : `
      <div class="inventory-empty-v2">
        <h2>${tr("Aucun véhicule trouvé", "No vehicles found")}</h2>
        <p>${tr("Modifiez vos critères ou réinitialisez les filtres.", "Adjust your search or reset the filters.")}</p>
        <button type="button" id="emptyResetInventory">${tr("Réinitialiser", "Reset")}</button>
      </div>`;
    document.getElementById("emptyResetInventory")?.addEventListener("click", resetFilters);
    t();
  }

  function resetFilters() {
    q.value = ""; brand.value = ""; year.value = ""; max.value = "";
    if (sort) sort.value = "featured";
    render();
  }

  [q, brand, year, max, sort].filter(Boolean).forEach(e => e.addEventListener(e.tagName === "SELECT" ? "change" : "input", render));
  reset?.addEventListener("click", resetFilters);
  render();
}

async function setupVehicle() {
  const el = document.getElementById("vehicleDetail");
  if (!el) return;

  const id = new URLSearchParams(location.search).get("id");
  const cars = await getCars();
  const c = cars.find(x => String(x.id) === String(id)) || cars[0];

  if (!c) {
    el.innerHTML = `<div class="vehicle-empty"><h1>${tr("Véhicule introuvable", "Vehicle not found")}</h1><a class="btn dark" href="/inventaire.html">${tr("Retour à l’inventaire", "Back to inventory")}</a></div>`;
    return;
  }

  const images = safeImages(c);
  const title = c.title || [c.year, c.make || c.brand, c.model, c.trim].filter(Boolean).join(" ");
  document.body.dataset.dynamicVehicleTitle = "1"; document.title = `${title} | Sharbo Auto`;

  const esc = value => String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const specs = [
    [tr("Année", "Year"), c.year],
    [tr("Kilométrage", "Mileage"), c.mileage !== null && c.mileage !== undefined ? km(c.mileage) : ""],
    [tr("Transmission", "Transmission"), vehicleValue(c.transmission)],
    [tr("Carburant", "Fuel"), vehicleValue(c.fuel)],
    [tr("Version", "Trim"), c.trim],
    [tr("Couleur", "Colour"), vehicleValue(c.color)],
    [tr("Moteur", "Engine"), c.engine],
    [tr("No d’inventaire", "Stock number"), c.stock_number]
  ].filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "");

  const description = (currentLang() === "en" ? c.description_en : c.description_fr) || c.description_fr || c.description_en ||
    tr("Rapport Carfax disponible sur demande. Contactez-nous pour obtenir plus d’information sur ce véhicule.", "A Carfax report is available upon request. Contact us for more information about this vehicle.");

  const carfax = c.carfax
    ? `<a class="vehicle-btn vehicle-btn-secondary" href="${esc(c.carfax)}" target="_blank" rel="noopener">${tr("Voir le Carfax", "View Carfax report")}</a>`
    : "";

  const status = vehicleValue(c.status || "Disponible");
  const statusClass = String(status).toLowerCase().includes("vend") ? "sold" : String(status).toLowerCase().includes("réserv") ? "reserved" : "available";

  el.dataset.vehicleV2 = "1";
  el.innerHTML = `
    <article class="vehicle-v2">
      <div class="vehicle-breadcrumb"><a href="/inventaire.html">${tr("Inventaire", "Inventory")}</a><span>/</span><span>${esc(title)}</span></div>

      <div class="vehicle-layout">
        <section class="vehicle-gallery" aria-label="${tr("Photos du véhicule", "Vehicle photos")}">
          <div class="vehicle-main-media">
            <span class="vehicle-status ${statusClass}">${esc(status)}</span>
            <button class="gallery-arrow prev" type="button" aria-label="${tr("Photo précédente", "Previous photo")}">‹</button>
            <img id="mainVehicleImage" src="${esc(images[0])}" alt="${esc(title)}" data-index="0">
            <button class="gallery-arrow next" type="button" aria-label="${tr("Photo suivante", "Next photo")}">›</button>
            <button class="gallery-count" type="button" aria-label="${tr("Ouvrir la galerie", "Open gallery")}">1 / ${images.length}</button>
          </div>
          <div class="vehicle-thumbs" role="list">
            ${images.map((img, i) => `<button type="button" class="vehicle-thumb ${i === 0 ? "active" : ""}" data-index="${i}" aria-label="${tr("Afficher la photo", "Show photo")} ${i + 1}"><img src="${esc(img)}" alt="${esc(title)} — photo ${i + 1}" loading="lazy"></button>`).join("")}
          </div>
        </section>

        <aside class="vehicle-summary">
          <div class="vehicle-summary-top">
            <p class="vehicle-eyebrow">${tr("VÉHICULE D’OCCASION", "PRE-OWNED VEHICLE")}</p>
            <h1>${esc(title)}</h1>
            <div class="vehicle-price">${money(c.price)}</div>
            <p class="vehicle-price-note">${tr("Prix affiché avant taxes et immatriculation.", "Price shown before taxes and registration.")}</p>
          </div>

          <dl class="vehicle-key-specs">
            ${specs.slice(0, 4).map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}
          </dl>

          <div class="vehicle-actions">
            <a class="vehicle-btn vehicle-btn-primary" href="/financement.html?vehicle=${encodeURIComponent(title)}&vehicle_id=${encodeURIComponent(c.id)}">${tr("Demande de financement", "Apply for financing")}</a>
            <button class="vehicle-btn vehicle-btn-secondary" type="button" onclick="openTestDrive('${String(title).replace(/'/g, "\\'")}')">${tr("Réserver un essai routier", "Book a test drive")}</button>
            <div class="vehicle-actions-row">
              <a class="vehicle-btn vehicle-btn-quiet" href="tel:4389277272">${tr("Appeler", "Call")}</a>
              <a class="vehicle-btn vehicle-btn-quiet" target="_blank" rel="noopener" href="https://wa.me/14389277272?text=${encodeURIComponent(tr('Bonjour, je suis intéressé par ce véhicule : ', 'Hello, I am interested in this vehicle: ') + title + ' — ' + location.href)}">WhatsApp</a>
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
          <p class="vehicle-section-kicker">${tr("PRÉSENTATION", "OVERVIEW")}</p>
          <h2>${tr("À propos de ce véhicule", "About this vehicle")}</h2>
          <p class="vehicle-description">${esc(description)}</p>
        </section>

        <section class="vehicle-panel">
          <p class="vehicle-section-kicker">${tr("INFORMATIONS", "DETAILS")}</p>
          <h2>${tr("Fiche technique", "Vehicle specifications")}</h2>
          <dl class="vehicle-spec-table">
            ${specs.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}
            <div><dt>VIN</dt><dd>${esc(c.vin || tr("Disponible sur demande", "Available upon request"))}</dd></div>
            <div><dt>${tr("Statut", "Status")}</dt><dd>${esc(status)}</dd></div>
          </dl>
        </section>
      </div>

      <section class="vehicle-confidence">
        <div><span>01</span><strong>${tr("Financement flexible", "Flexible financing")}</strong><p>${tr("Solutions de financement adaptées à votre situation.", "Financing solutions tailored to your needs.")}</p></div>
        <div><span>02</span><strong>${tr("Carfax disponible", "Carfax available")}</strong><p>${tr("Historique du véhicule accessible lorsqu’il est fourni.", "Vehicle history available when a report is provided.")}</p></div>
        <div><span>03</span><strong>${tr("Service professionnel", "Professional service")}</strong><p>${tr("Accompagnement clair avant, pendant et après l’achat.", "Clear support before, during, and after your purchase.")}</p></div>
      </section>
    </article>

    <div class="vehicle-mobile-bar">
      <div><span>${esc(title)}</span><strong>${money(c.price)}</strong></div>
      <a href="/financement.html?vehicle=${encodeURIComponent(title)}&vehicle_id=${encodeURIComponent(c.id)}">${tr("Financement", "Financing")}</a>
    </div>

    <div class="vehicle-lightbox" id="vehicleLightbox" aria-hidden="true">
      <button class="vehicle-lightbox-close" type="button" aria-label="${tr("Fermer", "Close")}">×</button>
      <button class="vehicle-lightbox-prev" type="button" aria-label="${tr("Photo précédente", "Previous photo")}">‹</button>
      <img src="${esc(images[0])}" alt="${esc(title)}">
      <button class="vehicle-lightbox-next" type="button" aria-label="${tr("Photo suivante", "Next photo")}">›</button>
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
      alert(tr("Une erreur est survenue. Veuillez réessayer ou nous contacter directement.", "Something went wrong. Please try again or contact us directly."));
    }
  });
}


document.addEventListener("sharbo:languagechange", () => {
  loadFeatured();
  setupInventory();
  setupVehicle();
});

document.addEventListener("DOMContentLoaded", () => {
  t();
  loadFeatured();
  setupInventory();
  setupVehicle();
  setupTestDriveForm();
});
