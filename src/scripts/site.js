// Oye Runner · in-page behaviour: plan tabs, week browser, Goal Finder,
// "Start with Oye Runner" form, free PDF downloads and UPI payment sheet.
// Text and numbers come from content/ (via #oye-config and data/plans.json).

const CFG = JSON.parse(document.getElementById("oye-config").textContent);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LEVEL_NAME = { intermediate: "Intermediate", beginner: "Beginner" };

let PLANS = [];
let PLAN_BY = {};
const plansReady = fetch(CFG.base + "data/plans.json")
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then((list) => { PLANS = list; list.forEach((p) => (PLAN_BY[p.id] = p)); return list; });

/* ───────── small maths helpers (Goal Finder) ───────── */
function parseTime(s) { s = (s || "").trim(); if (!s) return null; const m = s.match(/^(\d{1,2}):([0-5]\d)$/); if (!m) return NaN; const t = +m[1] * 60 + +m[2]; return t < 12 * 60 || t > 60 * 60 ? NaN : t; }
function fmtPace(sec) { let m = Math.floor(sec / 60), s = Math.round(sec - m * 60); if (s === 60) { m++; s = 0; } return m + ":" + String(s).padStart(2, "0"); }
function fmtTime(sec) { sec = Math.round(sec); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return h ? h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0") : m + ":" + String(s).padStart(2, "0"); }
function paces(t5) { const p = t5 / 5; return { easy: [p * 1.22, p * 1.36], thr: p * 1.065, int: p * 0.98 }; }
function hrZones(age) { if (!(age >= 15 && age <= 80)) return null; const max = Math.round(208 - 0.7 * age); return { max, easy: [Math.round(max * 0.6), Math.round(max * 0.7)], thr: [Math.round(max * 0.8), Math.round(max * 0.88)] }; }
function daysTo(iso, now) { const r = new Date(iso + "T06:00:00"), t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()); return Math.round((r - t0) / 86400000); }

/* ───────── plan lookups ───────── */
const freePlans = (level, dist) => PLANS.filter((p) => p.level === level && p.distance === dist).sort((a, b) => a.nWeeks - b.nWeeks);
const weekOptions = (level, dist) => freePlans(level, dist).map((p) => p.nWeeks);

// Pick the free plan for a Goal Finder answer.
function matchPlan(goal, level, raceISO, now) {
  const notes = [];
  const dist = { start: "5k", weight: "5k", "10k": "10k", half: "21k", full: "42k" }[goal];
  const left = raceISO ? Math.floor(daysTo(raceISO, now) / 7) : null;

  // A race event on that date with a plan for this distance?
  const ev = raceISO && CFG.events.find((e) => e.date === raceISO);
  if (ev && level >= ev.minLevel) {
    const p = PLANS.find((x) => x.event === ev.id && x.distance === dist);
    if (p) {
      if (dist === "42k" && level < 4) notes.push({ k: "warn", t: ev.name + " is your first marathon? The 42K countdown assumes a 21 km long run already. Consider the half, or a customised plan." });
      return { p, notes };
    }
  }

  if (level <= 1) {
    if (dist === "42k") {
      notes.push({ k: "info", t: "The beginner marathon plan needs a finished half marathon first. Start with the beginner half." });
      return { p: freePlans("beginner", "21k").at(-1), notes };
    }
    if (goal === "weight") notes.push({ k: "info", t: "Pair the plan with a modest calorie deficit and protein at every meal. Aim for steady loss, around 0.5 kg a week." });
    const p = freePlans("beginner", dist).at(-1);
    if (p && left !== null && left < p.nWeeks) notes.push({ k: "warn", t: left + " weeks to race day, but this plan needs " + p.nWeeks + ". Pick a later race, or run a shorter distance on this date." });
    return { p, notes };
  }

  let d = dist;
  if (d === "21k" && level === 2) { notes.push({ k: "info", t: "Build to 10K first: the half marathon plans expect a 10-12 km long run on day one." }); d = "10k"; }
  if (d === "42k" && level <= 3) { notes.push({ k: "info", t: "Run a half marathon before the full. Most first-marathon injuries come from skipping that step." }); d = level === 2 ? "10k" : "21k"; }
  if (goal === "weight") notes.push({ k: "info", t: "You already run 5K, so the faster-5K plan adds quality. Keep a modest calorie deficit and fuel before longer runs." });
  const opts = weekOptions("intermediate", d);
  let w = opts.at(-1);
  if (left !== null && d === dist) {
    if (left < 0) notes.push({ k: "warn", t: "That race date has passed." });
    else {
      const fit = opts.filter((x) => x <= left);
      if (fit.length) w = fit.at(-1);
      else { w = opts[0]; notes.push({ k: "stop", t: "Only " + left + " weeks to race day. The shortest plan is " + opts[0] + " weeks; pick a later race or a shorter distance." }); }
      if (left > w) notes.push({ k: "info", t: left + " weeks to race day: start this " + w + "-week plan in " + (left - w) + " week" + (left - w === 1 ? "" : "s") + ", and run easy until then." });
    }
  }
  return { p: freePlans("intermediate", d).find((p) => p.nWeeks === w), notes };
}

