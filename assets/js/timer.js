(() => {
  // =========================
  // ✅ CONFIG (hardcode here)
  // =========================
  const TITLE = "A soul arrives, and suddenly the world feels more complete.";
  const START_DATE_DDMMYYYY = "16012026"; // DDMMYYYY e.g. 01012020
  const START_TIME_HHMM = "07:23"; // HH:MM (24h) e.g. 09:30
  const USE_UTC = false; // true = interpret date/time as UTC

  // Optional: show date in subtitle with your preferred format
  const DISPLAY_LOCALE = "en-AU"; // e.g. "en-AU"

  // =========================
  // Helpers
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

  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  function calculateYearsAndDaysWithLeapYears(startDate, endDate) {
    const earlier = startDate <= endDate ? startDate : endDate;
    const later = startDate <= endDate ? endDate : startDate;

    let years = 0;
    let currentDate = new Date(earlier);

    // Count complete years, accounting for leap years
    while (true) {
      const nextYear = new Date(
        currentDate.getFullYear() + 1,
        currentDate.getMonth(),
        currentDate.getDate()
      );
      if (nextYear > later) break;
      years++;
      currentDate = nextYear;
    }

    // Count remaining days
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.floor((later - currentDate) / msPerDay);

    return { years, days };
  }

  function splitDuration(msAbs) {
    const totalSeconds = Math.floor(msAbs / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const totalHours = Math.floor(totalMinutes / 60);
    const hours = totalHours % 24;
    const totalDays = Math.floor(totalHours / 24);
    return { years: 0, days: totalDays, hours, minutes, seconds, totalDays };
  }

  // Set up DOM references (safely; this file is loaded on every page)
  const titleEl = $("timerTitle");
  const subtitleEl = $("timerSubtitle");
  const modeTextEl = $("timerModeText");
  const dotEl = $("timerDot");
  const clockEl = $("timerClock");
  const yearsEl = $("timerYears");
  const daysEl = $("timerDays");
  const hoursEl = $("timerHours");
  const minsEl = $("timerMins");
  const secsEl = $("timerSecs");
  const totalDaysEl = $("timerTotalDays");

  // If we don't find the timer elements, bail out early
  if (!subtitleEl || !modeTextEl || !dotEl) return;

  if (titleEl) titleEl.textContent = TITLE;

  const dateParts = parseDDMMYYYY(START_DATE_DDMMYYYY);
  const timeMatch = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(START_TIME_HHMM);

  if (!dateParts || !timeMatch) {
    subtitleEl.textContent = "Invalid START_DATE_DDMMYYYY or START_TIME_HHMM.";
    modeTextEl.textContent = "Fix config in assets/js/timer.js.";
    dotEl.classList.add("future");
    console.error("Bad config for timer:", { START_DATE_DDMMYYYY, START_TIME_HHMM });
    return;
  }

  const hh = Number(timeMatch[1]);
  const min = Number(timeMatch[2]);
  if (hh < 0 || hh > 23 || min < 0 || min > 59) {
    subtitleEl.textContent = "Time must be HH:MM (00:00–23:59).";
    modeTextEl.textContent = "Fix config in assets/js/timer.js.";
    dotEl.classList.add("future");
    console.error("Bad time for timer:", { START_TIME_HHMM });
    return;
  }

  const start = buildStartDate(dateParts, hh, min, USE_UTC);

  function tick() {
    const now = new Date();

    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString(DISPLAY_LOCALE, { hour12: false });
    }

    const delta = Date.now() - start.getTime();
    const isFuture = delta < 0;
    const parts = splitDuration(Math.abs(delta));

    // Override years and days with leap-year-aware calculation
    const { years: accurateYears, days: accurateDays } = calculateYearsAndDaysWithLeapYears(
      start,
      now
    );
    parts.years = accurateYears;
    parts.days = accurateDays;

    if (yearsEl) yearsEl.textContent = String(parts.years);
    if (daysEl) daysEl.textContent = String(parts.days);
    if (hoursEl) hoursEl.textContent = pad2(parts.hours);
    if (minsEl) minsEl.textContent = pad2(parts.minutes);
    if (secsEl) secsEl.textContent = pad2(parts.seconds);
    if (totalDaysEl) totalDaysEl.textContent = String(parts.totalDays);

    dotEl.classList.toggle("future", isFuture);
    modeTextEl.textContent = isFuture ? "Counting down to start" : "Counting up since start";

    const tzLabel = USE_UTC ? "UTC" : "Local";
    // Subtitle removed per user request
    // subtitleEl.textContent =
    //   (isFuture ? "Starts at " : "Started at ") +
    //   start.toLocaleString(DISPLAY_LOCALE, { hour12: false }) +
    //   " (" + tzLabel + ")";
  }

  tick();
  setInterval(tick, 250);
})();
