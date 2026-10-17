"""Builds the static landing page in site/: English at /, French at /fr/.

    python3 scripts/build-site.py

One template, two languages, so the pages can't drift apart. Copies the
framed screenshots and the video posters from docs/readme/ and the brand files,
and inlines Tabler icons from node_modules (run `npm install` first). Also writes
the social share images (needs Pillow), sitemap.xml and robots.txt. The videos
themselves are rendered straight into site/assets/ by the Remotion project in
video/. The page has no build step on Vercel: commit what this script writes.
"""
import hashlib
import html
import json
import re
import shutil
from pathlib import Path

from PIL import Image

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
SITE_URL = "https://taskly-day.vercel.app"
PAGE_URLS = {"en": f"{SITE_URL}/", "fr": f"{SITE_URL}/fr"}
DEMO_PATHS = {"en": "/demo", "fr": "/fr/demo"}
DEMO_URLS = {lang: f"{SITE_URL}{path}" for lang, path in DEMO_PATHS.items()}
# Icons the demo's script draws, inlined so the page needs no icon font or CDN.
DEMO_ICONS = [
    "check", "sparkles", "calendar-event", "brand-gmail", "calendar", "brand-slack", "pencil", "circle-plus", "sun",
    "list", "settings", "trash", "chevron-left", "chevron-right", "loader-2", "message-chatbot", "antenna-bars-5",
    "wifi", "battery-4", "refresh",
]
SHOTS = ["today-dark", "agenda", "stats", "rhythm", "review", "onboarding-color"]
POSTERS = ["poster-en", "poster-fr", "poster-en-vertical", "poster-fr-vertical"]