/* ───────── toast ───────── */
function toast(t, bad) {
  let el = $("#toast");
  if (!el) {
    el = document.createElement("div"); el.id = "toast"; el.setAttribute("role", "status");
    el.style.cssText = "position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:95;max-width:min(520px,calc(100% - 32px));padding:14px 20px;border-radius:16px;font:600 15px var(--font);box-shadow:0 12px 30px -12px rgba(0,0,0,.5)";
    document.body.appendChild(el);
  }
  el.style.background = bad ? "#600202" : "#000"; el.style.color = "#fff"; el.textContent = t; el.style.display = "block";
  clearTimeout(el._t); el._t = setTimeout(() => (el.style.display = "none"), 5200);
}

/* ───────── free PDF downloads (details first, once) ───────── */
function lead() { try { return JSON.parse(localStorage.getItem("oye-lead") || "null"); } catch (e) { return null; } }
function rememberLead(l) { try { localStorage.setItem("oye-lead", JSON.stringify(l)); } catch (e) {} }
function downloadPdf(id) {
  const p = PLAN_BY[id]; if (!p) { toast("Plans are still loading. Try again in a moment.", true); return; }
  const a = document.createElement("a"); a.href = CFG.base + p.pdf; a.download = p.pdfName; document.body.appendChild(a); a.click(); a.remove();
  toast("Downloading " + p.pdfName);
}
let pendingPdf = null;
function requestPdf(id) {
  const l = lead(), title = PLAN_BY[id] ? PLAN_BY[id].title : id;
  if (l) { downloadPdf(id); sendLead({ ...l, request: "Free plan", plan: title, message: "Downloaded another free plan" }); return; }
  pendingPdf = id;
  openStart({ req: "Free plan", plan: title, sub: "Share your details once and your free PDF downloads straight away." });
}

/* ───────── week browser ───────── */
function weekHTML(p, wi) {
  const w = p.weeks[wi];
  return '<div class="week"><div class="week-h"><span>' + esc(w.label) + "</span><span>~" + Math.round(w.km) + " km</span></div>" +
    w.days.map((d, i) => '<div class="day ' + (d.type === "strength" ? "str" : d.type) + '"><span class="d">' + esc(d.date || DAY_NAMES[i]) + '</span><span><span class="t">' + esc(d.title) + '</span><br><span class="x">' + esc(d.details) + "</span></span></div>").join("") + "</div>";
}
function planCard(p) {
  const kind = p.level ? LEVEL_NAME[p.level] : (CFG.events.find((e) => e.id === p.event) || {}).name || "";
  return '<div class="plan-card"><div>' +
    '<p class="eyebrow">' + esc(kind) + ' · free plan</p><h3 class="pc-title" style="margin-top:10px">' + esc(p.title) + "</h3>" +
    '<div class="pc-meta"><span class="pill red">' + p.nWeeks + ' week' + (p.nWeeks === 1 ? "" : "s") + '</span><span class="pill">Peak ~' + p.peakKm + ' km/week</span><span class="pill">PDF download</span></div>' +
    '<div class="pc-list"><span><b>Who it\'s for.</b> ' + esc(p.who) + "</span><span><b>Start only if.</b> " + esc(p.prereq) + "</span><span><b>Inside.</b> " + esc(document.getElementById("plans").dataset.inside || "") + "</span></div>" +
    '<div class="cta-row" style="margin-top:0"><button class="btn" type="button" data-dl="' + p.id + '">Download free PDF</button><button class="btn btn-ghost" type="button" data-start data-req="Customised paid plan" data-plan="Customised version of ' + esc(p.title) + '">Get it customised</button></div>' +
    '</div><div><div class="week-nav"><button type="button" data-wk="-1" aria-label="Previous week">‹</button><span data-wk-label></span><button type="button" data-wk="1" aria-label="Next week">›</button></div><div data-wk-body></div></div></div>';
}
function mountCard(el, p) {
  el.innerHTML = planCard(p); let wi = 0;
  const body = $("[data-wk-body]", el), lab = $("[data-wk-label]", el), prev = $('[data-wk="-1"]', el), next = $('[data-wk="1"]', el);
  const show = () => { body.innerHTML = weekHTML(p, wi); lab.textContent = "Week " + (wi + 1) + " of " + p.nWeeks; prev.disabled = wi === 0; next.disabled = wi === p.nWeeks - 1; };
  prev.onclick = () => { if (wi > 0) { wi--; show(); } };
  next.onclick = () => { if (wi < p.nWeeks - 1) { wi++; show(); } };
  show();
}

