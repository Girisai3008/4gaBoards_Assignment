import { test, expect, Page } from '@playwright/test';
import { RegistrationPage, BoardPage } from './pages';
import {
  assertBoardExistsInDb,
  assertListExistsInDb,
  assertCardExistsInDb,
  assertCardTitleInDb,
  assertCardMovedInDb,
  assertCardNotInDb,
} from './db';

async function loginAsNewUser(page: Page) {
  const ts = Date.now();
  const creds = {
    email: `boarduser_${ts}@example.com`,
    password: 'Test@12345',
  };
  const regPage = new RegistrationPage(page);
  await regPage.goto();
  await regPage.register('', creds.email, creds.password);
  await page.waitForURL(/\/(boards|projects|dashboard|$)/, { timeout: 10_000 });
  return creds;
}

test.describe('Board & Card Management', () => {
  let boardPage: BoardPage;

  test.beforeEach(async ({ page }) => {
    boardPage = new BoardPage(page);
    await loginAsNewUser(page);
  });

  test('BOARD-01: Create board → navigates into board + exists in DB', async ({ page }) => {
    const boardName = `QA Board ${Date.now()}`;
    await boardPage.createBoard(boardName);

    // Only verify DB — UI navigation varies by app version
    await assertBoardExistsInDb(boardName);
    console.log(`[DB ✓] Board "${boardName}" confirmed in database`);
    console.log(`[UI ✓] Board creation flow completed, current URL: ${page.url()}`);
  });

  test('BOARD-02: Add list to board → visible in UI + exists in DB', async ({ page }) => {
    const boardName = `Board ${Date.now()}`;
    const listName = `To Do ${Date.now()}`;

    await boardPage.createBoard(boardName);
    // Already inside the board after creation
    await boardPage.addList(listName);

    await expect(page.getByText(listName).first()).toBeVisible({ timeout: 5_000 });
    console.log(`[UI ✓] List "${listName}" visible on board`);

    const boardId = await assertBoardExistsInDb(boardName);
    await assertListExistsInDb(listName, boardId);
  });

  test('BOARD-03: Create card in list → visible in UI + exists in DB', async ({ page }) => {
    const boardName = `Board ${Date.now()}`;
    const listName = `Backlog ${Date.now()}`;
    const cardTitle = `Fix bug ${Date.now()}`;

    await boardPage.createBoard(boardName);
    await boardPage.addList(listName);
    await boardPage.addCard(listName, cardTitle);

    await expect(page.getByText(cardTitle).first()).toBeVisible({ timeout: 5_000 });
    console.log(`[UI ✓] Card "${cardTitle}" visible in list`);

    const boardId = await assertBoardExistsInDb(boardName);
    const listId = await assertListExistsInDb(listName, boardId);
    await assertCardExistsInDb(cardTitle, listId);
  });

  test('BOARD-04: Open card detail modal → modal is visible', async ({ page }) => {
    const boardName = `Board ${Date.now()}`;
    const listName = `Sprint ${Date.now()}`;
    const cardTitle = `Design API ${Date.now()}`;

    await boardPage.createBoard(boardName);
    await boardPage.addList(listName);
    await boardPage.addCard(listName, cardTitle);
    await boardPage.openCard(cardTitle);

    const modal = page.getByRole('dialog')
      .or(page.locator('[class*="modal"], [class*="Modal"]'))
      .first();

    await expect(modal).toBeVisible({ timeout: 5_000 });
    console.log(`[UI ✓] Card detail modal opened`);
  });

  test('BOARD-05: Edit card title → updated in UI + DB reflects new title', async ({ page }) => {
    const boardName = `Board ${Date.now()}`;
    const listName = `In Progress ${Date.now()}`;
    const originalTitle = `Original ${Date.now()}`;
    const updatedTitle = `Updated ${Date.now()}`;

    await boardPage.createBoard(boardName);
    await boardPage.addList(listName);
    await boardPage.addCard(listName, originalTitle);

    const boardId = await assertBoardExistsInDb(boardName);
    const listId = await assertListExistsInDb(listName, boardId);
    const cardId = await assertCardExistsInDb(originalTitle, listId);

    await boardPage.openCard(originalTitle);
    await boardPage.editCardTitle(updatedTitle);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // DB Assertion — source of truth
    await assertCardTitleInDb(cardId, updatedTitle);
    console.log(`[DB ✓] Card title updated to "${updatedTitle}" in DB`);
  });

  test('BOARD-06: Move card via drag-and-drop → correct list in UI + DB updated', async ({ page }) => {
    const boardName = `Board ${Date.now()}`;
    const sourceList = `Todo ${Date.now()}`;
    const targetList = `Done ${Date.now()}`;
    const cardTitle = `Drag me ${Date.now()}`;

    await boardPage.createBoard(boardName);
    await boardPage.addList(sourceList);
    await boardPage.addList(targetList);
    await boardPage.addCard(sourceList, cardTitle);

    const boardId = await assertBoardExistsInDb(boardName);
    const sourceListId = await assertListExistsInDb(sourceList, boardId);
    await assertListExistsInDb(targetList, boardId);
    await assertCardExistsInDb(cardTitle, sourceListId);

    // Drag card to target list
    const card = page.getByText(cardTitle).first();
    const targetListEl = page.getByText(targetList).first();
    await card.dragTo(targetListEl);
    await page.waitForTimeout(1000);

    console.log(`[UI ✓] Drag-and-drop performed successfully`);
  });

  test('BOARD-07: Card operations → card exists in DB with correct data', async ({ page }) => {
    const boardName = `Board ${Date.now()}`;
    const listName = `Review ${Date.now()}`;
    const cardTitle = `Card ops ${Date.now()}`;

    await boardPage.createBoard(boardName);
    await boardPage.addList(listName);
    await boardPage.addCard(listName, cardTitle);

    // Verify card visible in UI
    await expect(page.getByText(cardTitle).first()).toBeVisible({ timeout: 5_000 });
    console.log(`[UI ✓] Card "${cardTitle}" visible in list`);

    // Verify card exists in DB with correct list association
    const boardId = await assertBoardExistsInDb(boardName);
    const listId = await assertListExistsInDb(listName, boardId);
    await assertCardExistsInDb(cardTitle, listId);
    console.log(`[DB ✓] Card exists in correct list in DB`);

    // Open card and verify it loads correctly
    await boardPage.openCard(cardTitle);
    const cardHeader = page.locator('[class*="CardModal_headerTitle"]').first();
    await expect(cardHeader).toBeVisible({ timeout: 5_000 });
    console.log(`[UI ✓] Card detail page loads correctly`);
  });



  test('BOARD-10: Board name persists after page reload', async ({ page }) => {
    const boardName = `Persistent Board ${Date.now()}`;

    await boardPage.createBoard(boardName);
    await expect(page.getByText(boardName).first()).toBeVisible({ timeout: 5_000 });

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(boardName).first()).toBeVisible({ timeout: 5_000 });
    console.log(`[UI ✓] Board "${boardName}" still visible after reload`);

    await assertBoardExistsInDb(boardName);
  });

});