def icon(name: str, cls: str = "icon") -> str:
    svg = (ICONS / f"{name}.svg").read_text()
    svg = re.sub(r'\s+class="[^"]*"', "", svg)
    svg = re.sub(r'\s+width="24"\s+height="24"', "", svg)
    svg = svg.replace("<svg", f'<svg class="{cls}" aria-hidden="true" focusable="false"', 1)
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
    "nav": ["How it works", "Features", "Open source", "FAQ"],
    "eyebrow": "Free and open source",
    "h1": ["Your day,", "sorted by Claude."],
    "lead": "Claude turns your mail, calendar and messages into one checklist. Taskly makes sure you get reminded.",
    "cta_github": "View on GitHub",
    "cta_deploy": "Deploy your own",
    "video_label": "Taskly in 30 seconds",
    "video_desc": "Taskly in 30 seconds. This morning's pile: 47 emails, 12 messages, 3 meetings, and no list. One sentence to Claude, and the list fills itself, each task linked to its source. Two tasks ticked, a reminder rings at the right minute. Tasks, not emails: open source, no password, disconnect Claude in one tap.",
    "video_play": "Play",
    "video_pause": "Pause",
    "screens_label": "Screens of the app",
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
    "faq_h2": "Questions, answered.",
    "faq": [
        ("Is it free?", "Yes. Taskly is open source under the MIT license. Your own instance fits in the free plans of Vercel and Neon, and Claude's free plan is enough for the connector.", None),
        ("Which Claude plan do I need?", "Any. On the free plan, Taskly can be your one custom connector. On Pro and Max, add it in your connector settings. On Team and Enterprise, an organization owner adds it once.", ("How to connect Claude", f"{REPO}/blob/main/docs/connect-claude.md")),
        ("Does Taskly read my email?", "No. Claude reads your email, calendar and messages with its own connectors. Taskly only receives the tasks and today's meetings Claude sends it, each task with a link back to its source.", None),
        ("Do I have to ask Claude every morning?", "One tap is enough. The morning briefing opens Claude with “Prepare my day in Taskly” already typed, and the Prepare my day button in the app does the same. Taskly can't start Claude on its own.", None),
        ("Which devices does it run on?", "iPhone, Android and computers, installed from the browser like an app. On iPhone, add it to the home screen from Safari: notifications need iOS 16.4 or later.", None),
        ("How do I get my own Taskly?", "There's no public instance: everyone runs their own. The Deploy button creates it on Vercel with a Neon database, and personal mode lets only your email address sign in.", ("Self-hosting guide", f"{REPO}/blob/main/docs/self-hosting.md")),
        ("What if Claude gets it wrong?", "Everything Claude adds can be undone in one tap, every task links to the email or message it came from, and a task you edited is never rewritten by Claude.", None),
        ("Where is my data?", "In your instance's Postgres database, nowhere else. Settings lets you export everything as JSON or delete your account.", None),
    ],
    "closing_h2": "Your day starts here.",
    "closing_lead": "Install Taskly on your phone, connect Claude once, and let it prepare your day.",
    "cta_demo": "Try the demo",
    "demo": {
        "title": "Try Taskly · Demo",
        "description": "Try Taskly in your browser: ask Claude to prepare the day, tick tasks, add one in a sentence, close the day. No account, nothing saved.",
        "h1": "Try Taskly, no account needed.",
        "lead": "Everything runs in your browser: nothing is sent or saved. In the real app, your own Claude writes the tasks from your mail, calendar and messages.",
        "steps_label": "What to try",
        "steps": [
            ("Ask Claude to prepare your day", "Tap “Prepare my day” on the phone."),
            ("Tick a task", "Or undo what Claude added, in one tap."),
            ("Add a task in one sentence", "Try “Call Paul tomorrow 2pm”."),
            ("Close the day", "The evening review moves what's left to tomorrow."),
        ],
        "review_cta": "See the evening review",
        "phone_label": "Taskly demo",
        "note": "Simulated demo: Claude reads nothing here.",
        "outro_h2": "Like it? Get your own.",
        "outro_lead": "Taskly is free and open source. Deploy your instance, add it to Claude, and your mornings start like this.",
        "back": "Back to the home page",
        "app": {
            "today": "Today",
            "done": "done",
            "next": "Next",
            "nothingNext": "Nothing planned",
            "todo": "To do",
            "prepareTitle": "Prepare my day",
            "prepareBody": "Claude reads your calendar and email, then fills your list.",
            "refreshTitle": "Refresh with Claude",
            "refreshBody": "New email, a moved meeting: Claude updates your list.",
            "banner": "Claude added 4 tasks from Gmail, Calendar and Slack",
            "undo": "Undo",
            "undone": "Claude's tasks removed",
            "redo": "Restore",
            "newTask": "New task",
            "placeholder": "Call Paul tomorrow 2pm",
            "added": "“{title}” added",
            "addedTomorrow": "“{title}” added for tomorrow",
            "at": " at {time}",
            "tomorrowWord": "tomorrow",
            "byHand": "Added by hand",
            "complete": "Mark “{title}” as done",
            "reopen": "Mark “{title}” as not done",
            "sources": {"gmail": "Gmail", "calendar": "Calendar", "slack": "Slack"},
            "claudeYou": "Prepare my day in Taskly",
            "claudeReading": "Reading Gmail, Google Calendar and Slack…",
            "claudeDone": "Done: 4 tasks added to Taskly, each linked to its source. Your first one is at 10:30.",
            "claudeBack": "Back to Taskly",
            "reviewTitle": "Evening review",
            "reviewOf": "{done} of {total}",
            "reviewSub": "tasks done today",
            "reviewLeft": "Not done",
            "reviewTomorrow": "Tomorrow",
            "reviewMoved": "Moved to tomorrow",
            "reviewDeleted": "Deleted",
            "reviewDelete": "Delete “{title}”",
            "reviewAllDone": "All done.",
            "reviewPlanned": "2 meetings · 3 tasks already planned",
            "reviewEnd": "Close the day",
            "reviewEnded": "Day closed",
            "event": ["14:00", "Acme client demo"],
            "manual": ["Buy Mom's present"],
            "claudeTasks": [
                ["Send the signed quote to Dupont", "gmail", "10:30", 3],
                ["Prepare the team meeting agenda", "calendar", "16:00", 0],
                ["Reply to Sarah about the schedule", "gmail", "", 3],
                ["Review Léa's pull request", "slack", "", 0],
            ],
        },
    },
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
    "nav": ["Comment ça marche", "Fonctions", "Open source", "FAQ"],
    "eyebrow": "Gratuit et open source",
    "h1": ["Ta journée,", "triée par Claude."],
    "lead": "Claude transforme tes mails, ton agenda et tes messages en une checklist. Taskly s'assure que tu reçois tes rappels.",
    "cta_github": "Voir sur GitHub",
    "cta_deploy": "Déployer ton instance",
    "video_label": "Taskly en 30 secondes",
    "video_desc": "Taskly en 30 secondes. Ce matin : 47 mails, 12 messages, 3 réunions, et aucune liste. Une phrase à Claude, et la liste se remplit, chaque tâche reliée à sa source. Deux tâches cochées, un rappel sonne à la bonne minute. Des tâches, pas des mails : open source, pas de mot de passe, Claude déconnecté en un geste.",
    "video_play": "Lecture",
    "video_pause": "Pause",
    "screens_label": "Écrans de l'application",
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
    "faq_h2": "Tes questions, nos réponses.",
    "faq": [
        ("C'est gratuit ?", "Oui. Taskly est open source, sous licence MIT. Ta propre instance tient dans les offres gratuites de Vercel et de Neon, et le plan gratuit de Claude suffit pour le connecteur.", None),
        ("Quel abonnement Claude faut-il ?", "N'importe lequel. Avec le plan gratuit, Taskly peut être ton connecteur personnalisé. Avec Pro et Max, ajoute-le dans tes réglages de connecteurs. Avec Team et Entreprise, un propriétaire de l'organisation l'ajoute une fois.", ("Connecter Claude", f"{REPO}/blob/main/docs/connect-claude.md")),
        ("Taskly lit-il mes mails ?", "Non. Claude lit tes mails, ton agenda et tes messages avec ses propres connecteurs. Taskly ne reçoit que les tâches et les rendez-vous du jour que Claude lui envoie, chaque tâche avec un lien vers sa source.", None),
        ("Faut-il demander à Claude chaque matin ?", "Un geste suffit. Le briefing du matin ouvre Claude avec « Prépare ma journée dans Taskly » déjà écrit, et le bouton Préparer ma journée de l'app fait pareil. Taskly ne peut pas lancer Claude tout seul.", None),
        ("Sur quels appareils ?", "iPhone, Android et ordinateur, installé depuis le navigateur comme une app. Sur iPhone, ajoute-le à l'écran d'accueil depuis Safari : les notifications demandent iOS 16.4 ou plus.", None),
        ("Comment avoir mon Taskly ?", "Il n'y a pas d'instance publique : chacun héberge la sienne. Le bouton Déployer la crée sur Vercel avec une base Neon, et le mode personnel n'autorise que ton adresse mail.", ("Guide d'hébergement", f"{REPO}/blob/main/docs/self-hosting.md")),
        ("Et si Claude se trompe ?", "Tout ce que Claude ajoute s'annule en un geste, chaque tâche garde un lien vers son mail ou son message, et une tâche que tu as modifiée n'est jamais réécrite par Claude.", None),
        ("Où sont mes données ?", "Dans la base Postgres de ton instance, nulle part ailleurs. Les Réglages te permettent de tout exporter en JSON ou de supprimer ton compte.", None),
    ],
    "closing_h2": "Ta journée commence ici.",
    "closing_lead": "Installe Taskly sur ton téléphone, connecte Claude une fois, et laisse-le préparer ta journée.",
    "cta_demo": "Essayer la démo",
    "demo": {
        "title": "Essayer Taskly · Démo",
        "description": "Essaie Taskly dans ton navigateur : demande à Claude de préparer ta journée, coche, ajoute une tâche en une phrase, boucle ta journée. Sans compte, rien n'est enregistré.",
        "h1": "Essaie Taskly, sans compte.",
        "lead": "Tout se passe dans ton navigateur : rien n'est envoyé ni enregistré. Dans la vraie app, c'est ton Claude qui écrit les tâches depuis tes mails, ton agenda et tes messages.",
        "steps_label": "À essayer",
        "steps": [
            ("Demande à Claude de préparer ta journée", "Touche « Préparer ma journée » sur le téléphone."),
            ("Coche une tâche", "Ou annule d'un geste ce que Claude a ajouté."),
            ("Ajoute une tâche en une phrase", "Essaie « Appeler Paul demain 14h »."),
            ("Boucle ta journée", "Le bilan du soir reporte à demain ce qui reste."),
        ],
        "review_cta": "Voir le bilan du soir",
        "phone_label": "Démo de Taskly",
        "note": "Démo simulée : Claude ne lit rien ici.",
        "outro_h2": "Ça te plaît ? Installe ta version.",
        "outro_lead": "Taskly est gratuit et open source. Déploie ton instance, ajoute-la à Claude, et tes matins commencent comme ça.",
        "back": "Retour à l'accueil",
        "app": {
            "today": "Aujourd'hui",
            "done": "faites",
            "next": "Prochain",
            "nothingNext": "Rien de prévu",
            "todo": "À faire",
            "prepareTitle": "Préparer ma journée",
            "prepareBody": "Claude lit ton agenda et tes mails, puis remplit ta liste.",
            "refreshTitle": "Actualiser avec Claude",
            "refreshBody": "Nouveaux mails, réunion déplacée : Claude met ta liste à jour.",
            "banner": "Claude a ajouté 4 tâches depuis Gmail, Agenda et Slack",
            "undo": "Annuler",
            "undone": "Tâches de Claude retirées",
            "redo": "Rétablir",
            "newTask": "Nouvelle tâche",
            "placeholder": "Appeler Paul demain 14h",
            "added": "« {title} » ajoutée",
            "addedTomorrow": "« {title} » ajoutée pour demain",
            "at": " à {time}",
            "tomorrowWord": "demain",
            "byHand": "Ajoutée à la main",
            "complete": "Marquer « {title} » comme faite",
            "reopen": "Marquer « {title} » comme à faire",
            "sources": {"gmail": "Gmail", "calendar": "Agenda", "slack": "Slack"},
            "claudeYou": "Prépare ma journée dans Taskly",
            "claudeReading": "Je lis Gmail, Google Agenda et Slack…",
            "claudeDone": "C'est prêt : 4 tâches ajoutées dans Taskly, chacune reliée à sa source. La première est à 10:30.",
            "claudeBack": "Retour à Taskly",
            "reviewTitle": "Bilan du soir",
            "reviewOf": "{done} sur {total}",
            "reviewSub": "tâches faites aujourd'hui",
            "reviewLeft": "Pas terminé",
            "reviewTomorrow": "Demain",
            "reviewMoved": "Reportée à demain",
            "reviewDeleted": "Supprimée",
            "reviewDelete": "Supprimer « {title} »",
            "reviewAllDone": "Tout est fait.",
            "reviewPlanned": "2 réunions · 3 tâches déjà prévues",
            "reviewEnd": "Terminer la journée",
            "reviewEnded": "Journée terminée",
            "event": ["14:00", "Démo client Acme"],
            "manual": ["Acheter le cadeau de Maman"],
            "claudeTasks": [
                ["Envoyer le devis signé à Dupont", "gmail", "10:30", 3],
                ["Préparer l'ordre du jour du point équipe", "calendar", "16:00", 0],
                ["Répondre à Sarah sur le planning", "gmail", "", 3],
                ["Relire la PR de Léa", "slack", "", 0],
            ],
        },
    },
}



