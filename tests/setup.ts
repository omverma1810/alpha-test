import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  if (typeof window !== "undefined") cleanup();
});

// jsdom doesn't implement scrollIntoView, which the chat uses to follow new messages.
if (typeof window !== "undefined") {
  Element.prototype.scrollIntoView = () => {};
}
