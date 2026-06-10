import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { LandingScreen } from "@/components/LandingScreen";

function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, "userAgent", { value: ua, configurable: true });
}

afterEach(cleanup);

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const WINDOWS_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

describe("LandingScreen iOS Shortcut link", () => {
  it("shows the one-tap iCloud Shortcut link on iOS", () => {
    setUserAgent(IPHONE_UA);
    render(<LandingScreen onFile={() => undefined} />);
    const link = screen.getByRole("link", { name: /shortcut/i });
    expect(link.getAttribute("href")).toContain("icloud.com/shortcuts");
  });

  it("does not show the Shortcut link on non-iOS", () => {
    setUserAgent(WINDOWS_UA);
    render(<LandingScreen onFile={() => undefined} />);
    expect(screen.queryByRole("link", { name: /shortcut/i })).toBeNull();
  });

  it("shows the Install button after a beforeinstallprompt event", () => {
    setUserAgent(WINDOWS_UA);
    render(<LandingScreen onFile={() => undefined} />);
    expect(screen.queryByRole("button", { name: /install/i })).toBeNull();

    act(() => {
      const e = new Event("beforeinstallprompt");
      window.dispatchEvent(e);
    });

    expect(screen.getByRole("button", { name: /install/i })).toBeTruthy();
  });
});
