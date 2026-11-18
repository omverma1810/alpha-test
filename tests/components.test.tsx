// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import Chat from "@/components/Chat";
import EscalationCard from "@/components/EscalationCard";
import PlanCard from "@/components/PlanCard";
import { buildEscalation } from "@/lib/escalation";
import type { CoachReply, PlanReply } from "@/lib/types";

const planReply: PlanReply = {
  kind: "plan",
  language: "en",
  risk: "none",
  summary: "Bedtime is turning into a battle.",
  steps: ["Start a wind-down at the same time.", "Offer two choices."],
  checkIn: { question: "How many calm nights?", when: "in 5 days" },
};

function respondWith(...replies: Array<{ ok?: boolean; body: unknown } | Error>) {
  const fn = vi.fn();
  for (const r of replies) {
    if (r instanceof Error) fn.mockRejectedValueOnce(r);
    else fn.mockResolvedValueOnce({ ok: r.ok ?? true, json: async () => r.body });
  }
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("Chat", () => {
  it("shows the welcome and example worries in all three scripts", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: /what's happening with your child/i })).toBeInTheDocument();
    const examples = within(screen.getByRole("list", { name: /example worries/i })).getAllByRole("button");
    expect(examples).toHaveLength(5);
    expect(examples[2]).toHaveClass("urdu");
    expect(examples[4]).toHaveClass("arabic");
  });

  it("sends a typed message with Enter and shows the plan with its check-in", async () => {
    const fetchMock = respondWith({ body: { reply: planReply } });
    const user = userEvent.setup();
    render(<Chat />);

    await user.type(screen.getByLabelText("Your message"), "My son won't sleep{Enter}");

    expect(await screen.findByText("Bedtime is turning into a battle.")).toBeInTheDocument();
    expect(screen.getByText("My son won't sleep")).toBeInTheDocument();
    expect(screen.getByText("Offer two choices.")).toBeInTheDocument();
    expect(screen.getByText("In 5 days")).toBeInTheDocument();
    expect(screen.getByText("How many calm nights?")).toBeInTheDocument();

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({ message: "My son won't sleep", history: [], region: "ae" });
    expect(screen.getByLabelText("Your message")).toHaveValue("");
  });

  it("sends earlier turns as history, and the chosen helpline country", async () => {
    const escalation = buildEscalation("abuse", "en", "in", "precheck");
    const fetchMock = respondWith({ body: { reply: planReply } }, { body: { reply: escalation } }, { body: { reply: planReply } });
    const user = userEvent.setup();
    render(<Chat />);

    await user.selectOptions(screen.getByLabelText(/country for helpline/i), "in");
    await user.click(screen.getByRole("button", { name: /meltdown every night/i }));
    await screen.findByText("Bedtime is turning into a battle.");
    await user.type(screen.getByLabelText("Your message"), "My husband hits our son{Enter}");
    await screen.findByRole("alert");
    await user.type(screen.getByLabelText("Your message"), "Thanks{Enter}");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));

    const second = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(second.region).toBe("in");
    expect(second.history).toEqual([
      { role: "parent", text: "My 3-year-old has a meltdown every night at bedtime." },
      {
        role: "coach",
        text: "Bedtime is turning into a battle.\nStart a wind-down at the same time.\nOffer two choices.\nCheck-in: How many calm nights? (in 5 days)",
      },
    ]);
    const third = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(third.history[3].text).toContain(escalation.title);
  });

  it("shows the server's error message", async () => {
    respondWith({ ok: false, body: { error: "Too many messages in a short time." } });
    const user = userEvent.setup();
    render(<Chat />);
    await user.type(screen.getByLabelText("Your message"), "hi{Enter}");
    expect(await screen.findByText("Too many messages in a short time.")).toBeInTheDocument();
  });

  it("falls back to a generic error when the response has no message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => Promise.reject(new Error("x")) }));
    const user = userEvent.setup();
    render(<Chat />);
    await user.type(screen.getByLabelText("Your message"), "hi{Enter}");
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("handles a network failure", async () => {
    respondWith(new Error("Failed to fetch"));
    const user = userEvent.setup();
    render(<Chat />);
    await user.type(screen.getByLabelText("Your message"), "hi{Enter}");
    expect(await screen.findByText("Failed to fetch")).toBeInTheDocument();
  });

  it("handles a thrown non-Error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue("offline"));
    const user = userEvent.setup();
    render(<Chat />);
    await user.type(screen.getByLabelText("Your message"), "hi{Enter}");
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("keeps Shift+Enter for a new line, ignores blank messages and blocks double sends", async () => {
    let resolve: (v: unknown) => void = () => {};
    const fetchMock = vi.fn(() => new Promise((r) => (resolve = r)));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<Chat />);
    const box = screen.getByLabelText("Your message");

    await user.type(box, "   {Enter}");
    expect(fetchMock).not.toHaveBeenCalled();

    await user.clear(box);
    await user.type(box, "line one{Shift>}{Enter}{/Shift}line two");
    expect(box).toHaveValue("line one\nline two");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText("Reading what you wrote")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

    await user.type(box, "again{Enter}");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolve({ ok: true, json: async () => ({ reply: planReply }) });
    expect(await screen.findByText("Bedtime is turning into a battle.")).toBeInTheDocument();
  });

  it("renders Urdu and Arabic messages right-to-left in their own fonts", async () => {
    respondWith({ body: { reply: { ...planReply, language: "ur" } } }, { body: { reply: { ...planReply, language: "ar" } } });
    const user = userEvent.setup();
    render(<Chat />);
    await user.type(screen.getByLabelText("Your message"), "میرا بیٹا{Enter}");
    expect(await screen.findByText("میرا بیٹا")).toHaveClass("urdu");
    await user.type(screen.getByLabelText("Your message"), "ابني{Enter}");
    expect(await screen.findByText("ابني")).toHaveClass("arabic");
    const cards = await screen.findAllByRole("article");
    expect(cards[0]).toHaveAttribute("dir", "rtl");
    expect(cards[1]).toHaveClass("arabic");
  });
});

