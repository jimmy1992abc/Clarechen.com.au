function initHeroTimer() {
  // Only run if timer elements exist on this page
  const elYears = document.getElementById("years");
  if (!elYears) return;

  // =========================
  // CONFIG (copy from your old HTML)
  // =========================
  const TITLE = "BORN SINCE";
  const START_DATE_DDMMYYYY = "16012026"; // DDMMYYYY
  const START_TIME_HHMM = "07:23";        // HH:MM (24h)
  const USE_UTC = false;                  // interpret as UTC if true
  const DISPLAY_LOCALE = "en-AU";
  // =========================

  const $ = (id) => document.getElementById(id);
  const pad2 = (n) => String(n).padStart(2, "0");

  function parseDDMMYYYY(s) {
    s = (s || "").trim();
    if (!/^\d{8}$/.test(s)) return null;
    const dd = Number(s.slice(0, 2));
    const mm = Number(s.slice(2, 4));
    const yyyy = Number(s.slice(4, 8));
    if (mm < 1 || mm > 12) return null;
    if (dd < 1 || dd > 31) return null;

    const d = new Date(yyyy, mm - 1, dd);
    if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
    return { dd, mm, yyyy };
  }

  function buildStartDate(dateParts, hh, min, useUTC) {
    const { dd, mm, yyyy } = dateParts;
    return useUTC
      ? new Date(Date.UTC(yyyy, mm - 1, dd, hh, min, 0))
      : new Date(yyyy, mm - 1, dd, hh, min, 0);
  }

  function splitDuration(msAbs) {
    const totalSeconds = Math.floor(msAbs / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const totalHours = Math.floor(totalMinutes / 60);
    const hours = totalHours % 24;
    const totalDays = Math.floor(totalHours / 24);

    // Keep the same “stable display” as your original timer: 365-day years
    const years = Math.floor(totalDays / 365);
    const days = totalDays % 365;

    return { years, days, hours, minutes, seconds, totalDays };
  }

  // Init title
  const titleEl = document.getElementById("timerTitle") || document.getElementById("title");
  if (titleEl) titleEl.textContent = TITLE;

  const dateParts = parseDDMMYYYY(START_DATE_DDMMYYYY);
  const timeMatch = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(START_TIME_HHMM);

  if (!dateParts || !timeMatch) {
    const sub = $("subtitle");
    if (sub) sub.textContent = "Invalid start date/time configuration.";
    const modeText = $("modeText");
    if (modeText) modeText.textContent = "Fix timer config in app.js.";
    const dot = $("dot");
    if (dot) dot.classList.add("future");
    return;
  }

  const hh = Number(timeMatch[1]);
  const min = Number(timeMatch[2]);
  if (hh < 0 || hh > 23 || min < 0 || min > 59) {
    const sub = $("subtitle");
    if (sub) sub.textContent = "Time must be HH:MM (00:00–23:59).";
    const modeText = $("modeText");
    if (modeText) modeText.textContent = "Fix timer config in app.js.";
    const dot = $("dot");
    if (dot) dot.classList.add("future");
    return;
  }

  const start = buildStartDate(dateParts, hh, min, USE_UTC);

  function tick() {
    const delta = Date.now() - start.getTime();
    const isFuture = delta < 0;
    const parts = splitDuration(Math.abs(delta));

    $("years").textContent = String(parts.years);
    $("days").textContent = String(parts.days);
    $("hours").textContent = pad2(parts.hours);
    $("mins").textContent = pad2(parts.minutes);
    $("secs").textContent = pad2(parts.seconds);
    $("totalDays").textContent = String(parts.totalDays);

    const dot = $("dot");
    if (dot) {
      dot.classList.toggle("future", isFuture);
      // If you're using .timerDot class, make sure it’s on the same element:
      dot.classList.toggle("timerDot", true);
    }

    $("modeText").textContent = isFuture ? "Counting down to start" : "Counting up since start";

    const tzLabel = USE_UTC ? "UTC" : "Local";
    $("subtitle").textContent =
      (isFuture ? "Starts at " : "Started at ") +
      start.toLocaleString(DISPLAY_LOCALE, { hour12: false }) +
      " (" + tzLabel + ")";
  }

  tick();
  setInterval(tick, 250);
}

// Run when DOM is ready
document.addEventListener("DOMContentLoaded", initHeroTimer);