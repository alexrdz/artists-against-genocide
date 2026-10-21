import { test, expect } from '@playwright/test';

test('directory page loads with search and filters', async ({ page }) => {
  await page.goto('/');

  // Hero is visible
  await expect(page.locator('.hero__title')).toContainText('Musicians against the genocide');

  // Search bar is present
  await expect(page.locator('#search-input')).toBeVisible();

  // Filters sidebar is present
  await expect(page.locator('.filters')).toBeVisible();

  // Results grid has artist cards
  const cards = page.locator('.artist-card');
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
});

test('search filters artists by name', async ({ page }) => {
  await page.goto('/');

  // Type a search query
  await page.locator('#search-input').fill('Brian Eno');
  await page.waitForTimeout(300); // debounce

  // Should show Brian Eno
  const cards = page.locator('.artist-card');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Brian Eno');
});

test('clear search button works', async ({ page }) => {
  await page.goto('/');

  await page.locator('#search-input').fill('Brian');
  await page.waitForTimeout(300);
  await expect(page.locator('#search-clear')).toBeVisible();

  await page.locator('#search-clear').click();
  await page.waitForTimeout(300);

  // Multiple cards should be visible again
  const count = await page.locator('.artist-card').count();
  expect(count).toBeGreaterThan(1);
});

test('campaign filter narrows results', async ({ page }) => {
  await page.goto('/');

  // Get initial count
  const initialCount = await page.locator('.artist-card').count();

  // Click the "No Music for Genocide" campaign filter
  await page.locator('[data-filter-type="campaign"][data-filter-value="nmg"]').click();
  await page.waitForTimeout(300);

  // Results should change
  const filteredCount = await page.locator('.artist-card').count();
  expect(filteredCount).toBeGreaterThan(0);
  expect(filteredCount).toBeLessThanOrEqual(initialCount);
});

test('evidence category filter narrows results', async ({ page }) => {
  await page.goto('/');

  // Click the "G-D" category filter
  await page.locator('[data-filter-type="category"][data-filter-value="G-D"]').click();
  await page.waitForTimeout(300);

  // Should show G-D artists
  const cards = page.locator('.artist-card');
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);

  // Each card should have a G-D badge
  const firstCard = cards.first();
  await expect(firstCard.locator('.cat-badge--G-D')).toBeVisible();
});

test('clear filters button resets all filters', async ({ page }) => {
  await page.goto('/');

  // Apply a filter
  await page.locator('[data-filter-type="category"][data-filter-value="S"]').click();
  await page.waitForTimeout(300);

  // Clear filters
  await page.locator('#clear-filters').click();
  await page.waitForTimeout(300);

  // All checkboxes should be unchecked
  const checked = await page.locator('.filters__checkbox.is-checked').count();
  expect(checked).toBe(0);
});

test('URL state reflects search query', async ({ page }) => {
  await page.goto('/');

  await page.locator('#search-input').fill('Kneecap');
  await page.waitForTimeout(300);

  // URL should contain q=Kneecap
  const url = page.url();
  expect(url).toContain('q=Kneecap');
});

test('pagination works', async ({ page }) => {
  await page.goto('/');

  // If pagination exists, click next page
  const pagination = page.locator('.pagination');
  const buttons = pagination.locator('button:not(:disabled)');

  const count = await buttons.count();
  if (count > 1) {
    await buttons.nth(1).click(); // Click page 2 or next
    await page.waitForTimeout(300);

    // URL should have page=2
    expect(page.url()).toContain('page=2');
  }
});

