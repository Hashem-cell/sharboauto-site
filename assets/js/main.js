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
    const data = await fetch("/data/vehicles.json", { cache: "no-store" }).then(r => r.json());
    return data.vehicles || [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

function money(value) {
  return "$" + Number(value || 0).toLocaleString("fr-CA");
}

function km(value) {
  return Number(value || 0).toLocaleString("fr-CA") + " km";
}

function safeImages(car) {
  return car.images && car.images.length ? car.images : ["/assets/images/logo.jpeg"];
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
    el.innerHTML = "<p>Véhicule introuvable.</p>";
    return;
  }

  const images = safeImages(c);
  const carfax = c.carfax
    ? `<a class="btn outline" href="${c.carfax}" target="_blank">Voir Carfax</a>`
    : "";

  el.innerHTML = `
    <div class="about">
      <div>
        <img 
          id="mainVehicleImage" 
          class="detail-img" 
          src="${images[0]}" 
          alt="${c.title}"
          style="width:100%;max-height:520px;object-fit:cover;border-radius:16px;"
        >

        <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">
          ${images.map((img, i) => `
            <img
              src="${img}"
              alt="${c.title} ${i + 1}"
              onclick="document.getElementById('mainVehicleImage').src='${img}'"
              style="width:90px;height:70px;object-fit:cover;border-radius:8px;cursor:pointer;border:2px solid #ddd;"
            >
          `).join("")}
        </div>
      </div>

      <div>
        <h1>${c.title || ""}</h1>
        <div class="price">${money(c.price)}</div>

        <p>${c.description_fr || "Rapport Carfax disponible sur demande. Contactez-nous pour plus d'information."}</p>

        <p><b>VIN:</b> ${c.vin || "Sur demande"}</p>
        <p><b>Année:</b> ${c.year || ""}</p>
        <p><b>Kilométrage:</b> ${km(c.mileage)}</p>
        <p><b>Transmission:</b> ${c.transmission || ""}</p>
        <p><b>Carburant:</b> ${c.fuel || ""}</p>
        <p><b>Statut:</b> ${c.status || "Disponible"}</p>

        <a class="btn" href="/financement.html">Demande de financement</a>
        <a class="btn dark" href="/contact.html">Contact</a>
        ${carfax}
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  t();
  loadFeatured();
  setupInventory();
  setupVehicle();
});