describe("PlanCard", () => {
  it("flags a see-a-professional reply", () => {
    render(<PlanCard reply={{ ...planReply, risk: "see_professional" }} />);
    expect(screen.getByText("Worth asking a professional too")).toBeInTheDocument();
  });

  it("uses Roman Urdu labels and left-to-right layout", () => {
    render(<PlanCard reply={{ ...planReply, language: "roman_ur", risk: "see_professional" }} />);
    expect(screen.getByRole("article")).toHaveAttribute("dir", "ltr");
    expect(screen.getByRole("article")).toHaveAttribute("lang", "ur-Latn");
    expect(screen.getByText("Kisi mahir se poochna behtar hai")).toBeInTheDocument();
  });
});

describe("EscalationCard", () => {
  const render2 = (reply: CoachReply & { kind: "escalation" }) => render(<EscalationCard reply={reply} />);

  it("shows tap-to-call buttons for each number", () => {
    render2(buildEscalation("emergency", "en", "ae", "precheck"));
    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["tel:998", "tel:999"]);
  });

  it("strips formatting from numbers and shows opening hours", () => {
    render2(buildEscalation("self_harm", "en", "pk", "precheck"));
    expect(screen.getByRole("link", { name: /0800-22444/ })).toHaveAttribute("href", "tel:080022444");
    expect(screen.getByText(/Mon to Sat/)).toBeInTheDocument();
  });

  it("tells people elsewhere to call their local number", () => {
    render2(buildEscalation("general", "en", "other", "model"));
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(/Call: Your local emergency number/)).toBeInTheDocument();
  });

  it.each([
    ["ur", "urdu", "rtl"],
    ["ar", "arabic", "rtl"],
    ["roman_ur", "", "ltr"],
  ] as const)("lays out %s correctly", (language, font, dir) => {
    render2(buildEscalation("abuse", language, "ae", "precheck"));
    const card = screen.getByRole("alert");
    expect(card).toHaveAttribute("dir", dir);
    if (font) expect(card).toHaveClass(font);
  });
});
