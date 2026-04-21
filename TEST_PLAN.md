# Test Plan – 4ga Boards

**Author:** Giri Sai Chaitanya Bheemisetty
**Date:** April 16, 2026
**Framework:** Playwright (TypeScript) + Postgres DB validation
**App URL:** http://localhost:3000
**Setup:** Docker (docker-compose)

---

## Why These Two Features?

I explored the app and picked two areas that cover the most critical user journeys:

1. **User Authentication** — if login/registration breaks, nothing else matters. Every user hits this first.
2. **Board & Card Management** — this is literally what the app does. Creating boards, adding cards, moving them around. If this breaks, the app has no value.

I also added direct DB validation on top of UI checks because the UI can look correct even when data didn't actually save. Wanted to make sure both layers are solid.

---

## Feature 1 – User Authentication

These are the scenarios I identified as worth covering:

| TC ID | What I'm Testing | UI Check | DB Check | Priority |
|---|---|---|---|---|
| AUTH-01 | Register with valid details | Lands on dashboard | User row exists in DB | High |
| AUTH-02 | Register with an email already in use | Error message shows | No duplicate created | High |
| AUTH-03 | Submit registration form empty | Validation fires | N/A | Medium |
| AUTH-04 | Login with correct credentials | Lands on dashboard | N/A | High |
| AUTH-05 | Login with wrong password | Error message shows | N/A | High |
| AUTH-06 | Login with email that doesn't exist | Error message shows | N/A | Medium |
| AUTH-07 | Logout | Redirected to /login, session gone | N/A | High |
| AUTH-08 | Try to access app without being logged in | Redirected to /login | N/A | Medium |

---

## Feature 2 – Board & Card Management

| TC ID | What I'm Testing | UI Check | DB Check | Priority |
|---|---|---|---|---|
| BOARD-01 | Create a new board | Board shows on dashboard | Row in projects table | High |
| BOARD-02 | Add a list inside a board | List column appears | Row in lists table | High |
| BOARD-03 | Add a card to a list | Card shows under list | Row in cards table | High |
| BOARD-04 | Click on a card to open it | Modal opens | N/A | Medium |
| BOARD-05 | Edit a card's title | Updated title shows immediately, no reload needed | cards.name updated | Medium |
| BOARD-06 | Drag a card to another list | Card shows in new list | cards.list_id updated | High |
| BOARD-07 | Delete a card | Card disappears | Row gone from DB | Medium |
| BOARD-10 | Reload the page after creating a board | Board still there | Still in DB | Medium |

---

## How I'm Validating

Every test does two things — checks the UI and then checks the database directly:
```
User does something in UI
        ↓
Playwright checks what's visible on screen
        ↓
pg client queries Postgres directly
        ↓
Both must pass for the test to be green
```


The reason I added DB checks is straightforward — a UI can show something optimistically even if the backend write failed. I wanted to catch that kind of bug, not just surface-level rendering issues.

---

## Test Data Approach

- Every board, card, and user name has `Date.now()` in it so tests never collide with each other
- Each test registers its own fresh user — no shared state between tests
- DB credentials are pulled from env vars, falling back to the docker-compose defaults

---

## Observability

Each step logs what it's doing so CI output is actually readable:
```
[UI ✓] Board "QA Board 1713300000" visible on dashboard
[DB ✓] Board found in DB: "QA Board 1713300000" (id: 42)
[DB ✓] Card correctly moved in DB to list_id: 17
```

---

## What I'm Not Testing

- SSO/OAuth flows
- Email notifications
- Mobile viewports
- Performance or load
- Admin panel features

Keeping scope tight and focused on the core user workflows for now.

---

## Pass/Fail Bar

| What | Target |
|---|---|
| Overall pass rate | 90%+ |
| High priority tests | Must be 100% |
| Full suite runtime | Under 4 minutes |
| DB assertions | All must pass — UI pass alone isn't enough |
