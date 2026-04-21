import { test, expect } from '@playwright/test';
import { LoginPage, RegistrationPage, BoardPage } from './pages';
import { assertUserExistsInDb } from './db';

const BASE_PASSWORD = 'Test@12345';

function uniqueUser(prefix = 'user') {
  const ts = Date.now();
  return {
    email: `${prefix}_${ts}@example.com`,
    password: BASE_PASSWORD,
  };
}

test.describe('User Authentication', () => {

  test('AUTH-01: Successful registration → UI redirect + DB record created', async ({ page }) => {
    const user = uniqueUser('auth01');
    const regPage = new RegistrationPage(page);
    await regPage.goto();
    await regPage.register('', user.email, user.password);

    await expect(page).toHaveURL(/\/(boards|projects|dashboard|$)/, { timeout: 10_000 });
    console.log('[UI ✓] Redirected to dashboard after registration');

    await assertUserExistsInDb(user.email);
  });

  test('AUTH-02: Duplicate email registration → error shown', async ({ page }) => {
    const user = uniqueUser('auth02');
    const regPage = new RegistrationPage(page);

    // First registration
    await regPage.goto();
    await regPage.register('', user.email, user.password);
    await page.waitForURL(/\/(boards|projects|dashboard|$)/, { timeout: 10_000 });

    // Logout before trying again with same email
    const boardPage = new BoardPage(page);
    await boardPage.logout();
    await page.waitForURL(/\/login/, { timeout: 5_000 });

    // Try registering with same email
    await regPage.goto();
    await regPage.register('', user.email, user.password);

    await expect(regPage.errorAlert).toBeVisible({ timeout: 5_000 });
    console.log('[UI ✓] Error shown for duplicate email');
  });

  test('AUTH-03: Registration with blank fields → validation errors', async ({ page }) => {
    const regPage = new RegistrationPage(page);
    await regPage.goto();

    // Try submitting without filling anything
    await regPage.submitButton.click();
    await page.waitForTimeout(1000);

    // App should stay on register page — not proceed to dashboard
    const stillOnRegister = page.url().includes('/register');

    // OR native HTML5 validation fires
    const nativeInvalid = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      return Array.from(inputs).some((el) => !(el as HTMLInputElement).validity.valid);
    });

    // OR an error alert appears
    const customError = await regPage.errorAlert.isVisible({ timeout: 2_000 }).catch(() => false);

    // Any of the above means validation is working
    expect(stillOnRegister || nativeInvalid || customError).toBeTruthy();
    console.log('[UI ✓] Blank form submission correctly blocked');
  });

  test('AUTH-04: Valid login → redirected to dashboard', async ({ page }) => {
    const user = uniqueUser('auth04');
    const regPage = new RegistrationPage(page);
    await regPage.goto();
    await regPage.register('', user.email, user.password);
    await page.waitForURL(/\/(boards|projects|dashboard|$)/, { timeout: 10_000 });

    const boardPage = new BoardPage(page);
    await boardPage.logout();
    await page.waitForURL(/\/login/, { timeout: 5_000 });

    const loginPage = new LoginPage(page);
    await loginPage.login(user.email, user.password);

    await expect(page).toHaveURL(/\/(boards|projects|dashboard|$)/, { timeout: 10_000 });
    console.log('[UI ✓] Successfully logged in and reached dashboard');
  });

  test('AUTH-05: Login with wrong password → error message', async ({ page }) => {
    const user = uniqueUser('auth05');
    const regPage = new RegistrationPage(page);
    await regPage.goto();
    await regPage.register('', user.email, user.password);
    await page.waitForURL(/\/(boards|projects|dashboard|$)/, { timeout: 10_000 });

    const boardPage = new BoardPage(page);
    await boardPage.logout();
    await page.waitForURL(/\/login/, { timeout: 5_000 });

    const loginPage = new LoginPage(page);
    await loginPage.login(user.email, 'WrongPassword!999');

    await expect(loginPage.errorAlert).toBeVisible({ timeout: 5_000 });
    console.log('[UI ✓] Error shown for wrong password');
  });

  test('AUTH-06: Login with non-existent email → error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('ghost_user_no_exist@fake.com', BASE_PASSWORD);

    await expect(loginPage.errorAlert).toBeVisible({ timeout: 5_000 });
    console.log('[UI ✓] Error shown for non-existent email');
  });

  test('AUTH-07: Logout → session cleared, redirected to login', async ({ page }) => {
    const user = uniqueUser('auth07');
    const regPage = new RegistrationPage(page);
    await regPage.goto();
    await regPage.register('', user.email, user.password);
    await page.waitForURL(/\/(boards|projects|dashboard|$)/, { timeout: 10_000 });

    const boardPage = new BoardPage(page);
    await boardPage.logout();

    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
    console.log('[UI ✓] Redirected to login after logout');

    await page.goto('/');
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
    console.log('[UI ✓] Session cleared — home redirects to login');
  });

  test('AUTH-08: Unauthenticated access → redirected to login', async ({ page }) => {
    // Navigate to app first, then clear storage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.context().clearCookies();
    await page.evaluate(() => {
      try { localStorage.clear(); } catch (e) { }
    });

    // Navigate again without session
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
    console.log('[UI ✓] Unauthenticated user correctly redirected to /login');
  });

});