/* ───────── Free plans tab ───────── */
function freeState() { return { lvl: $('input[name="fl"]:checked').value, dist: $('input[name="fd"]:checked').value, w: ($('input[name="fw"]:checked') || {}).value }; }
function renderWeeksChips(keep) {
  const { lvl, dist } = freeState(); const opts = weekOptions(lvl, dist);
  const cur = keep && opts.includes(+keep) ? +keep : opts.at(-1);
  $("#fw").innerHTML = opts.length
    ? opts.map((w) => '<label class="chip"><input type="radio" name="fw" value="' + w + '"' + (w === cur ? " checked" : "") + "><span>" + w + " weeks</span></label>").join("")
    : '<span class="fine">No plan yet</span>';
}
function renderFree() {
  if (!PLANS.length) return;
  const { lvl, dist, w } = freeState();
  const p = freePlans(lvl, dist).find((x) => String(x.nWeeks) === String(w));
  if (p) mountCard($("#free-card"), p); else $("#free-card").innerHTML = '<p class="fine">No free plan for this combination yet.</p>';
}
$$('input[name="fl"],input[name="fd"]').forEach((i) => i.addEventListener("change", () => { renderWeeksChips(freeState().w); renderFree(); }));
$("#fw").addEventListener("change", renderFree);
function selectPlan(id) {
  const p = PLAN_BY[id]; if (!p) return;
  if (p.event) { openTab(p.event); mountCard($("#" + p.event + "-preview"), p); return; }
  $("#fl-" + p.level).checked = true; $("#fd-" + p.distance).checked = true;
  renderWeeksChips(String(p.nWeeks)); renderFree(); openTab("free");
}

/* ───────── tabs ───────── */
const TABS = $$("[data-tab-name]").map((b) => b.dataset.tabName);
function openTab(name, noScroll) {
  if (!TABS.includes(name)) return;
  TABS.forEach((t) => { $("#tab-" + t).setAttribute("aria-selected", String(t === name)); $("#" + CSS.escape(t)).hidden = t !== name; });
  if (!noScroll) document.getElementById("plans").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}
TABS.forEach((t) => $("#tab-" + t).addEventListener("click", () => openTab(t, true)));
$("[role=tablist]").addEventListener("keydown", (e) => {
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  const i = TABS.findIndex((t) => $("#tab-" + t).getAttribute("aria-selected") === "true");
  const n = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
  openTab(n, true); $("#tab-" + n).focus();
});

/* ───────── one click handler for the whole page ───────── */
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-tab]"); if (t) openTab(t.dataset.tab);
  const d = e.target.closest("[data-dl]"); if (d) requestPdf(d.dataset.dl);
  const v = e.target.closest("[data-view]");
  if (v && PLAN_BY[v.dataset.view]) { const p = PLAN_BY[v.dataset.view]; const box = $("#" + p.event + "-preview"); mountCard(box, p); box.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
  const s = e.target.closest("[data-start]"); if (s) openStart({ req: s.dataset.req || "", plan: s.dataset.plan || "" });
  const pay = e.target.closest("[data-pay]"); if (pay) openPay(pay.dataset);
  const r = e.target.closest("[data-race-date]"); if (r) { $("#f-race").value = r.dataset.raceDate; renderFinder(); }
  const x = e.target.closest("[data-close]"); if (x) closeModal(x.closest(".modal"));
});

