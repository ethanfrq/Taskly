"""Builds the static landing page in site/: English at /, French at /fr/.

    python3 scripts/build-site.py

One template, two languages, so the pages can't drift apart. Copies the
framed screenshots from docs/readme/ and the brand files, and inlines Tabler
icons from node_modules (run `npm install` first). The page has no build step
on Vercel: commit what this script writes.
"""
import html
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
ASSETS = SITE / "assets"
ICONS = ROOT / "node_modules/@tabler/icons/icons/outline"

REPO = "https://github.com/ethanfrq/Taskly"
DEPLOY = (
    "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fethanfrq%2FTaskly"
    "&project-name=taskly&repository-name=taskly"
    "&env=BETTER_AUTH_SECRET,RESEND_API_KEY,EMAIL_FROM,NEXT_PUBLIC_VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY,VAPID_SUBJECT"
    "&envDescription=Secrets%20for%20sign-in%2C%20email%20codes%20and%20push%20notifications."
    "&envLink=https%3A%2F%2Fgithub.com%2Fethanfrq%2FTaskly%2Fblob%2Fmain%2Fdocs%2Fself-hosting.md%23environment-variables"
    "&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D"
)
OG_IMAGE = "https://raw.githubusercontent.com/ethanfrq/Taskly/main/docs/brand/social-preview.png"
SHOTS = ["today-dark", "agenda", "stats", "rhythm", "review", "onboarding-color"]


def icon(name: str) -> str:
    svg = (ICONS / f"{name}.svg").read_text()
    svg = re.sub(r'\s+class="[^"]*"', "", svg)
    svg = re.sub(r'\s+width="24"\s+height="24"', "", svg)
    svg = svg.replace("<svg", '<svg class="icon" aria-hidden="true" focusable="false"', 1)
    return re.sub(r"\s*\n\s*", " ", svg).replace("> <", "><").strip()


