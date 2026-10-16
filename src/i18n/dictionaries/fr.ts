/**
 * French strings, the reference dictionary: English must have the same keys.
 * Placeholders use {name}; plural forms are { one, other } objects.
 */
export const fr = {
  meta: {
    description: "Ta journée, triée par Claude. La todo list du jour open source, avec de vrais rappels.",
  },
  common: {
    tagline: "Ta journée, triée par Claude.",
    continue: "Continuer",
    cancel: "Annuler",
    save: "Enregistrer",
    later: "Plus tard",
    back: "Retour",
    loading: "Chargement…",
    language: "Langue",
  },
  home: {
    status: "En construction · v0.1 en cours",
    viewPrototype: "Voir le prototype",
    sourceCode: "Code source sur GitHub",
  },
};

export type Dictionary = typeof fr;
