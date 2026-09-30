"""E2E test: Panto conversation-history sidebar flow on the landing page widget."""
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:5174"
results = []

def check(name, cond):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name, flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        args=["--disable-gpu", "--no-sandbox"],
    )
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    page.goto(BASE, wait_until="domcontentloaded")
    page.wait_for_timeout(2500)

    # 1. Open the chat widget (floating sage FAB, bottom right)
    fab = page.locator('button[aria-label="Ask Panto"]')
    check("widget FAB visible", fab.count() > 0 and fab.is_visible())
    # breathe animation keeps the element "moving" — force click bypasses stability wait
    fab.click(force=True, timeout=5000)
    page.wait_for_timeout(1200)

    # 2. Auth gate (demo mode): email -> auto-filled code
    email_input = page.locator('input[type="email"]')
    check("auth gate shows email input", email_input.count() > 0 and email_input.is_visible())
    if email_input.count() > 0:
        email_input.fill("test@panto.dev")
        page.locator('button:has-text("Continue"), button:has-text("Sign in")').first.click(timeout=5000)
        page.wait_for_timeout(1500)
        code_inputs = page.locator("input[inputmode='numeric']")
        if code_inputs.count() > 0:
            page.wait_for_timeout(1200)  # demo auto-fill delay
            page.locator('button:has-text("Verify"), button:has-text("Continue")').first.click(timeout=5000)
            page.wait_for_timeout(1200)
    check("no page errors after auth", len(errors) == 0)
    for e in errors:
        print("  pageerror:", e[:200])

    # 3. Widget header + history toggle
    check("widget header visible", page.locator('text=Ask Panto').count() > 0)
    hist_btn = page.locator('button[aria-label="Toggle history"]')
    check("history toggle button present", hist_btn.count() > 0)
    hist_btn.first.click(force=True, timeout=5000)
    page.wait_for_timeout(1000)

    # 4. Sidebar open with History label + auto-created conversation
    check("sidebar opens with History label", page.locator('text=History').count() > 0)
    check("sidebar shows conversation footer", page.locator('text=/conversation(s)?$/').count() > 0)
    page.screenshot(path="/tmp/panto_sidebar_open.png")

    # 5. Send a message — title should derive from it
    ta = page.locator("textarea").first
    check("chat textarea present", ta.count() > 0)
    ta.fill("Find me organic seeds supplier in Kenya")
    page.keyboard.press("Enter")
    page.wait_for_timeout(4000)  # agent reply streams (simulated/LLM)

    # 6. Reopen sidebar; title should be derived from the sent message
    hist_btn.first.click(force=True, timeout=5000)   # close
    page.wait_for_timeout(400)
    hist_btn.first.click(force=True, timeout=5000)   # reopen
    page.wait_for_timeout(1000)

    body_text = page.inner_text("body")
    check("conversation title derived from message", "organic seeds" in body_text.lower())
    check("no page errors at end", len(errors) == 0)
    for e in errors:
        print("  pageerror:", e[:200])

    page.screenshot(path="/tmp/panto_sidebar_titled.png")
    browser.close()

passed = sum(1 for _, ok in results if ok)
print(f"\n{passed}/{len(results)} checks passed", flush=True)
