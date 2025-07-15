const { test, expect } = require('@playwright/test');

test.describe('Core Features - Critical User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/planner');
    await page.waitForLoadState('networkidle');
  });

  test('should complete basic user journey with Algeria', async ({ page }) => {
    // Attendre que les pays soient chargés
    await page.waitForFunction(() => {
      return window.countrySelectInstance &&
        window.countrySelectInstance.options &&
        Object.keys(window.countrySelectInstance.options).length > 1;
    }, { timeout: 10000 });

    // Sélectionner l'Algérie
    await page.evaluate(() => {
      const countrySelect = window.countrySelectInstance;
      if (countrySelect) countrySelect.setValue('algerie6641');
    });

    // Attendre que les mosquées soient chargées
    await page.waitForFunction(() => {
      return window.mosqueSelectInstance &&
        window.mosqueSelectInstance.options &&
        Object.keys(window.mosqueSelectInstance.options).length > 1;
    }, { timeout: 15000 });

    // Sélectionner la première mosquée
    await page.evaluate(() => {
      const mosqueSelect = window.mosqueSelectInstance;
      if (mosqueSelect && mosqueSelect.options) {
        const options = Object.values(mosqueSelect.options);
        if (options.length > 0) mosqueSelect.setValue(options[0].value);
      }
    });

    // Attendre que la sélection de mosquée soit prise en compte
    await page.waitForFunction(() => {
      const mosqueSelect = document.getElementById('mosque-select');
      return mosqueSelect && mosqueSelect.value && mosqueSelect.value.length > 0;
    }, { timeout: 5000 });

    // Configurer le padding
    await page.fill('input[name="global_padding_before"]', '15');
    await page.fill('input[name="global_padding_after"]', '30');

    // Soumettre le formulaire
    await page.locator('button[type="submit"]').click();
    await page.waitForLoadState('networkidle');

    // Vérifier que la timeline s'affiche (plusieurs sélecteurs possibles)
    try {
      await expect(page.locator('.slots-timeline-container')).toBeVisible({ timeout: 5000 });
    } catch {
      // Essayer d'autres sélecteurs de timeline
      await expect(page.locator('img[alt*="00:00"]')).toBeVisible({ timeout: 5000 });
    }

    // Vérifier la présence d'au moins un lien ICS
    await expect(page.locator('a[href*=".ics"]').first()).toBeVisible();
  });

  test('should handle mosque search and selection', async ({ page }) => {
    // Attendre que les pays soient chargés
    await page.waitForFunction(() => {
      return window.countrySelectInstance &&
        window.countrySelectInstance.options &&
        Object.keys(window.countrySelectInstance.options).length > 1;
    }, { timeout: 10000 });

    // Sélectionner l'Algérie
    await page.evaluate(() => {
      const countrySelect = window.countrySelectInstance;
      if (countrySelect) countrySelect.setValue('algerie6641');
    });

    // Attendre que les mosquées soient chargées
    await page.waitForFunction(() => {
      return window.mosqueSelectInstance &&
        window.mosqueSelectInstance.options &&
        Object.keys(window.mosqueSelectInstance.options).length > 1;
    }, { timeout: 15000 });

    // Sélectionner la première mosquée
    await page.evaluate(() => {
      const mosqueSelect = window.mosqueSelectInstance;
      if (mosqueSelect && mosqueSelect.options) {
        const options = Object.values(mosqueSelect.options);
        if (options.length > 0) mosqueSelect.setValue(options[0].value);
      }
    });

    // Vérifier que la sélection est bien prise en compte (valeur non vide)
    await expect(page.locator('#mosque-select')).toHaveValue(/^.+$/);
  });

  test('should configure padding correctly', async ({ page }) => {
    // Remplir les champs de padding
    await page.fill('input[name="global_padding_before"]', '20');
    await page.fill('input[name="global_padding_after"]', '45');
    // Vérifier les valeurs
    expect(await page.inputValue('input[name="global_padding_before"]')).toBe('20');
    expect(await page.inputValue('input[name="global_padding_after"]')).toBe('45');
  });
});

test.describe('Error Handling - Core Scenarios', () => {
  test('should handle invalid mosque selection gracefully', async ({ page }) => {
    await page.goto('/planner');
    await page.waitForLoadState('networkidle');

    // Vérifier que le formulaire est dans l'état initial (pas de mosquée sélectionnée)
    const mosqueValue = await page.locator('#mosque-select').inputValue();
    expect(mosqueValue).toBe('');

    // Soumettre sans mosquée
    await page.locator('button[type="submit"]').click();

    // Attendre un moment pour voir si une validation apparaît
    await page.waitForTimeout(2000);

    // Vérifier que nous sommes toujours sur la page planner (pas de redirection)
    await expect(page.locator('h1')).toContainText('Prayers Planner');

    // Vérifier que le formulaire est toujours présent
    await expect(page.locator('#plannerForm')).toBeVisible();
  });
});
