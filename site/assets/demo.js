// Taskly demo (/demo): the app's Today screen and evening review, simulated in the
// browser. Nothing is sent or saved. Text and icons come from #demo-data, written by
// scripts/build-site.py in the page's language.
(() => {
  const { lang, t, icons } = JSON.parse(document.getElementById("demo-data").textContent);
  const phone = document.querySelector("[data-demo]");
  if (!phone) return;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fill = (s, values) => s.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");
  const icon = (name, cls = "") => (icons[name] || "").replace('class="icon"', `class="icon ${cls}"`);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let nextId = 1;
  const task = (title, source = null, time = "", priority = 0, fromClaude = false) => ({
    id: nextId++,
    title,
    source,
    time,
    priority,
    fromClaude,
    done: false,
    fresh: false,
  });

  const st = {
    view: "today",
    filled: false,
    undone: false,
    sheet: null, // "reading" | "done"
    toast: "",
    tasks: t.manual.map((title) => task(title)),
    review: {}, // task id → "moved" | "deleted"
    ended: false,
    steps: new Set(),
  };

  const date = (() => {
    const text = new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "long" }).format(new Date());
    return text.charAt(0).toUpperCase() + text.slice(1);
  })();

  const visible = () => st.tasks.filter((x) => !(st.undone && x.fromClaude));

  const ring = (done, total, size) => {
    const c = 94.25;
    const v = total ? (c * done) / total : 0;
    return `<svg class="d-ring" width="${size}" height="${size}" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--d-sep)" stroke-width="4"/>${v ? `<circle cx="18" cy="18" r="15" fill="none" stroke="var(--d-accent)" stroke-width="4" stroke-dasharray="${v.toFixed(2)} ${c}" stroke-linecap="round" transform="rotate(-90 18 18)"/>` : ""}</svg>`;
  };

  const statusBar = () =>
    `<div class="d-status" aria-hidden="true"><span>9:41</span><span>${icon("antenna-bars-5")}${icon("wifi")}${icon("battery-4")}</span></div>`;

  const sourceIcon = { gmail: "brand-gmail", calendar: "calendar", slack: "brand-slack" };

  function next() {
    const items = visible()
      .filter((x) => !x.done && x.time)
      .map((x) => ({ time: x.time, title: x.title }));
    if (st.filled && !st.undone) items.push({ time: t.event[0], title: t.event[1] });
    return items.sort((a, b) => a.time.localeCompare(b.time))[0] || null;
  }

  function row(x) {
    const meta = [];
    if (x.time) meta.push(`<span class="d-accent">${esc(x.time)}</span>`);
    meta.push(
      x.source
        ? `<span>${icon(sourceIcon[x.source])}${esc(t.sources[x.source])}</span>`
        : `<span>${icon("pencil")}${esc(t.byHand)}</span>`,
    );
    const label = fill(x.done ? t.reopen : t.complete, { title: x.title });
    return `<li class="d-row${x.done ? " is-done" : ""}${x.fresh ? " is-fresh" : ""}">
      <button type="button" class="d-check" role="checkbox" aria-checked="${x.done}" aria-label="${esc(label)}" data-a="tick:${x.id}">${x.done ? icon("check") : ""}</button>
      <div class="d-row-text"><span class="d-row-title">${esc(x.title)}</span><span class="d-meta">${meta.join('<span aria-hidden="true">·</span>')}</span></div>
      ${x.priority && !x.done ? `<span class="d-prio" aria-hidden="true">${"!".repeat(x.priority)}</span>` : ""}
    </li>`;
  }

  function today() {
    const list = visible();
    const done = list.filter((x) => x.done).length;
    const n = next();
    const refresh = st.filled && !st.undone;
    return `${statusBar()}
      <div class="d-body">
        <p class="d-date">${esc(date)}</p>
        <p class="d-title">${esc(t.today)}</p>
        <div class="d-tiles">
          <div class="d-card d-progress">${ring(done, list.length, 40)}<div><strong>${done}/${list.length}</strong><span>${esc(t.done)}</span></div></div>
          <div class="d-card d-next"><span class="d-accent d-next-label">${icon("calendar-event")}${esc(t.next)}</span>${
            n ? `<strong>${esc(n.time)}</strong><span class="d-ellipsis">${esc(n.title)}</span>` : `<span>${esc(t.nothingNext)}</span>`
          }</div>
        </div>
        <button type="button" class="d-card d-claude${refresh ? "" : " is-primary"}" data-a="claude">
          <span class="d-badge">${icon(refresh ? "refresh" : "sparkles")}</span>
          <span class="d-claude-text"><strong>${esc(refresh ? t.refreshTitle : t.prepareTitle)}</strong><span>${esc(refresh ? t.refreshBody : t.prepareBody)}</span></span>
          ${icon("chevron-right", "d-muted")}
        </button>
        ${
          st.filled
            ? `<div class="d-banner">${icon(st.undone ? "refresh" : "sparkles")}<span>${esc(st.undone ? t.undone : t.banner)}</span><button type="button" data-a="undo">${esc(st.undone ? t.redo : t.undo)}</button></div>`
            : ""
        }
        <p class="d-caption">${esc(t.todo)}</p>
        <ul class="d-list">${list.map(row).join("")}</ul>
      </div>
      <form class="d-add" data-add>
        ${icon("circle-plus", "d-accent")}
        <label class="sr-only" for="d-add-input">${esc(t.newTask)}</label>
        <input id="d-add-input" autocomplete="off" enterkeyhint="done" placeholder="${esc(t.placeholder)}">
      </form>
      <div class="d-tabs" aria-hidden="true">${icon("sun", "d-accent")}${icon("calendar")}${icon("list")}${icon("settings")}</div>`;
  }

  function review() {
    const list = visible();
    const done = list.filter((x) => x.done).length;
    const left = list.filter((x) => !x.done);
    const rows = left.length
      ? left
          .map((x) => {
            const outcome = st.review[x.id];
            return `<li class="d-row"><span class="d-row-title d-ellipsis">${esc(x.title)}</span>${
              outcome
                ? `<span class="d-muted d-small">${esc(outcome === "moved" ? t.reviewMoved : t.reviewDeleted)}</span>`
                : `<button type="button" class="d-chip d-accent" data-a="move:${x.id}">${esc(t.reviewTomorrow)}</button><button type="button" class="d-chip" data-a="delete:${x.id}" aria-label="${esc(fill(t.reviewDelete, { title: x.title }))}">${icon("trash")}</button>`
            }</li>`;
          })
          .join("")
      : `<li class="d-row">${esc(t.reviewAllDone)}</li>`;
    return `${statusBar()}
      <div class="d-body">
        <button type="button" class="d-back" data-a="today">${icon("chevron-left")}${esc(t.today)}</button>
        <p class="d-date">${esc(date)} · 18:30</p>
        <p class="d-title">${esc(t.reviewTitle)}</p>
        <div class="d-card d-review-ring">${ring(done, list.length, 56)}<div><strong>${esc(fill(t.reviewOf, { done, total: list.length }))}</strong><span>${esc(t.reviewSub)}</span></div></div>
        <p class="d-caption">${esc(t.reviewLeft)}</p>
        <ul class="d-list">${rows}</ul>
        <p class="d-caption">${esc(t.reviewTomorrow)}</p>
        <div class="d-card d-planned">${icon("calendar", "d-accent")}<span>${esc(t.reviewPlanned)}</span></div>
      </div>
      <div class="d-foot"><button type="button" class="d-button" data-a="end">${st.ended ? `${icon("check")}${esc(t.reviewEnded)}` : esc(t.reviewEnd)}</button></div>`;
  }

  function sheet() {
    if (!st.sheet) return "";
    const reading = st.sheet === "reading";
    return `<div class="d-backdrop"><div class="d-sheet" role="dialog" aria-modal="true" aria-label="Claude">
      <p class="d-sheet-head">${icon("message-chatbot")}Claude</p>
      <p class="d-bubble d-you">${esc(t.claudeYou)}</p>
      <p class="d-bubble d-reply" aria-live="polite">${reading ? `${icon("loader-2", "d-spin")}${esc(t.claudeReading)}` : esc(t.claudeDone)}</p>
      <button type="button" class="d-button" data-a="close" ${reading ? "disabled" : ""}>${esc(t.claudeBack)}</button>
    </div></div>`;
  }

  function render(focus) {
    phone.innerHTML = `<div class="d-screen">${st.view === "today" ? today() : review()}${
      st.toast ? `<p class="d-toast" role="status">${esc(st.toast)}</p>` : ""
    }${sheet()}</div>`;
    st.tasks.forEach((x) => (x.fresh = false));
    document.querySelectorAll("[data-step]").forEach((el) => el.classList.toggle("is-done", st.steps.has(+el.dataset.step)));
    if (focus) phone.querySelector(focus)?.focus({ preventScroll: true });
  }

  const done = (step) => st.steps.add(step);

  function askClaude() {
    st.sheet = "reading";
    render('[data-a="close"]');
    setTimeout(() => {
      st.sheet = "done";
      render('[data-a="close"]');
    }, reduceMotion ? 300 : 1600);
  }

  function closeSheet() {
    st.sheet = null;
    if (!st.filled || st.undone) {
      st.tasks = st.tasks.filter((x) => !x.fromClaude);
      const added = t.claudeTasks.map(([title, source, time, priority]) => task(title, source, time, priority, true));
      added.forEach((x) => (x.fresh = true));
      st.tasks = [...added, ...st.tasks];
      st.filled = true;
      st.undone = false;
    }
    done(1);
    render('[data-a="claude"]');
  }

  function toast(text) {
    st.toast = text;
    render();
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      st.toast = "";
      render();
    }, 2600);
  }

  // "Call Paul tomorrow 2pm", "Appeler Paul demain 14h": the same parsing idea as the app, much simpler.
  function add(text) {
    let title = text.trim();
    if (!title) return;
    let tomorrow = false;
    let time = "";
    const word = new RegExp(`\\s*\\b${t.tomorrowWord}\\b\\s*`, "i");
    if (word.test(title)) {
      tomorrow = true;
      title = title.replace(word, " ");
    }
    const h = title.match(/\b(\d{1,2})\s*h\s*(\d{2})?\b/i);
    const ampm = title.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    const clock = title.match(/\b(\d{1,2}):(\d{2})\b/);
    if (h) {
      time = `${h[1].padStart(2, "0")}:${h[2] || "00"}`;
      title = title.replace(h[0], " ");
    } else if (ampm) {
      const hour = (+ampm[1] % 12) + (ampm[3].toLowerCase() === "pm" ? 12 : 0);
      time = `${String(hour).padStart(2, "0")}:${ampm[2] || "00"}`;
      title = title.replace(ampm[0], " ");
    } else if (clock) {
      time = `${clock[1].padStart(2, "0")}:${clock[2]}`;
      title = title.replace(clock[0], " ");
    }
    title = title.replace(/\s+/g, " ").trim();
    if (!title) return;
    title = title.charAt(0).toUpperCase() + title.slice(1);
    const at = time ? fill(t.at, { time }) : "";
    done(3);
    if (tomorrow) {
      toast(fill(t.addedTomorrow, { title }) + at);
    } else {
      const x = task(title, null, time);
      x.fresh = true;
      st.tasks.push(x);
      toast(fill(t.added, { title }) + at);
    }
    phone.querySelector("#d-add-input")?.focus({ preventScroll: true });
  }

  phone.addEventListener("click", (event) => {
    const el = event.target.closest("[data-a]");
    if (!el || el.disabled) return;
    const [action, value] = el.dataset.a.split(":");
    const id = +value;
    const x = st.tasks.find((y) => y.id === id);
    switch (action) {
      case "claude":
        askClaude();
        break;
      case "close":
        closeSheet();
        break;
      case "undo":
        st.undone = !st.undone;
        done(2);
        render('[data-a="undo"]');
        break;
      case "tick":
        if (x) x.done = !x.done;
        done(2);
        render(`[data-a="tick:${id}"]`);
        break;
      case "today":
        st.view = "today";
        render('[data-a="claude"]');
        break;
      case "move":
      case "delete":
        st.review[id] = action === "move" ? "moved" : "deleted";
        render(".d-back");
        break;
      case "end":
        st.ended = true;
        done(4);
        render('[data-a="end"]');
        break;
    }
  });

  phone.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.target.querySelector("input");
    add(input.value || input.placeholder);
  });

  document.querySelector("[data-demo-review]")?.addEventListener("click", () => {
    st.view = "review";
    done(4);
    render(".d-back");
    phone.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  });

  render();
})();
