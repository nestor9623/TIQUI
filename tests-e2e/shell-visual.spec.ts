import { expect, test } from '@playwright/test';

const FIXED_NOW_ISO = '2025-01-15T09:30:00.000Z';

async function freezeTime(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript((fixedNowIso: string) => {
    const RealDate = Date;
    const fixedTimestamp = new RealDate(fixedNowIso).getTime();

    class MockDate extends RealDate {
      constructor(...args: ConstructorParameters<typeof Date>) {
        if (args.length === 0) {
          super(fixedTimestamp);
          return;
        }
        super(...args);
      }

      static now(): number {
        return fixedTimestamp;
      }
    }

    Object.defineProperty(window, 'Date', {
      value: MockDate,
      configurable: true,
      writable: true,
    });
  }, FIXED_NOW_ISO);
}

async function login(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/auth/login');
  await page.getByLabel('Correo electrónico').fill('admin@tiqui.com');
  await page.locator('#password').fill('admin123');
  await page.getByRole('button', { name: 'Entrar al panel' }).click();
  await expect(page).toHaveURL(/\/home/);
}

async function stabilizePage(page: import('@playwright/test').Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition-duration: 0ms !important;
        animation-duration: 0ms !important;
        animation-delay: 0ms !important;
      }
    `,
  });
}

test.describe('Shell visual baseline', () => {
  test('captures authenticated shell states', async ({ page }, testInfo) => {
    await freezeTime(page);
    await login(page);
    await stabilizePage(page);

    await expect(page.locator('body')).toHaveScreenshot(`shell-${testInfo.project.name}-default.png`, {
      fullPage: true,
    });

    if (testInfo.project.name.startsWith('desktop')) {
      await page.getByTitle('Contraer').click();
      await expect(page.locator('body')).toHaveScreenshot(`shell-${testInfo.project.name}-collapsed.png`, {
        fullPage: true,
      });
    } else if (testInfo.project.name.includes('mobile')) {
      await page.getByTitle('Menú').click();
      await expect(page.locator('body')).toHaveScreenshot(`shell-${testInfo.project.name}-mobile-open.png`, {
        fullPage: true,
      });
    }
  });
});
