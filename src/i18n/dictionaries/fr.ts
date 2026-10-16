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
  auth: {
    signInTitle: "Connexion",
    signInSubtitle: "Pas de mot de passe. Face ID suffit, ou un code reçu par email.",
    continueWithFaceId: "Continuer avec Face ID",
    continueWithTouchId: "Continuer avec Touch ID",
    continueWithPasskey: "Continuer avec une clé d'identification",
    or: "ou",
    emailLabel: "Email",
    emailPlaceholder: "toi@exemple.com",
    sendCode: "Recevoir un code",
    codeTitle: "Vérifie tes emails",
    codeSubtitle: "Code à 6 chiffres envoyé à {email}",
    codeLabel: "Code à 6 chiffres",
    verify: "Valider",
    resendCode: "Renvoyer le code",
    codeResent: "Nouveau code envoyé",
    changeEmail: "Changer d'email",
    passkeyOfferTitle: "Activer {method} ?",
    passkeyOfferBody: "La prochaine fois, tu te connecteras en un geste, sans code. Utile aussi quand Claude te demande d'autoriser Taskly.",
    passkeyGeneric: "la clé d'identification",
    passkeyOfferAccept: "Activer",
    signOut: "Se déconnecter",
    signIn: "Se connecter",
    signedInAs: "Connecté : {email}",
    legal: "En continuant, tu acceptes les conditions d'utilisation et la politique de confidentialité.",
    errors: {
      invalidEmail: "Entre une adresse email valide.",
      invalidCode: "Ce code n'est pas le bon. Vérifie-le ou demande-en un nouveau.",
      expiredCode: "Ce code a expiré. Demande-en un nouveau.",
      tooManyAttempts: "Trop d'essais. Demande un nouveau code.",
      passkeyCancelled: "Connexion annulée.",
      passkeyFailed: "La clé d'identification n'a pas fonctionné. Utilise un code par email.",
      generic: "Quelque chose n'a pas marché. Réessaie.",
    },
  },
  home: {
    status: "En construction · v0.1 en cours",
    viewPrototype: "Voir le prototype",
    sourceCode: "Code source sur GitHub",
  },
};

export type Dictionary = typeof fr;
