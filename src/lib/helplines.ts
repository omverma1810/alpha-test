import type { CrisisCategory, Helpline, Region } from "./types";

/**
 * Checked on 18 Nov 2026 against:
 *  - UAE: u.ae "Handling emergencies" (Telecommunications and Digital Government Regulatory Authority)
 *  - India: Tele-MANAS page on jipmer.edu.in (14416). 112 and 1098 are the national emergency
 *    and Childline numbers; re-check them before any real launch.
 *  - Pakistan: UN Women Pakistan "Emergency contacts" page
 *
 * Wrong numbers here are the worst bug this app can have, so they live in one
 * file and nowhere else.
 */

type Book = Record<Exclude<CrisisCategory, "general"> | "general", Helpline[]>;

const UAE: Book = {
  emergency: [
    { label: "Ambulance", number: "998" },
    { label: "Police", number: "999" },
  ],
  abuse: [
    { label: "Police", number: "999" },
    { label: "Ministry of Interior child & women protection line", number: "116111" },
  ],
  self_harm: [
    { label: "Ambulance", number: "998" },
    { label: "Police", number: "999" },
  ],
  general: [
    { label: "Ambulance", number: "998" },
    { label: "Police", number: "999" },
  ],
};

const INDIA: Book = {
  emergency: [{ label: "Emergency (police, fire, ambulance)", number: "112" }],
  abuse: [
    { label: "Emergency", number: "112" },
    { label: "Childline", number: "1098" },
  ],
  self_harm: [
    { label: "Emergency", number: "112" },
    { label: "Tele-MANAS mental health line (24/7)", number: "14416" },
  ],
  general: [
    { label: "Emergency", number: "112" },
    { label: "Childline", number: "1098" },
  ],
};

const PAKISTAN: Book = {
  emergency: [
    { label: "Rescue / ambulance", number: "1122" },
    { label: "Edhi ambulance", number: "115" },
  ],
  abuse: [
    { label: "Police", number: "15" },
    { label: "Rescue", number: "1122" },
  ],
  self_harm: [
    { label: "Rescue / ambulance", number: "1122" },
    { label: "Rozan counselling line", number: "0800-22444", note: "Mon to Sat, 10am to 6pm" },
  ],
  general: [
    { label: "Rescue / ambulance", number: "1122" },
    { label: "Police", number: "15" },
  ],
};

const OTHER: Book = {
  emergency: [{ label: "Your local emergency number", number: "" }],
  abuse: [{ label: "Your local emergency number or child protection service", number: "" }],
  self_harm: [{ label: "Your local emergency number or a crisis line", number: "" }],
  general: [{ label: "Your local emergency number", number: "" }],
};

const BOOKS: Record<Region, Book> = { ae: UAE, in: INDIA, pk: PAKISTAN, other: OTHER };

export const REGIONS: { value: Region; label: string }[] = [
  { value: "ae", label: "UAE" },
  { value: "in", label: "India" },
  { value: "pk", label: "Pakistan" },
  { value: "other", label: "Somewhere else" },
];

export function helplinesFor(region: Region, category: CrisisCategory): Helpline[] {
  return BOOKS[region][category];
}
