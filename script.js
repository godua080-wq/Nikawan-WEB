/* ============ PENGATURAN GALERI ============ */
const DRIVE_API_KEY   = "AIzaSyBBrcxsLkbVLrDRWyQJQsLISYKmi7nspGw";
const DRIVE_FOLDER_ID = "1GJ5EL9QpbVxcJEtO4TEsOR2qH_TWnEgR";
const GALLERY_LIMIT   = 0; // 0 = tampilkan semua foto tanpa batas

/* ============ menu mobile ============ */
const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");
const menuIcon = menuToggle.querySelector("i");

menuToggle.addEventListener("click", () => {
  navMenu.classList.toggle("open");
  menuIcon.classList.toggle("fa-bars");
  menuIcon.classList.toggle("fa-xmark");
});

document.querySelectorAll(".menu a").forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    menuIcon.classList.add("fa-bars");
    menuIcon.classList.remove("fa-xmark");
  });
});

/* ============ tabs ============ */
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanes = document.querySelectorAll(".tab-pane");

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    tabPanes.forEach((pane) => pane.classList.remove("active"));

    button.classList.add("active");
    document.getElementById(button.dataset.tab).classList.add("active");
    observeReveal();
  });
});

/* ============ lightbox ============ */
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxClose = document.getElementById("lightboxClose");

function openLightbox(src) {
  lightboxImage.src = src;
  lightbox.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("open");
  document.body.style.overflow = "";
}

lightboxClose.addEventListener("click", closeLightbox);

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && lightbox.classList.contains("open")) {
    closeLightbox();
  }
});

/* ============ animasi reveal ============ */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

function observeReveal() {
  document.querySelectorAll(".reveal:not([data-reveal])").forEach((el) => {
    el.dataset.reveal = "true";
    revealObserver.observe(el);
  });
}

observeReveal();

/* ============ galeri & slideshow ============ */
const galleryGrid = document.getElementById("galleryGrid");
const showcaseSection = document.getElementById("showcaseSection");
const marqueeTrack = document.getElementById("marqueeTrack");

if (galleryGrid) {
  galleryGrid.addEventListener("click", (event) => {
    const item = event.target.closest(".gallery-item");
    if (!item) return;

    const img = item.querySelector("img");
    if (img) openLightbox(img.src);
  });
}

const IMAGE_PATTERN = /\.(png|jpe?g|webp|gif|svg|avif)$/i;

function applyLimit(images) {
  return GALLERY_LIMIT > 0 ? images.slice(0, GALLERY_LIMIT) : images;
}

function renderGallery(images) {
  if (!galleryGrid) return;

  galleryGrid.innerHTML = "";

  if (!images.length) {
    galleryGrid.innerHTML = '<div class="gallery-empty">Belum ada foto di galeri.</div>';
    return;
  }

  images.forEach((src, index) => {
    const figure = document.createElement("figure");
    figure.className = "gallery-item reveal";

    const img = document.createElement("img");
    img.src = src;
    img.alt = "Dokumentasi proyek " + (index + 1);
    img.loading = "lazy";

    figure.appendChild(img);
    galleryGrid.appendChild(figure);
  });

  observeReveal();
}

function renderShowcase(images) {
  if (!showcaseSection || !marqueeTrack) return;

  if (!images.length) {
    showcaseSection.style.display = "none";
    return;
  }

  showcaseSection.style.display = "block";
  marqueeTrack.innerHTML = "";

  const loop = [...images, ...images];

  loop.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Dokumentasi proyek";
    img.loading = "lazy";
    img.addEventListener("click", () => openLightbox(src));
    marqueeTrack.appendChild(img);
  });

  marqueeTrack.style.animationDuration = Math.max(30, images.length * 5) + "s";
}

/* --- sumber 1: Google Drive --- */
async function getDriveImages() {
  if (!DRIVE_API_KEY || !DRIVE_FOLDER_ID) return [];

  try {
    const q = `'${DRIVE_FOLDER_ID}' in parents and mimeType contains 'image/' and trashed=false`;
    const url =
      "https://www.googleapis.com/drive/v3/files?q=" + encodeURIComponent(q) +
      "&orderBy=createdTime+desc&pageSize=100&fields=files(id,name,createdTime)&key=" + DRIVE_API_KEY;

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    return applyLimit((data.files || []).map((file) => "https://lh3.googleusercontent.com/d/" + file.id));
  } catch (error) {
    return [];
  }
}

/* --- sumber 2: folder GitHub "galeri" --- */
async function getGithubImages() {
  const host = window.location.hostname;

  if (!host.endsWith(".github.io")) return [];

  const owner = host.split(".")[0];
  const pathParts = window.location.pathname.split("/").filter(Boolean);

  let repo = host;

  if (pathParts.length > 1 && !/\.(html?|xml|json|txt)$/i.test(pathParts[0])) {
    repo = pathParts[0];
  }

  const endpoints = [
    `https://api.github.com/repos/${owner}/${repo}/contents/galeri`,
    `https://api.github.com/repos/${owner}/${repo}/contents/galeri?ref=main`,
    `https://api.github.com/repos/${owner}/${repo}/contents/galeri?ref=master`,
    `https://api.github.com/repos/${owner}/${repo}/contents/galeri?ref=gh-pages`
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: { Accept: "application/vnd.github+json" }
      });

      if (!response.ok) continue;

      const files = await response.json();
      if (!Array.isArray(files)) continue;

      const images = applyLimit(
        files
          .filter((file) => file.type === "file" && IMAGE_PATTERN.test(file.name))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((file) => file.download_url)
          .filter(Boolean)
      );

      if (images.length) return images;
    } catch (error) {
      continue;
    }
  }

  return [];
}

async function loadGallery() {
  let images = await getDriveImages();

  if (!images.length) {
    images = await getGithubImages();
  }

  renderGallery(images);
  renderShowcase(images);
}

loadGallery();