import { describe, expect, it } from "vitest";
import { parseTask } from "./parse";

// Friday 16 October 2026
const today = "2026-10-16";
const fr = (text: string, lists?: string[]) => parseTask(text, { today, lists, dayFirst: true });
const en = (text: string, lists?: string[]) => parseTask(text, { today, lists, dayFirst: false });

describe("French", () => {
  it("reads the example from the prototype", () => {
    expect(fr("Appeler Paul demain 14h")).toEqual({
      title: "Appeler Paul",
      dueDate: "2026-10-17",
      dueTime: "14:00",
      priority: 0,
      tags: [],
    });
  });

  it("reads relative days", () => {
    expect(fr("Payer le loyer aujourd'hui").dueDate).toBe(today);
    expect(fr("Payer le loyer après-demain").dueDate).toBe("2026-10-18");
    expect(fr("Relancer dans 3 jours").dueDate).toBe("2026-10-19");
    expect(fr("Relancer dans une semaine").dueDate).toBe("2026-10-23");
    expect(fr("Bilan la semaine prochaine").dueDate).toBe("2026-10-19");
  });

  it("reads weekdays as the next one", () => {
    expect(fr("Réunion lundi").dueDate).toBe("2026-10-19");
    expect(fr("Réunion vendredi prochain").dueDate).toBe("2026-10-23");
  });

  it("reads dates", () => {
    expect(fr("Dentiste le 15 novembre à 9h30")).toMatchObject({ title: "Dentiste", dueDate: "2026-11-15", dueTime: "09:30" });
    expect(fr("Impôts 15/05")).toMatchObject({ dueDate: "2027-05-15" });
    expect(fr("Facture le 20")).toMatchObject({ title: "Facture", dueDate: "2026-10-20" });
    expect(fr("Facture le 3")).toMatchObject({ dueDate: "2026-11-03" });
  });

  it("reads times", () => {
    expect(fr("Déjeuner à midi").dueTime).toBe("12:00");
    expect(fr("Appel 9h").dueTime).toBe("09:00");
    expect(fr("Appel vers 17:45").dueTime).toBe("17:45");
    expect(fr("Appel 9h").dueDate).toBe(today);
    expect(fr("Sortir le chien ce soir")).toMatchObject({ title: "Sortir le chien", dueDate: today, dueTime: "19:00" });
  });

  it("reads tags, lists and priority", () => {
    expect(fr("Valider la PR #dev #urgent !! @Travail", ["Travail", "Perso"])).toEqual({
      title: "Valider la PR",
      priority: 2,
      tags: ["dev", "urgent"],
      listName: "Travail",
    });
  });

  it("keeps an unknown @list in the title", () => {
    expect(fr("Écrire à @marie", ["Travail"]).title).toBe("Écrire à @marie");
  });

  it("reads recurrences", () => {
    expect(fr("Sport tous les lundis")).toMatchObject({ title: "Sport", recurrence: "weekly:1", dueDate: "2026-10-19" });
    expect(fr("Vitamines tous les jours")).toMatchObject({ title: "Vitamines", recurrence: "daily" });
    expect(fr("Standup en semaine à 9h30")).toMatchObject({ title: "Standup", recurrence: "weekdays", dueTime: "09:30" });
    expect(fr("Loyer tous les mois le 5")).toMatchObject({ title: "Loyer", recurrence: "monthly", dueDate: "2026-11-05" });
  });

  it("does not eat words that merely contain a keyword", () => {
    expect(fr("Acheter un demain-matin").title).toBe("Acheter un demain-matin");
    expect(fr("Préparer la mission").title).toBe("Préparer la mission");
    expect(fr("Lundi.com refonte").title).toBe("Lundi.com refonte");
  });
});

describe("English", () => {
  it("reads common phrases", () => {
    expect(en("Call Paul tomorrow at 2pm")).toMatchObject({ title: "Call Paul", dueDate: "2026-10-17", dueTime: "14:00" });
    expect(en("Lunch at noon").dueTime).toBe("12:00");
    expect(en("Ship it next monday")).toMatchObject({ title: "Ship it", dueDate: "2026-10-19" });
    expect(en("Review in 2 weeks").dueDate).toBe("2026-10-30");
    expect(en("Dentist on November 15th 9:30am")).toMatchObject({ title: "Dentist", dueDate: "2026-11-15", dueTime: "09:30" });
    expect(en("Taxes 5/15")).toMatchObject({ dueDate: "2027-05-15" });
  });

  it("reads recurrences", () => {
    expect(en("Gym every monday")).toMatchObject({ title: "Gym", recurrence: "weekly:1" });
    expect(en("Water plants daily")).toMatchObject({ title: "Water plants", recurrence: "daily" });
  });

  it("leaves plain text alone", () => {
    expect(en("Buy milk")).toEqual({ title: "Buy milk", priority: 0, tags: [] });
  });
});
