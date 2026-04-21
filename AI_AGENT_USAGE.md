# AI Agent Usage – 4ga Boards QE Exercise

This doc shows how I used AI throughout this exercise and where it actually helped vs where I had to step in and make judgment calls myself.

---

## Phase 1 – Understanding the Project

I started by sharing the assignment with Claude and asking it to help me explore the 4ga Boards repo and identify which features made the most sense to test.

**Prompt I used:**

I have a QE take-home exercise using 4ga Boards — a kanban app running on Docker.
Help me identify the 2 most valuable features to write E2E tests for and explain why.


**What it gave me:**
- Suggested User Authentication and Board/Card Management
- Explained the reasoning — auth is the entry point, board/card is the core value

**My call:**
I agreed with both picks. Auth and board management cover the two most critical paths a real user would take. I didn't just accept the output — I manually opened the app, clicked around, and confirmed these were actually the right areas before moving forward.

---

## Phase 2 – Writing the Test Plan

Once I knew what to test, I used AI to help structure the test plan.

**Prompt I used:**Based on User Authentication and Board & Card Management in 4ga Boards,
help me write a test plan with test case IDs, steps, UI assertions, DB assertions,
and priority levels. The app runs on Docker at localhost:3000.

**What it gave me:**
- A full list of test cases for both features
- Suggested adding DB-level validation alongside UI checks
- Helped structure the pass/fail criteria

**My call:**
The DB validation idea came up here and I thought it was genuinely useful — not just for this assignment but because it reflects how I'd actually approach testing a real app. A UI can look correct even when the backend write failed. I kept that approach throughout.

---

## Phase 3 – Building the Playwright Tests

This is where AI saved the most time. Writing boilerplate POM classes and repetitive test structure is tedious — AI handled that while I focused on what actually needed thinking.

**Auth tests prompt:**
Write Playwright TypeScript tests for User Authentication in 4ga Boards.
Base URL: http://localhost:3000
Cover: registration, duplicate email, blank fields, login, wrong password, logout, unauthenticated redirect.
Use Page Object Model. Add DB assertions using the pg client after each UI action.

**Board tests prompt:**

Write Playwright TypeScript tests for Board & Card Management.
Cover: create board, add list, add card, open card modal, edit title, drag-and-drop move, delete card, persistence after reload.
Use a shared loginAsNewUser() helper. Use Date.now() in all names to avoid collisions.
Add DB assertions after each create/update/delete action.

**What it gave me:**
- Full POM classes for LoginPage, RegistrationPage, BoardPage
- db.ts with direct Postgres helper functions
- All test cases structured with UI + DB assertions

**My call:**
The selectors were written without seeing the live DOM so I knew going in they'd need adjusting once the app was running. That's expected — AI can't inspect a live browser. The structure and logic were solid though, and that's the harder part to get right.

---

## Phase 4 – Debugging & Fixing

When tests failed, I used AI to fix selectors and adjust assertions based on what the actual app DOM looked like.

**Example prompt:**
The logout button isn't being found. The actual element in the DOM is inside
a dropdown with class "userDropdown" and the button text is "Log out" not "Logout".
Fix the logout() method in pages.ts.

**What it gave me:**
- Updated selector targeting the correct class and text
- Suggested adding a waitForSelector before clicking to handle animation delays

**My call:**
This back-and-forth is where knowing the app matters. AI can fix a selector once you tell it what the DOM actually looks like — but you have to be the one inspecting it and describing what's there accurately.

---

## Honest Summary

| Phase | Where AI helped | Where I had to think |
|---|---|---|
| Feature selection | Gave good starting suggestions | I verified by actually using the app |
| Test plan | Structured it quickly | I decided on DB validation approach |
| Test code | Wrote all the boilerplate fast | I reviewed every assertion for accuracy |
| Debugging | Fixed selectors from my descriptions | I did the DOM inspection myself |

AI made this faster. But the decisions about what to test, why those things matter, and whether the output actually makes sense — that was all me. The exercise is about QE thinking, and that part can't be delegated.