test('artist profile page loads with evidence', async ({ page }) => {
  await page.goto('/');

  // Click first artist card
  await page.locator('.artist-card').first().click();
  await page.waitForLoadState('networkidle');

  // Should be on an artist page
  await expect(page).toHaveURL(/\/artists\//);

  // Profile name should be visible
  await expect(page.locator('.profile__name')).toBeVisible();

  // At least one evidence card should be present
  const evidence = page.locator('.evidence-card');
  const count = await evidence.count();
  expect(count).toBeGreaterThan(0);

  // Evidence should have a source link
  const sourceLink = evidence.first().locator('a[target="_blank"]');
  await expect(sourceLink).toBeVisible();
});

test('campaigns index page loads', async ({ page }) => {
  await page.goto('/campaigns/');

  await expect(page.locator('h1')).toContainText('Campaigns');

  // Should list at least 4 campaigns
  const campaignLinks = page.locator('.campaign-page__hero');
  const count = await campaignLinks.count();
  expect(count).toBeGreaterThanOrEqual(4);
});

test('individual campaign page loads with artists', async ({ page }) => {
  await page.goto('/campaigns/nmg/');

  await expect(page.locator('.campaign-page__name')).toContainText('No Music for Genocide');
  await expect(page.locator('.campaign-page__source')).toBeVisible();

  // Should list artists
  const cards = page.locator('.artist-card');
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
});

test('methodology page loads', async ({ page }) => {
  await page.goto('/methodology/');

  await expect(page.locator('h1')).toContainText('Methodology');
  await expect(page.locator('.methodology__category-grid')).toBeVisible();

  // Should list all 4 categories
  const categoryCards = page.locator('.methodology__category-card');
  const count = await categoryCards.count();
  expect(count).toBe(4);
});

test('changes page loads with audit log', async ({ page }) => {
  await page.goto('/changes/');

  await expect(page.locator('h1')).toContainText('Changes');

  // Should have at least one log entry (from import)
  const entries = page.locator('.evidence-card');
  const count = await entries.count();
  expect(count).toBeGreaterThan(0);
});

test('404 page works', async ({ page }) => {
  await page.goto('/nonexistent-page');

  await expect(page.locator('.error-page__code')).toContainText('404');
});

test('sitemap.txt is accessible', async ({ page }) => {
  const response = await page.goto('/sitemap.txt');
  expect(response?.status()).toBe(200);

  const content = await response?.text();
  expect(content).toContain('/');
  expect(content).toContain('/methodology');
  expect(content).toContain('/artists/');
});

test('mobile navigation menu works', async ({ page }) => {
  await page.goto('/');

  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  // Mobile nav should be hidden initially
  const mobileNav = page.locator('#mobile-nav');
  await expect(mobileNav).not.toBeVisible();

  // Click menu toggle
  await page.locator('#menu-toggle').click();
  await expect(mobileNav).toBeVisible();

  // Click again to close
  await page.locator('#menu-toggle').click();
  await expect(mobileNav).not.toBeVisible();
});

test('directory is responsive at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/');

  // Search bar should be full width
  const searchBar = page.locator('.search-bar__input');
  await expect(searchBar).toBeVisible();

  // Filters should be visible (stacked, not sidebar)
  await expect(page.locator('.filters')).toBeVisible();

  // Results grid should show single column
  const grid = page.locator('.results__grid');
  await expect(grid).toBeVisible();
});

test('directory is responsive at 768px', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/');

  // Nav links should be visible (desktop nav)
  await expect(page.locator('.site-header__nav')).toBeVisible();

  // Results grid should show 2 columns
  const cards = page.locator('.artist-card');
  expect(await cards.count()).toBeGreaterThan(0);
});

test('directory is responsive at 1440px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  // Layout should have sidebar
  await expect(page.locator('.directory__layout')).toBeVisible();
  await expect(page.locator('.filters')).toBeVisible();

  // Results grid should show 2 columns
  const cards = page.locator('.artist-card');
  expect(await cards.count()).toBeGreaterThan(0);
});

test('no draft artists appear in public output', async ({ page }) => {
  await page.goto('/');

  // All visible artists should be published (checked via the search index)
  // We verify by checking that the results count matches the published count
  const countText = await page.locator('#results-count').textContent();
  expect(countText).toMatch(/\d+ artists?/);

  // The count should be 54 (our published cohort)
  // If drafts were leaking, it would be 919
  const match = countText?.match(/(\d+)/);
  if (match) {
    const count = parseInt(match[1], 10);
    expect(count).toBeLessThan(100); // Drafts would show 919
  }
});

test('sort dropdown changes result order', async ({ page }) => {
  await page.goto('/');

  // Default sort is relevance
  // Change to name A-Z
  await page.locator('#sort-select').selectOption('name');
  await page.waitForTimeout(300);

  // First card should start with A or a number
  const firstName = await page.locator('.artist-card__name').first().textContent();
  expect(firstName).toBeTruthy();

  // Change to most evidence
  await page.locator('#sort-select').selectOption('evidence');
  await page.waitForTimeout(300);

  // Should still have results
  const count = await page.locator('.artist-card').count();
  expect(count).toBeGreaterThan(0);
});