EN = {
    "lang": "en",
    "og_locale": "en_US",
    "home": "/",
    "other": ("/fr", "fr", "FR", "Version française"),
    "title": "Taskly · Your day, sorted by Claude",
    "description": "An open-source daily to-do app you install on your phone. Claude turns your mail, calendar and messages into one checklist, with reminders that actually ring.",
    "skip": "Skip to content",
    "nav_label": "Main",
    "nav": ["How it works", "Features", "Open source"],
    "eyebrow": "Free and open source",
    "h1": ["Your day,", "sorted by Claude."],
    "lead": "Claude turns your mail, calendar and messages into one checklist. Taskly makes sure you get reminded.",
    "cta_github": "View on GitHub",
    "cta_deploy": "Deploy your own",
    "alt": {
        "today-dark": "Taskly's Today screen: progress ring, next appointment and the three tasks Claude added from Gmail, Slack and the calendar",
        "agenda": "The agenda: meetings and tasks in time order",
        "stats": "Weekly stats: tasks done, streak, completion rate and focus time",
        "rhythm": "Reminder settings: morning briefing, evening review, quiet hours and insistence",
        "review": "The evening review: what's left, with a button to move it to tomorrow",
        "onboarding-color": "Choosing an accent color, with a live preview",
    },
    "how_h2": "One sentence each morning.",
    "how_lead": "Taskly never calls Claude and needs no API key. Your own Claude plan does the reading.",
    "steps": [
        ("Connect", "Add Taskly to Claude as a custom connector, once. You approve what it can do, and you can disconnect it in one tap."),
        ("Ask", "Say “Prepare my day in Taskly”. Claude reads your mail, calendar and messages and adds what needs doing, each task linked to its source."),
        ("Get reminded", "Taskly takes it from there: one clear checklist, and a notification at the right minute, even with Claude closed."),
    ],
    "features_h2": "Everything a day list needs.",
    "claude_title": "Claude prepares your day",
    "claude_text": "From the connectors Claude already uses. One tap undoes what it added, and duplicates are skipped.",
    "prompt": "“Prepare my day in Taskly”",
    "sources_label": "Sources Claude can read",
    "sources": ["Gmail", "Outlook", "Google Calendar", "Slack", "Teams", "Notion"],
    "tiles": {
        "reminders": ("Reminders that ring", "At the exact minute, with follow-ups for what matters and quiet hours for the rest."),
        "review": ("Close the day", "The evening review shows what's left and moves it to tomorrow in one tap."),
        "colors": ("Make it yours", "Your accent color, light or dark, with contrast adjusted so text stays readable."),
    },
    "pills_label": "More features",
    "pills": [
        ("wifi-off", "Works offline"),
        ("users", "Shared lists"),
        ("target", "Focus timer"),
        ("chart-bar", "Weekly stats"),
        ("cursor-text", "Natural language input"),
        ("repeat", "Recurring tasks"),
        ("subtask", "Subtasks and tags"),
        ("fingerprint", "Passkeys, no password"),
        ("language", "French and English"),
        ("download", "Export or delete your data"),
    ],
    "privacy_h2": "Tasks, not emails.",
    "privacy_lead": "Claude reads your messages with its own connectors. Taskly only receives the tasks it creates, with a link back to the source.",
    "facts": [
        ("fingerprint", "No password, ever"),
        ("plug-connected-x", "Disconnect Claude in one tap"),
        ("download", "Export or delete everything"),
    ],
    "open_h2": "Open source. Yours to run.",
    "open_lead": "MIT licensed and built in the open. Run your own instance on Vercel with Postgres, or on any Node.js server.",
    "cta_guide": "Read the guide",
    "code_comment": "# Open http://localhost:3000. Nothing to configure.",
    "code_label": "Run Taskly on your computer",
    "made_by": "Made by",
    "footer": [("GitHub", REPO), ("Self-hosting guide", f"{REPO}/blob/main/docs/self-hosting.md"), ("Connect Claude", f"{REPO}/blob/main/docs/connect-claude.md"), ("MIT license", f"{REPO}/blob/main/LICENSE")],
    "footer_label": "Project links",
    "disclaimer": "Taskly is an independent open-source project, not affiliated with Anthropic. Claude is a trademark of Anthropic.",
}