def monogram(cls: str) -> str:
    """The Taskly mark, inline and in currentColor, so CSS picks its color per theme."""
    svg = (ROOT / "public/brand/taskly-monogram-graphite.svg").read_text().strip()
    svg = svg.replace('fill="#171717"', 'fill="currentColor"').replace(' role="img" aria-label="Taskly"', "")
    return svg.replace("<svg", f'<svg class="{cls}" aria-hidden="true" focusable="false"', 1)


def asset_hash(name: str) -> str:
    return hashlib.sha256((ASSETS / name).read_bytes()).hexdigest()[:8]


def share_image(lang: str) -> None:
    """The video poster, with the Taskly logo, cropped to the 1200 x 630 that social cards expect."""
    card = Image.open(ROOT / f"docs/readme/poster-{lang}.webp").convert("RGB")
    card = card.crop((0, 24, 1280, 696)).resize((1200, 630), Image.LANCZOS)
    # The logo, cut out of the ivory-on-graphite social preview: only the ivory, not the gray tagline or the background.
    social = Image.open(ROOT / "docs/brand/social-preview.png").convert("L")
    social = social.crop(social.point(lambda v: 255 if v > 200 else 0).getbbox())
    mark = social.point(lambda v: max(0, min(255, (v - 60) * 255 // 180)))
    mark = mark.resize((220, round(220 * mark.height / mark.width)), Image.LANCZOS)
    card.paste(Image.new("RGB", mark.size, (245, 243, 237)), (100, 64), mark)
    card.save(ASSETS / f"og-{lang}.jpg", quality=86, optimize=True, progressive=True)


def structured_data(t: dict) -> str:
    """schema.org data for search engines: what Taskly is, that it's free, who made it."""
    data = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Taskly",
        "description": t["description"],
        "url": PAGE_URLS[t["lang"]],
        "inLanguage": t["lang"],
        "applicationCategory": "ProductivityApplication",
        "operatingSystem": "iOS, Android, macOS, Windows, Linux",
        "isAccessibleForFree": True,
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"},
        "license": "https://opensource.org/licenses/MIT",
        "author": {"@type": "Person", "name": "Ethan", "url": "https://github.com/ethanfrq"},
        "sameAs": [REPO],
    }
    return json.dumps(data, ensure_ascii=False)


def shell(
    t: dict,
    *,
    urls: dict,
    other_href: str,
    title: str,
    description: str,
    main: str,
    anchor_base: str = "",
    extra_head: str = "",
    preload: str = "",
    scripts: str = "",
) -> str:
    """The page around the content: head and share tags, nav, footer. Shared by the landing and the demo."""
    e = html.escape
    lang = t["lang"]
    url = urls[lang]
    other_locale = "en_US" if lang == "fr" else "fr_FR"
    og_image = f"{SITE_URL}/assets/og-{lang}.jpg?v={asset_hash(f'og-{lang}.jpg')}"
    _, other_lang, other_label, other_title = t["other"]
    footer = "\n".join(f'          <li><a href="{e(href)}">{e(label)}</a></li>' for label, href in t["footer"])
    gh = icon("brand-github")

    return f'''<!doctype html>
<html lang="{t["lang"]}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>{e(title)}</title>
    <meta name="description" content="{e(description)}">
    <meta name="color-scheme" content="light dark">
    <meta name="theme-color" content="#f2f2f7" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Taskly">
    <meta property="og:title" content="{e(title)}">
    <meta property="og:description" content="{e(description)}">
    <meta property="og:url" content="{url}">
    <meta property="og:image" content="{og_image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="{e(t["title"])}">
    <meta property="og:locale" content="{t["og_locale"]}">
    <meta property="og:locale:alternate" content="{other_locale}">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="canonical" href="{url}">
    <link rel="alternate" hreflang="en" href="{urls["en"]}">
    <link rel="alternate" hreflang="fr" href="{urls["fr"]}">
    <link rel="alternate" hreflang="x-default" href="{urls["en"]}">
{extra_head}    <link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/assets/apple-icon.png">
{preload}    <link rel="stylesheet" href="/styles.css">
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
            <li><a href="{anchor_base}#how">{e(t["nav"][0])}</a></li>
            <li><a href="{anchor_base}#features">{e(t["nav"][1])}</a></li>
            <li><a href="{anchor_base}#open-source">{e(t["nav"][2])}</a></li>
            <li><a href="{anchor_base}#faq">{e(t["nav"][3])}</a></li>
          </ul>
        </nav>
        <div class="nav-actions">
          <a class="lang" href="{other_href}" hreflang="{other_lang}" lang="{other_lang}" title="{e(other_title)}">{other_label}</a>
          <a class="btn btn-secondary btn-sm" href="{REPO}" aria-label="{e(t["cta_github"])}">{gh}<span>{e(t["cta_github"])}</span></a>
        </div>
      </div>
    </header>

    <main id="main">
{main}    </main>

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
{scripts}  </body>
</html>
'''


def page(t: dict) -> str:
    e = html.escape
    lang = t["lang"]

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
    gh = icon("brand-github")
    faq = "\n".join(
        f'''            <details class="faq-item reveal">
              <summary><span>{e(q)}</span>{icon("plus", "icon faq-icon")}</summary>
              <p>{e(a)}{f' <a href="{e(link[1])}">{e(link[0])}</a>' if link else ""}</p>
            </details>'''
        for q, a, link in t["faq"]
    )

    main = f'''      <section class="hero">
        <div class="wrap">
          <div class="hero-copy">
            <p class="eyebrow"><img class="eyebrow-icon" src="/assets/app-icon.svg" alt="" width="28" height="28"><span>{e(t["eyebrow"])}</span></p>
            <h1><span>{e(t["h1"][0])}</span><br><span>{e(t["h1"][1])}</span></h1>
            <p class="lead">{e(t["lead"])}</p>
            <div class="ctas">
              <a class="btn btn-primary" href="{DEMO_PATHS[lang]}">{icon("player-play")}{e(t["cta_demo"])}</a>
              <a class="btn btn-secondary" href="{REPO}">{gh}{e(t["cta_github"])}</a>
            </div>
          </div>
          <div class="hero-stage">
            <figure class="hero-video" data-vertical="/assets/taskly-30s-{lang}-vertical.mp4" data-vertical-poster="/assets/poster-{lang}-vertical.webp">
              <video src="/assets/taskly-30s-{lang}.mp4" poster="/assets/poster-{lang}.webp" width="1920" height="1080" autoplay muted loop playsinline preload="metadata" aria-label="{e(t["video_label"])}"></video>
              <button class="video-toggle" type="button" aria-pressed="true" data-play="{e(t["video_play"])}" data-pause="{e(t["video_pause"])}">{icon("player-pause", "icon icon-pause")}{icon("player-play", "icon icon-play")}<span>{e(t["video_pause"])}</span></button>
              <figcaption class="sr-only">{e(t["video_desc"])}</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section class="screens" aria-label="{e(t["screens_label"])}">
        <div class="wrap">
          <div class="phones">
            {shot("agenda", "phone phone-left")}
            {shot("today-dark", "phone phone-front", 'decoding="async"')}
            {shot("stats", "phone phone-right")}
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
        {monogram("watermark")}
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

      <section id="faq" class="section">
        <div class="wrap faq">
          <h2 class="reveal">{e(t["faq_h2"])}</h2>
          <div class="faq-list">
{faq}
          </div>
        </div>
      </section>

      <section class="section closing">
        <div class="wrap">
          <img class="closing-icon reveal" src="/assets/app-icon.svg" alt="" width="112" height="112">
          <h2 class="reveal">{e(t["closing_h2"])}</h2>
          <p class="section-lead reveal">{e(t["closing_lead"])}</p>
          <div class="ctas reveal">
            <a class="btn btn-primary" href="{e(DEPLOY)}">{icon("rocket")}{e(t["cta_deploy"])}</a>
            <a class="btn btn-secondary" href="{DEMO_PATHS[lang]}">{icon("player-play")}{e(t["cta_demo"])}</a>
          </div>
        </div>
      </section>

      <p class="creator">
        <img src="https://github.com/ethanfrq.png?size=88" alt="" width="44" height="44" loading="lazy">
        <span>{e(t["made_by"])} <a href="https://github.com/ethanfrq">Ethan</a></span>
      </p>
'''
    video_script = f'''    <script>
      (() => {{
        const figure = document.querySelector(".hero-video");
        const video = figure.querySelector("video");
        const toggle = figure.querySelector(".video-toggle");
        if (matchMedia("(max-width: 640px)").matches) {{
          video.poster = figure.dataset.verticalPoster;
          video.src = figure.dataset.vertical;
          figure.classList.add("is-vertical");
        }}
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) {{
          video.removeAttribute("autoplay");
          video.controls = true;
          toggle.hidden = true;
          return;
        }}
        let wanted = true;
        const label = () => {{
          const playing = !video.paused;
          toggle.setAttribute("aria-pressed", String(playing));
          toggle.classList.toggle("is-paused", !playing);
          toggle.querySelector("span").textContent = playing ? toggle.dataset.pause : toggle.dataset.play;
        }};
        toggle.addEventListener("click", () => {{
          wanted = video.paused;
          if (wanted) video.play();
          else video.pause();
        }});
        video.addEventListener("play", label);
        video.addEventListener("pause", label);
        new IntersectionObserver(([entry]) => {{
          if (!wanted) return;
          if (entry.isIntersecting) video.play().catch(() => {{}});
          else video.pause();
        }}, {{ threshold: 0.2 }}).observe(video);
      }})();
    </script>
'''
    return shell(
        t,
        urls=PAGE_URLS,
        other_href=t["other"][0],
        title=t["title"],
        description=t["description"],
        main=main,
        extra_head=f'    <script type="application/ld+json">{structured_data(t)}</script>\n',
        preload=f'    <link rel="preload" as="image" href="/assets/poster-{lang}.webp" type="image/webp">\n',
        scripts=video_script,
    )


def demo_page(t: dict) -> str:
    """/demo: the app's Today screen in a phone, driven by site/assets/demo.js, with a guided path beside it."""
    e = html.escape
    d = t["demo"]
    lang = t["lang"]
    review = f'<button class="btn btn-secondary btn-sm demo-review" type="button" data-demo-review>{e(d["review_cta"])}</button>'
    steps = "\n".join(
        f'''            <li class="demo-step" data-step="{i}">
              <span class="demo-step-mark" aria-hidden="true"><span>{i}</span>{icon("check", "icon demo-step-check")}</span>
              <div><h3>{e(title)}</h3><p>{e(text)}</p>{review if i == 4 else ""}</div>
            </li>'''
        for i, (title, text) in enumerate(d["steps"], start=1)
    )
    data = json.dumps(
        {"lang": lang, "t": d["app"], "icons": {name: icon(name) for name in DEMO_ICONS}}, ensure_ascii=False
    ).replace("</", "<\\/")
    main = f'''      <section class="demo">
        <div class="wrap demo-layout">
          <div class="demo-copy">
            <p class="eyebrow"><img class="eyebrow-icon" src="/assets/app-icon.svg" alt="" width="28" height="28"><span>{e(t["eyebrow"])}</span></p>
            <h1>{e(d["h1"])}</h1>
            <p class="lead">{e(d["lead"])}</p>
          </div>
          <div class="demo-guide">
            <h2 class="demo-steps-title">{e(d["steps_label"])}</h2>
            <ol class="demo-steps">
{steps}
            </ol>
          </div>
          <div class="demo-stage">
            <div class="demo-phone" data-demo role="region" aria-label="{e(d["phone_label"])}">
              <noscript><img class="demo-fallback" src="/assets/today-dark.webp" alt="{e(t["alt"]["today-dark"])}" width="540" height="1052"></noscript>
            </div>
            <p class="demo-note">{e(d["note"])}</p>
          </div>
        </div>
      </section>

      <section class="section closing">
        <div class="wrap">
          <img class="closing-icon" src="/assets/app-icon.svg" alt="" width="112" height="112">
          <h2>{e(d["outro_h2"])}</h2>
          <p class="section-lead">{e(d["outro_lead"])}</p>
          <div class="ctas">
            <a class="btn btn-primary" href="{e(DEPLOY)}">{icon("rocket")}{e(t["cta_deploy"])}</a>
            <a class="btn btn-secondary" href="{t["home"]}">{e(d["back"])}</a>
          </div>
        </div>
      </section>
'''
    scripts = f'''    <script id="demo-data" type="application/json">{data}</script>
    <script src="/assets/demo.js" defer></script>
'''
    return shell(
        t,
        urls=DEMO_URLS,
        other_href=DEMO_PATHS[t["other"][1]],
        title=d["title"],
        description=d["description"],
        main=main,
        anchor_base=t["home"],
        scripts=scripts,
    )


def versioned(page_html: str) -> str:
    """Adds ?v=<content hash> to every local asset URL, so a changed file gets a new URL.

    Lets site/vercel.json cache them for a year: returning visitors see new
    screenshots right after a deploy instead of a day later.
    """

    def stamp(match: re.Match) -> str:
        path = match.group(1)
        digest = hashlib.sha256((SITE / path.lstrip("/")).read_bytes()).hexdigest()[:8]
        return f"{path}?v={digest}"

    return re.sub(r'(?<=")(/assets/[\w.-]+|/styles\.css)(?=")', stamp, page_html)


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    for name in SHOTS + POSTERS:
        shutil.copy(ROOT / f"docs/readme/{name}.webp", ASSETS / f"{name}.webp")
    shutil.copy(ROOT / "public/brand/taskly-logo-graphite.svg", ASSETS / "logo-graphite.svg")
    shutil.copy(ROOT / "public/brand/taskly-logo-ivory.svg", ASSETS / "logo-ivory.svg")
    shutil.copy(ROOT / "src/app/icon.svg", ASSETS / "icon.svg")
    shutil.copy(ROOT / "public/brand/taskly-app-icon.svg", ASSETS / "app-icon.svg")
    shutil.copy(ROOT / "src/app/apple-icon.png", ASSETS / "apple-icon.png")
    for lang in PAGE_URLS:
        share_image(lang)

    (SITE / "index.html").write_text(versioned(page(EN)))
    (SITE / "fr").mkdir(exist_ok=True)
    (SITE / "fr/index.html").write_text(versioned(page(FR)))
    demos = []
    for t in (EN, FR):
        out = SITE / DEMO_PATHS[t["lang"]].lstrip("/") / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(versioned(demo_page(t)))
        demos.append(out)

    for path in [SITE / "index.html", SITE / "fr/index.html", *demos]:
        text = path.read_text()
        assert "—" not in text and "–" not in text, f"dash found in {path}"
        assert not re.search(r'"/(assets/[\w.-]+|styles\.css)"', text), f"unversioned asset URL in {path}"
    urls = ""
    for group in (PAGE_URLS, DEMO_URLS):
        alternates = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{lang}" href="{href}"/>' for lang, href in group.items())
        urls += "".join(f"\n  <url>\n    <loc>{href}</loc>{alternates}\n  </url>" for href in group.values())
    (SITE / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
        f"{urls}\n</urlset>\n"
    )
    (SITE / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n")
    print("site/ built:", ", ".join(sorted(p.name for p in ASSETS.iterdir())))


if __name__ == "__main__":
    main()