/* ───────── countdowns ───────── */
(function () {
  const now = new Date();
  $$("[data-countdown]").forEach((el) => {
    const n = daysTo(el.dataset.countdown, now);
    el.innerHTML = n > 0 ? n + "<small>day" + (n === 1 ? "" : "s") + " to go</small>" : n === 0 ? "Today<small>race day</small>" : "Done" + (el.dataset.after ? "<small>" + esc(el.dataset.after) + "</small>" : "");
  });
  $("#yr").textContent = now.getFullYear();
})();

/* ───────── Goal Finder ───────── */
const ff = $("#finder-form");
const fval = (n) => { const el = ff.querySelector('input[name="' + n + '"]:checked'); return el ? el.value : null; };
function renderFinder() {
  if (!PLANS.length) return;
  const goal = fval("goal"), level = +fval("level");
  const ageRaw = $("#f-age").value, age = ageRaw === "" ? NaN : +ageRaw;
  const t5 = parseTime($("#f-5k").value), health = $("#f-health").checked, race = $("#f-race").value;
  const m = matchPlan(goal, level, race || null, new Date());
  const p = m.p; if (!p) { $("#result").innerHTML = '<p class="fine">No matching plan yet. Ask the coach for a customised plan.</p>'; return; }
  const notes = m.notes.slice();
  if (health) notes.unshift({ k: "stop", t: "Get medical clearance first. ACSM guidance is to check with your doctor before starting a new plan. Show them this plan; most people are cleared to start gently." });
  const h5 = $("#h-5k");
  if (t5 !== null && isNaN(t5)) { h5.textContent = "Use mm:ss, between 12:00 and 60:00"; h5.classList.add("err"); }
  else { h5.textContent = t5 ? "Paces based on " + fmtTime(t5) + " for 5 km" : "Unlocks your training paces"; h5.classList.remove("err"); }
  const hr = hrZones(age), ha = $("#h-age");
  if (!hr && ageRaw !== "") { ha.textContent = "Enter an age from 15 to 80"; ha.classList.add("err"); } else { ha.textContent = "Sets your heart-rate zones"; ha.classList.remove("err"); }
  let z = "";
  if (hr) z += '<div class="zone"><div class="k">Easy runs</div><div class="v">' + hr.easy[0] + "-" + hr.easy[1] + '</div><div class="u">bpm · Zone 2</div></div><div class="zone"><div class="k">Threshold</div><div class="v">' + hr.thr[0] + "-" + hr.thr[1] + '</div><div class="u">bpm · Zone 4</div></div><div class="zone"><div class="k">Est. max HR</div><div class="v">' + hr.max + '</div><div class="u">bpm · age ' + age + "</div></div>";
  if (t5 && !isNaN(t5) && level >= 2) { const pc = paces(t5); z += '<div class="zone"><div class="k">Easy pace</div><div class="v">' + fmtPace(pc.easy[0]) + "-" + fmtPace(pc.easy[1]) + '</div><div class="u">min/km</div></div><div class="zone"><div class="k">Threshold</div><div class="v">' + fmtPace(pc.thr) + '</div><div class="u">min/km</div></div><div class="zone"><div class="k">Intervals</div><div class="v">' + fmtPace(pc.int) + '</div><div class="u">min/km</div></div>'; }
  const wi = Math.min(1, p.nWeeks - 1);
  $("#result").innerHTML = '<div><span class="pill red">Your free plan</span><h3 class="pc-title" style="margin-top:12px;font-size:clamp(28px,3.2vw,38px)">' + esc(p.title) + '</h3><p class="fine" style="margin-top:8px">' + esc(p.subtitle) + "</p></div>" +
    (notes.length ? '<ul class="notes">' + notes.map((n) => '<li class="' + n.k + '">' + esc(n.t) + "</li>").join("") + "</ul>" : "") +
    '<div class="rsec"><h4>A week from the plan</h4>' + weekHTML(p, wi) + "</div>" +
    (z ? '<div class="rsec"><h4>Your training zones</h4><div class="zones">' + z + "</div></div>" : "") +
    '<div class="rcta"><button class="btn" type="button" data-dl="' + p.id + '">Download free PDF</button><button class="btn btn-ghost" style="box-shadow:inset 0 0 0 1.5px rgba(241,232,226,.3);color:#fff" type="button" data-pick="' + p.id + '">See all weeks</button></div>' +
    '<p class="fine">General guidance, not medical advice.</p>';
  const pick = $("#result [data-pick]"); if (pick) pick.onclick = () => selectPlan(pick.dataset.pick);
}
ff.addEventListener("input", renderFinder);
ff.addEventListener("change", renderFinder);