FR = {
    "lang": "fr",
    "og_locale": "fr_FR",
    "home": "/fr",
    "other": ("/", "en", "EN", "English version"),
    "title": "Taskly · Ta journée, triée par Claude",
    "description": "Une todo list du jour open source, à installer sur ton téléphone. Claude transforme tes mails, ton agenda et tes messages en checklist, avec des rappels qui sonnent vraiment.",
    "skip": "Aller au contenu",
    "nav_label": "Navigation principale",
    "nav": ["Comment ça marche", "Fonctions", "Open source"],
    "eyebrow": "Gratuit et open source",
    "h1": ["Ta journée,", "triée par Claude."],
    "lead": "Claude transforme tes mails, ton agenda et tes messages en une checklist. Taskly s'assure que tu reçois tes rappels.",
    "cta_github": "Voir sur GitHub",
    "cta_deploy": "Déployer ton instance",
    "alt": {
        "today-dark": "L'écran Aujourd'hui de Taskly : anneau de progression, prochain rendez-vous et les trois tâches ajoutées par Claude depuis Gmail, Slack et l'agenda",
        "agenda": "L'agenda : réunions et tâches dans l'ordre de la journée",
        "stats": "Les stats de la semaine : tâches faites, série, taux de réalisation et temps de focus",
        "rhythm": "Réglages des rappels : briefing du matin, bilan du soir, heures calmes et insistance",
        "review": "Le bilan du soir : ce qui reste, avec un bouton pour le reporter à demain",
        "onboarding-color": "Le choix de la couleur d'accent, avec un aperçu en direct",
    },
    "how_h2": "Une phrase chaque matin.",
    "how_lead": "Taskly n'appelle jamais Claude et n'a pas besoin de clé API. Ton propre plan Claude fait la lecture.",
    "steps": [
        ("Connecter", "Ajoute Taskly à Claude comme connecteur personnalisé, une seule fois. Tu choisis ce qu'il peut faire, et tu le déconnectes en un geste."),
        ("Demander", "Dis « Prépare ma journée dans Taskly ». Claude lit tes mails, ton agenda et tes messages et ajoute ce qu'il y a à faire, chaque tâche reliée à sa source."),
        ("Être rappelé", "Taskly prend le relais : une checklist claire, et une notification à la bonne minute, même Claude fermé."),
    ],
    "features_h2": "Tout ce qu'il faut pour ta journée.",
    "claude_title": "Claude prépare ta journée",
    "claude_text": "Avec les connecteurs que Claude utilise déjà. Un geste annule ce qu'il a ajouté, et les doublons sont ignorés.",
    "prompt": "« Prépare ma journée dans Taskly »",
    "sources_label": "Sources que Claude peut lire",
    "sources": ["Gmail", "Outlook", "Google Agenda", "Slack", "Teams", "Notion"],
    "tiles": {
        "reminders": ("Des rappels qui sonnent", "À la minute près, avec des relances pour ce qui compte et des heures calmes pour le reste."),
        "review": ("Boucle ta journée", "Le bilan du soir montre ce qui reste et le reporte à demain en un geste."),
        "colors": ("À ton image", "Ta couleur d'accent, clair ou sombre, avec un contraste ajusté pour que le texte reste lisible."),
    },
    "pills_label": "Autres fonctions",
    "pills": [
        ("wifi-off", "Hors-ligne"),
        ("users", "Listes partagées"),
        ("target", "Minuteur focus"),
        ("chart-bar", "Stats de la semaine"),
        ("cursor-text", "Saisie en langage naturel"),
        ("repeat", "Tâches récurrentes"),
        ("subtask", "Sous-tâches et tags"),
        ("fingerprint", "Passkeys, sans mot de passe"),
        ("language", "Français et anglais"),
        ("download", "Export ou suppression des données"),
    ],
    "privacy_h2": "Des tâches, pas des mails.",
    "privacy_lead": "Claude lit tes messages avec ses propres connecteurs. Taskly ne reçoit que les tâches qu'il crée, avec un lien vers la source.",
    "facts": [
        ("fingerprint", "Jamais de mot de passe"),
        ("plug-connected-x", "Claude déconnecté en un geste"),
        ("download", "Tout exporter ou tout supprimer"),
    ],
    "open_h2": "Open source. À toi de l'héberger.",
    "open_lead": "Sous licence MIT et construit en public. Lance ta propre instance sur Vercel avec Postgres, ou sur n'importe quel serveur Node.js.",
    "cta_guide": "Lire le guide",
    "code_comment": "# Ouvre http://localhost:3000. Rien à configurer.",
    "code_label": "Lancer Taskly sur ton ordinateur",
    "made_by": "Créé par",
    "footer": [("GitHub", REPO), ("Guide d'hébergement", f"{REPO}/blob/main/docs/self-hosting.md"), ("Connecter Claude", f"{REPO}/blob/main/docs/connect-claude.md"), ("Licence MIT", f"{REPO}/blob/main/LICENSE")],
    "footer_label": "Liens du projet",
    "disclaimer": "Taskly est un projet open source indépendant, non affilié à Anthropic. Claude est une marque d'Anthropic.",
}



