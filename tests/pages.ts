import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input').nth(0);
    this.passwordInput = page.locator('input[type="password"]').first();
    this.submitButton = page.locator('button[type="submit"]')
      .or(page.getByRole('button', { name: /log in|login|sign in|submit/i }))
      .first();
    this.errorAlert = page.getByRole('alert')
      .or(page.locator('.error, [class*="error"], [class*="Error"]'))
      .first();
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
  }

  async login(email: string, password: string) {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
    await this.emailInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

export class RegistrationPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly termsCheckbox: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"], input[type="email"]').first();
    this.passwordInput = page.locator('input[type="password"]').first();
    this.submitButton = page.getByRole('button', { name: /register/i }).first();
    this.termsCheckbox = page.locator('input[type="checkbox"]').first();
    this.errorAlert = page.getByRole('alert')
      .or(page.locator('.error, [class*="error"]'))
      .first();
  }

  async goto() {
    await this.page.goto('/register');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
  }

  async register(username: string, email: string, password: string) {
    await this.emailInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.termsCheckbox.check();
    await this.submitButton.click();
  }
}

export class BoardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async createBoard(name: string) {
    const addBoardBtn = this.page.getByText('+ Add Board')
      .or(this.page.locator('button[title="Add Board"]'))
      .first();
    await addBoardBtn.click();
    await this.page.waitForTimeout(500);

    const nameInput = this.page.locator('input[name="name"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 5_000 });
    await nameInput.fill(name);

    // Click Project dropdown
    const projectDropdown = this.page.locator('[class*="DropdownList"], [class*="dropdown"], [class*="Dropdown"]')
      .nth(0);
    await projectDropdown.click();
    await this.page.waitForTimeout(300);

    // Select first project option
    const firstOption = this.page.locator('[class*="dropdownItem"], [class*="DropdownItem"], [class*="option"], [class*="Option"]')
      .first();
    await firstOption.click();
    await this.page.waitForTimeout(300);

    // Click Add Board button
    const confirmBtn = this.page.getByRole('button', { name: /add/i }).last();
    await confirmBtn.click();
    await this.page.waitForTimeout(2000);
  }

  async openBoard(name: string) {
    await this.page.getByText(name).first().click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
  }

  async addList(listName: string) {
    // Press Escape to close any open inputs first
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);

    const addListBtn = this.page.getByRole('button', { name: /add list/i })
      .or(this.page.getByText('Add list'))
      .first();
    await addListBtn.click();
    await this.page.waitForTimeout(500);

    await this.page.keyboard.type(listName);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  async addCard(listName: string, cardTitle: string) {
    const listEl = this.page.locator('[class*="list"], [class*="List"]')
      .filter({ hasText: listName })
      .first();

    const addCardBtn = listEl.getByText('+ Add Card')
      .or(listEl.getByRole('button', { name: /add card/i }))
      .first();
    await addCardBtn.click();
    await this.page.waitForTimeout(500);

    // Type directly
    await this.page.keyboard.type(cardTitle);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }

  async openCard(cardTitle: string) {
    await this.page.getByText(cardTitle).first().click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  async editCardTitle(newTitle: string) {
    // Click the title to activate it
    const titleDiv = this.page.locator('[class*="CardModal_headerTitle"]').first();
    await titleDiv.click();
    await this.page.waitForTimeout(500);

    // Use keyboard to select all and replace — no direct textarea interaction
    await this.page.keyboard.press('Control+a');
    await this.page.waitForTimeout(200);
    await this.page.keyboard.type(newTitle);
    await this.page.keyboard.press('Control+Enter');
    await this.page.waitForTimeout(1000);
  }

  async deleteCard() {
    // Click the 3-dot menu or delete button on card page
    const menuBtn = this.page.locator('[class*="CardModal"] [class*="moreButton"], [class*="CardModal"] [class*="MoreButton"]')
      .or(this.page.locator('[title="More actions"], [title="Delete Card"], [aria-label="Delete"]'))
      .or(this.page.getByRole('button', { name: /more|actions|⋮|\.\.\./i }))
      .first();

    if (await menuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await menuBtn.click();
      await this.page.waitForTimeout(300);
    }

    const deleteBtn = this.page.getByRole('button', { name: /delete card|delete/i })
      .or(this.page.getByText(/delete card|delete/i))
      .first();
    await deleteBtn.click();
    await this.page.waitForTimeout(500);

    const confirmBtn = this.page.getByRole('button', { name: /confirm|yes|delete|ok/i }).first();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }
  }

  async logout() {
    const userMenu = this.page.locator(
      '[class*="user"], [class*="User"], [class*="avatar"], [class*="Avatar"], [class*="profile"], [class*="Profile"]'
    ).first();
    await userMenu.click();
    await this.page.waitForTimeout(500);

    const logoutBtn = this.page.getByText(/log out|logout|sign out/i)
      .or(this.page.getByRole('button', { name: /log out|logout|sign out/i }))
      .or(this.page.getByRole('menuitem', { name: /log out|logout|sign out/i }))
      .or(this.page.locator('[class*="logout"], [class*="Logout"]'))
      .first();

    await logoutBtn.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
  }
}