/* ───────── modals ───────── */
let lastFocus = null;
function openModal(m) { lastFocus = document.activeElement; m.classList.add("open"); document.body.style.overflow = "hidden"; }
function closeModal(m) {
  if (!m) return; m.classList.remove("open");
  if (!$(".modal.open")) document.body.style.overflow = "";
  if (m.id === "start-modal") pendingPdf = null;
  if (lastFocus) lastFocus.focus();
}
$$(".modal").forEach((m) => m.addEventListener("click", (e) => { if (e.target === m) closeModal(m); }));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal($(".modal.open")); });

/* ───────── Start with Oye Runner form ───────── */
function openStart(o) {
  o = o || {};
  const l = lead(); if (l) ["name", "mobile", "email", "age", "gender", "type"].forEach((k) => { if (l[k]) $("#s-" + k).value = l[k]; });
  if (o.req) $("#s-req").value = o.req;
  $("#sm-plan").textContent = o.plan || ""; $("#sm-chosen").classList.toggle("show", !!o.plan); $("#start-form").dataset.plan = o.plan || "";
  $("#s-utr-wrap").hidden = !o.paid; $("#start-form").dataset.paid = o.paid ? "1" : "";
  $("#sm-sub").textContent = o.sub || "Your details go straight to " + CFG.coach + " at " + CFG.email + ".";
  const box = $("#s-msg-box"); box.className = "msg"; box.innerHTML = "";
  openModal($("#start-modal")); setTimeout(() => $("#s-name").focus(), 30);
}

async function sendLead(d) {
  if (!CFG.formEndpoint || !/^https?:/.test(location.protocol)) return false;
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(CFG.formEndpoint, {
      method: "POST", signal: ctl.signal, headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: "Oye Runner: " + d.request + (d.paid ? " · PAID by UPI" : "") + " · " + d.name, _template: "table", _captcha: "false",
        Request: d.request, Plan: d.plan || "-", "Paid by UPI": d.paid ? "Yes · UTR " + (d.utr || "not given") : "No",
        Name: d.name, Mobile: d.mobile, Email: d.email, Age: d.age, Gender: d.gender, "Runner type": d.type,
        "Goal / question": d.message || "-", Consent: d.consent ? "Yes" : "No", _replyto: d.email,
      }),
    });
    clearTimeout(tm); if (!r.ok) return false;
    const j = await r.json().catch(() => ({})); return j.success === true || j.success === "true";
  } catch (e) { clearTimeout(tm); return false; }
}

