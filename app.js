"use strict";

const home = document.getElementById("home");
const shell = document.getElementById("shell");

const burger = document.getElementById("burger");
const drawer = document.getElementById("drawer");
const backdrop = document.getElementById("backdrop");
const backHome = document.getElementById("backHome");
const topBrand = document.getElementById("topBrand");

const search = document.getElementById("search");
const grid = document.getElementById("grid");

const pageGames = document.getElementById("page-games");
const pageSettings = document.getElementById("page-settings");
const pageCredits = document.getElementById("page-credits");

const playerArea = document.getElementById("playerArea");
const player = document.getElementById("player");
const playerName = document.getElementById("playerName");
const playerType = document.getElementById("playerType");
const closeGame = document.getElementById("closeGame");
const openNewTab = document.getElementById("openNewTab");

let GAMES = [];
let activeRoute = "games";
let activeGame = null;

/* ========= helpers ========= */
function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

function openDrawer(){
  drawer.classList.add("open");
  backdrop.classList.remove("hidden");
}
function closeDrawer(){
  drawer.classList.remove("open");
  backdrop.classList.add("hidden");
}

function setRoute(route){
  activeRoute = route;

  pageGames.classList.toggle("active", route === "games");
  pageSettings.classList.toggle("active", route === "settings");
  pageCredits.classList.toggle("active", route === "credits");

  document.querySelectorAll(".drawerBtn[data-route]").forEach(b=>{
    b.classList.toggle("active", b.dataset.route === route);
  });

  // Search bar only on games page (like your mockup)
  document.querySelector(".topRight").style.visibility = (route === "games") ? "visible" : "hidden";

  closeDrawer();
}

function showShell(){
  home.classList.add("hidden");
  shell.classList.remove("hidden");
  setRoute("games");
}

function showHome(){
  shell.classList.add("hidden");
  home.classList.remove("hidden");
  closeDrawer();
  // stop any running game
  closeGameFn();
}

/* ========= game play ========= */
function closeGameFn(){
  activeGame = null;
  player.src = "about:blank";
  playerArea.classList.add("hidden");
  playerName.textContent = "—";
  playerType.textContent = "LOCAL";
}

function playGame(game){
  activeGame = game;

  if(game.type === "external"){
    playerType.textContent = "EXTERNAL";
    playerName.textContent = game.name;

    // external sites often block iframe -> open new tab
    window.open(game.url, "_blank", "noopener");
    playerArea.classList.add("hidden");

    openNewTab.onclick = () => window.open(game.url, "_blank", "noopener");
    return;
  }

  // local
  playerType.textContent = "LOCAL";
  playerName.textContent = game.name;
  playerArea.classList.remove("hidden");
  player.src = game.path;

  openNewTab.onclick = () => window.open(game.path, "_blank", "noopener");
}

/* ========= render ========= */
function tileHTML(g){
  const img = g.image || "assets/placeholder.jpg"; // you can add this placeholder later
  const chip = (g.type === "external") ? "External" : "Local";
  return `
    <div class="tile" data-id="${escapeHtml(g.id)}" role="button" tabindex="0">
      <img class="tileImg" src="${escapeHtml(img)}" alt="${escapeHtml(g.name)}" loading="lazy" />
      <div class="tileOverlay"></div>
      <div class="tileChip">${chip}</div>
      <div class="tileTitle">${escapeHtml(g.name)}</div>
    </div>
  `;
}

function render(filter=""){
  const q = filter.trim().toLowerCase();
  const list = GAMES.filter(g => {
    const hay = `${g.name} ${g.desc||""}`.toLowerCase();
    return hay.includes(q);
  });

  grid.innerHTML = list.map(tileHTML).join("");

  grid.querySelectorAll(".tile").forEach(t=>{
    const id = t.dataset.id;
    const pick = () => {
      const game = GAMES.find(x => x.id === id);
      if(game) playGame(game);
    };
    t.addEventListener("click", pick);
    t.addEventListener("keydown", (e)=>{
      if(e.key === "Enter" || e.key === " ") pick();
    });
  });
}

/* ========= load games ========= */
async function loadGames(){
  const res = await fetch("games.json", { cache:"no-store" });
  if(!res.ok) throw new Error("Could not load games.json");
  GAMES = await res.json();
  render(search.value);
}

/* ========= events ========= */
document.querySelectorAll("[data-go]").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const where = btn.dataset.go;
    if(where === "games") showShell();
    if(where === "settings") { showShell(); setRoute("settings"); }
    if(where === "credits") { showShell(); setRoute("credits"); }
  });
});

burger.addEventListener("click", ()=>{
  if(drawer.classList.contains("open")) closeDrawer();
  else openDrawer();
});
backdrop.addEventListener("click", closeDrawer);

backHome.addEventListener("click", showHome);
topBrand.addEventListener("click", ()=> setRoute("games"));
topBrand.addEventListener("keydown", (e)=>{ if(e.key==="Enter"||e.key===" ") setRoute("games"); });

document.querySelectorAll(".drawerBtn[data-route]").forEach(btn=>{
  btn.addEventListener("click", ()=> setRoute(btn.dataset.route));
});

search.addEventListener("input", ()=> render(search.value));

closeGame.addEventListener("click", closeGameFn);
openNewTab.addEventListener("click", ()=>{
  if(!activeGame) return;
  if(activeGame.type === "external") window.open(activeGame.url, "_blank", "noopener");
  else window.open(activeGame.path, "_blank", "noopener");
});

/* ========= init ========= */
setRoute("games");            // default internal
document.querySelector(".topRight").style.visibility = "hidden"; // only show search in games view
closeGameFn();

loadGames().catch(err=>{
  console.error(err);
  grid.innerHTML = `
    <div class="wipCard">
      <div class="wipTitle">Error</div>
      <div class="wipSub">${escapeHtml(err.message)}</div>
    </div>
  `;
});