def page(t: dict) -> str:
    e = html.escape
    other_href, other_lang, other_label, other_title = t["other"]

    def shot(name: str, cls: str, extra: str = 'loading="lazy" decoding="async"') -> str:
        return f'<img class="{cls}" src="/assets/{name}.webp" alt="{e(t["alt"][name])}" width="540" height="1052" {extra}>'

    steps = "\n".join(
        f'          <li class="step reveal"><h3>{e(verb)}</h3><p>{e(text)}</p></li>' for verb, text in t["steps"]
    )
    tiles = []
    for key, image in [("reminders", "rhythm"), ("review", "review"), ("colors", "onboarding-color")]:
        title, text = t["tiles"][key]
        tiles.append(
            f'''          <article class="tile tile-{key} reveal">
            <div class="tile-text"><h3>{e(title)}</h3><p>{e(text)}</p></div>
            {shot(image, "tile-shot")}
          </article>'''
        )
    pills = "\n".join(f"          <li>{icon(i)}{e(label)}</li>" for i, label in t["pills"])
    facts = "\n".join(f"          <li>{icon(i)}{e(label)}</li>" for i, label in t["facts"])
    sources = "".join(f"<li>{e(s)}</li>" for s in t["sources"])
    footer = "\n".join(f'          <li><a href="{e(href)}">{e(label)}</a></li>' for label, href in t["footer"])
    gh = icon("brand-github")

    return f'''<!doctype html>
<html lang="{t["lang"]}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>{e(t["title"])}</title>
    <meta name="description" content="{e(t["description"])}">
    <meta name="color-scheme" content="light dark">
    <meta name="theme-color" content="#f5f3ed" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#121212" media="(prefers-color-scheme: dark)">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Taskly">
    <meta property="og:title" content="{e(t["title"])}">
    <meta property="og:description" content="{e(t["description"])}">
    <meta property="og:image" content="{OG_IMAGE}">
    <meta property="og:image:width" content="1280">
    <meta property="og:image:height" content="640">
    <meta property="og:locale" content="{t["og_locale"]}">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/assets/apple-icon.png">
    <link rel="preload" as="image" href="/assets/today-dark.webp" type="image/webp">
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <a class="skip" href="#main">{e(t["skip"])}</a>
    <header class="nav">
      <div class="wrap nav-inner">
        <a class="brand" href="{t["home"]}">
          <picture>
            <source srcset="/assets/logo-ivory.svg" media="(prefers-color-scheme: dark)">
            <img src="/assets/logo-graphite.svg" alt="Taskly" width="104" height="33">
          </picture>
        </a>
        <nav aria-label="{e(t["nav_label"])}">
          <ul class="nav-links">
            <li><a href="#how">{e(t["nav"][0])}</a></li>
            <li><a href="#features">{e(t["nav"][1])}</a></li>
            <li><a href="#open-source">{e(t["nav"][2])}</a></li>
          </ul>
        </nav>
        <div class="nav-actions">
          <a class="lang" href="{other_href}" hreflang="{other_lang}" lang="{other_lang}" title="{e(other_title)}">{other_label}</a>
          <a class="btn btn-secondary btn-sm" href="{REPO}" aria-label="{e(t["cta_github"])}">{gh}<span>{e(t["cta_github"])}</span></a>
        </div>
      </div>
    </header>

    <main id="main">
      <section class="hero">
        <div class="wrap hero-grid">
          <div class="hero-copy">
            <p class="eyebrow">{e(t["eyebrow"])}</p>
            <h1><span>{e(t["h1"][0])}</span><br><span>{e(t["h1"][1])}</span></h1>
            <p class="lead">{e(t["lead"])}</p>
            <div class="ctas">
              <a class="btn btn-primary" href="{REPO}">{gh}{e(t["cta_github"])}</a>
              <a class="btn btn-secondary" href="{e(DEPLOY)}">{icon("rocket")}{e(t["cta_deploy"])}</a>
            </div>
          </div>
          <div class="hero-visual">
            {shot("agenda", "phone phone-left", 'decoding="async"')}
            {shot("stats", "phone phone-right", 'decoding="async"')}
            {shot("today-dark", "phone phone-front", 'fetchpriority="high"')}
          </div>
        </div>
      </section>

      <section id="how" class="section">
        <div class="wrap">
          <h2 class="reveal">{e(t["how_h2"])}</h2>
          <p class="section-lead reveal">{e(t["how_lead"])}</p>
          <ol class="steps">
{steps}
          </ol>
        </div>
      </section>

      <section id="features" class="section">
        <div class="wrap">
          <h2 class="reveal">{e(t["features_h2"])}</h2>
          <div class="bento">
            <article class="tile tile-claude reveal">
              <div class="tile-text"><h3>{e(t["claude_title"])}</h3><p>{e(t["claude_text"])}</p></div>
              <p class="prompt">{icon("sparkles")}<span>{e(t["prompt"])}</span></p>
              <ul class="sources" aria-label="{e(t["sources_label"])}">{sources}</ul>
            </article>
{chr(10).join(tiles)}
          </div>
          <ul class="pills reveal" aria-label="{e(t["pills_label"])}">
{pills}
          </ul>
        </div>
      </section>

      <section class="section manifesto">
        <div class="wrap">
          <h2 class="reveal">{e(t["privacy_h2"])}</h2>
          <p class="section-lead reveal">{e(t["privacy_lead"])}</p>
          <ul class="facts reveal">
{facts}
          </ul>
        </div>
      </section>

      <section id="open-source" class="section">
        <div class="wrap open">
          <div class="reveal">
            <h2>{e(t["open_h2"])}</h2>
            <p class="section-lead">{e(t["open_lead"])}</p>
            <div class="ctas">
              <a class="btn btn-primary" href="{e(DEPLOY)}">{icon("rocket")}{e(t["cta_deploy"])}</a>
              <a class="btn btn-secondary" href="{REPO}/blob/main/docs/self-hosting.md">{e(t["cta_guide"])}</a>
            </div>
          </div>
          <pre class="code reveal" aria-label="{e(t["code_label"])}"><code><span class="prompt-sign">$ </span>git clone {REPO}.git
<span class="prompt-sign">$ </span>cd Taskly &amp;&amp; npm install
<span class="prompt-sign">$ </span>npm run dev
<span class="comment">{e(t["code_comment"])}</span></code></pre>
        </div>
      </section>

      <p class="creator">
        <img src="https://github.com/ethanfrq.png?size=88" alt="" width="44" height="44" loading="lazy">
        <span>{e(t["made_by"])} <a href="https://github.com/ethanfrq">Ethan</a></span>
      </p>
    </main>

    <footer class="footer">
      <div class="wrap">
        <div class="footer-inner">
          <picture>
            <source srcset="/assets/logo-ivory.svg" media="(prefers-color-scheme: dark)">
            <img src="/assets/logo-graphite.svg" alt="Taskly" width="84" height="27">
          </picture>
          <nav aria-label="{e(t["footer_label"])}">
            <ul class="footer-links">
{footer}
            </ul>
          </nav>
        </div>
        <p class="disclaimer">{e(t["disclaimer"])}</p>
      </div>
    </footer>
  </body>
</html>
'''


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    for name in SHOTS:
        shutil.copy(ROOT / f"docs/readme/{name}.webp", ASSETS / f"{name}.webp")
    shutil.copy(ROOT / "public/brand/taskly-logo-graphite.svg", ASSETS / "logo-graphite.svg")
    shutil.copy(ROOT / "public/brand/taskly-logo-ivory.svg", ASSETS / "logo-ivory.svg")
    shutil.copy(ROOT / "src/app/icon.svg", ASSETS / "icon.svg")
    shutil.copy(ROOT / "src/app/apple-icon.png", ASSETS / "apple-icon.png")

    (SITE / "index.html").write_text(page(EN))
    (SITE / "fr").mkdir(exist_ok=True)
    (SITE / "fr/index.html").write_text(page(FR))

    for path in [SITE / "index.html", SITE / "fr/index.html"]:
        text = path.read_text()
        assert "—" not in text and "–" not in text, f"dash found in {path}"
    print("site/ built:", ", ".join(sorted(p.name for p in ASSETS.iterdir())))


if __name__ == "__main__":
    main()