$("#start-form").addEventListener("submit", async (e) => {
  e.preventDefault(); const box = $("#s-msg-box");
  const d = {
    name: $("#s-name").value.trim(), mobile: $("#s-mobile").value.trim(), email: $("#s-email").value.trim(), age: $("#s-age").value.trim(),
    gender: $("#s-gender").value, type: $("#s-type").value, request: $("#s-req").value, plan: e.target.dataset.plan || "",
    message: $("#s-msg").value.trim(), consent: $("#s-consent").checked, paid: !!e.target.dataset.paid, utr: $("#s-utr").value.trim(),
  };
  const fail = (t, f) => { box.className = "msg show bad"; box.textContent = t; if (f) $(f).focus(); };
  if (d.name.length < 2) return fail("Add your full name.", "#s-name");
  if (!/^\+?[\d\s-]{10,15}$/.test(d.mobile) || d.mobile.replace(/\D/g, "").length < 10) return fail("Add a valid mobile number, at least 10 digits.", "#s-mobile");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return fail("That email doesn't look right. Check for typos.", "#s-email");
  if (!(+d.age >= 10 && +d.age <= 90)) return fail("Add your age (10 to 90).", "#s-age");
  if (!d.gender) return fail("Choose your gender.", "#s-gender");
  if (!d.type) return fail("Choose what kind of runner you are.", "#s-type");
  if (!d.request) return fail("Choose what you'd like from Oye Runner.", "#s-req");
  rememberLead({ name: d.name, mobile: d.mobile, email: d.email, age: d.age, gender: d.gender, type: d.type });
  const btn = $("#s-submit"); btn.disabled = true; btn.textContent = "Sending…";
  const ok = await sendLead(d); btn.disabled = false; btn.textContent = "Send my details";
  const pdf = pendingPdf; pendingPdf = null;
  if (ok) {
    box.className = "msg show ok";
    box.innerHTML = "<strong>Thanks, " + esc(d.name.split(" ")[0]) + "!</strong> Your request reached " + esc(CFG.coach) + ". Expect a reply on " + esc(d.email) + " within 24-48 hours." + (pdf ? " Your free plan is downloading now." : "");
  } else {
    const preview = location.hostname.replace(/^www\./, "") !== CFG.liveHost;
    box.className = "msg show " + (preview ? "info" : "bad");
    box.innerHTML = preview
      ? "<strong>Preview only.</strong> This preview can't send requests. On <code>" + esc(CFG.liveHost) + "</code> they reach " + esc(CFG.email) + " the moment you tap Send." + (pdf ? " Your free plan is downloading now." : "")
      : "<strong>Couldn't send just now.</strong> Check your internet connection and tap <strong>Send my details</strong> again." + (pdf ? " Your free plan is downloading anyway." : "");
  }
  if (pdf) downloadPdf(pdf);
});

/* ───────── UPI payment sheet ───────── */
let paying = null;
function openPay(ds) {
  const m = $("#pay-modal"); if (!m) return;
  paying = ds;
  $("#pay-name").textContent = ds.name;
  $("#pay-amt").innerHTML = "Rs. " + Number(ds.amount).toLocaleString("en-IN") + "<small> " + (ds.per ? "/ " + esc(ds.per) : "one-time") + "</small>";
  const tpl = document.getElementById("qr-" + ds.pay); $("#pay-qr").innerHTML = tpl ? tpl.innerHTML : "";
  try { $("#pay-open").href = atob(ds.code); } catch (e) { $("#pay-open").removeAttribute("href"); }
  const save = $("#pay-save");
  save.href = ds.qrpng;
  save.download = "Oye Runner UPI " + ds.name + " Rs " + ds.amount + ".png";
  openModal(m);
}
const payDone = $("#pay-done");
if (payDone) payDone.addEventListener("click", () => {
  closeModal($("#pay-modal"));
  if (paying) openStart({ req: paying.req, plan: paying.label, paid: true, sub: "Thanks for paying. Share your details and the UPI transaction ID so " + CFG.coach + " can start your plan." });
});

/* ───────── install as app ───────── */
let deferredPrompt = null;
const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; });
$("#install-btn").addEventListener("click", async () => {
  const note = $("#install-note");
  if (standalone) { note.textContent = "You're already using the app."; return; }
  if (deferredPrompt) { deferredPrompt.prompt(); const c = await deferredPrompt.userChoice; deferredPrompt = null; note.textContent = c.outcome === "accepted" ? "Installed. Find Oye Runner on your home screen." : "No problem, you can install it any time."; return; }
  note.textContent = isIOS ? "On iPhone: tap Share, then Add to Home Screen." : "Open your browser menu and choose Install app or Add to Home screen.";
});
// No install button on iPhone/iPad, and nothing to install once it's already an app: hide the section and its menu link.
if (standalone || isIOS) {
  const f = $("#app"); if (f) f.style.display = "none";
  $$('.links a[href="#app"]').forEach((a) => (a.style.display = "none"));
}

/* ───────── start ───────── */
plansReady
  .then(() => {
    renderWeeksChips(); renderFree(); renderFinder();
    const h = location.hash.replace("#", ""); if (TABS.includes(h)) openTab(h);
  })
  .catch(() => {
    $("#free-card").innerHTML = '<p class="fine">Plans couldn\'t load. Refresh the page to try again.</p>';
    $("#result").innerHTML = '<p class="fine">Plans couldn\'t load. Refresh the page to try again.</p>';
  });
window.addEventListener("hashchange", () => { const h = location.hash.replace("#", ""); if (TABS.includes(h)) openTab(h); });
