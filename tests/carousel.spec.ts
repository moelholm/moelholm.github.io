import { test, expect, Page } from '@playwright/test';

/**
 * Test suite for the home page carousel functionality
 * 
 * These tests validate:
 * 1. Carousel renders correctly with the first card visible
 * 2. Navigation works - clicking nav cards switches to that card
 * 3. Colors change dynamically when switching between cards
 * 4. Progress bar animates correctly
 * 5. All interactive elements work as expected
 */

test.describe('Home Page Carousel', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
    
    // Wait for the carousel to be fully loaded
    await page.waitForSelector('.swiper-container', { state: 'visible', timeout: 10000 });
    await page.waitForSelector('.carousel-nav-card', { state: 'visible', timeout: 5000 });
  });

  test('should display the carousel with the first card visible', async ({ page }) => {
    // Verify the carousel container exists
    const carousel = page.locator('.swiper-container');
    await expect(carousel).toBeVisible();

    // Verify swiper slides exist
    const slides = page.locator('.swiper-slide');
    await expect(slides).toHaveCountGreaterThan(0);

    // Verify the first slide is active
    const firstSlide = page.locator('.swiper-slide').first();
    await expect(firstSlide).toBeVisible();

    // Verify navigation cards are present
    const navCards = page.locator('.carousel-nav-card');
    await expect(navCards).toHaveCountGreaterThanOrEqual(5);

    // Verify the first navigation card is marked as active
    const firstNavCard = navCards.first();
    await expect(firstNavCard).toHaveClass(/active/);
  });

  test('should switch cards when clicking navigation buttons', async ({ page }) => {
    // Get all navigation cards
    const navCards = page.locator('.carousel-nav-card');
    const navCardCount = await navCards.count();
    
    expect(navCardCount).toBeGreaterThanOrEqual(5);

    // Click on the second navigation card
    const secondNavCard = navCards.nth(1);
    const secondNavCardText = await secondNavCard.textContent();
    
    await secondNavCard.click();
    
    // Wait for the slide transition to complete
    await page.waitForTimeout(700); // Swiper transition is 600ms

    // Verify the second card is now active
    await expect(secondNavCard).toHaveClass(/active/);

    // Verify the active slide index changed
    const activeSlide = page.locator('.swiper-slide-active');
    await expect(activeSlide).toBeVisible();

    // Verify the carousel content changed
    const slideContent = await activeSlide.textContent();
    expect(slideContent).toBeTruthy();
  });

  test('should change colors when switching between cards', async ({ page }) => {
    // Helper function to extract RGB color from computed style
    const getElementColor = async (element: any) => {
      return await element.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).color;
      });
    };

    // Get the first navigation card and its color
    const firstNavCard = page.locator('.carousel-nav-card').first();
    const firstNavColor = await getElementColor(firstNavCard);

    // Click on the second navigation card
    const secondNavCard = page.locator('.carousel-nav-card').nth(1);
    await secondNavCard.click();

    // Wait for transition
    await page.waitForTimeout(700);

    // Get the second navigation card's color after it becomes active
    const secondNavColor = await getElementColor(secondNavCard);

    // Verify colors are different between cards
    // Note: The active card should have a different styling
    const firstBgColor = await firstNavCard.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    const secondBgColor = await secondNavCard.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // The background colors should be different for different cards
    expect(firstBgColor).not.toBe(secondBgColor);

    // Verify progress bar color changes
    const progressBar = page.locator('.carousel-progress-bar');
    const progressBarColor = await progressBar.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    expect(progressBarColor).toBeTruthy();
  });

  test('should have functioning progress bar', async ({ page }) => {
    const progressBar = page.locator('.carousel-progress-bar');
    await expect(progressBar).toBeVisible();

    // Get initial width
    const initialWidth = await progressBar.evaluate((el: HTMLElement) => {
      return parseFloat(window.getComputedStyle(el).width);
    });

    // Wait a bit and check that width has increased (progress bar is animating)
    await page.waitForTimeout(1000);

    const laterWidth = await progressBar.evaluate((el: HTMLElement) => {
      return parseFloat(window.getComputedStyle(el).width);
    });

    // Progress bar should be animating (width should increase)
    expect(laterWidth).toBeGreaterThan(initialWidth);
  });

  test('should reset progress bar when switching cards manually', async ({ page }) => {
    // Click on the second navigation card
    const secondNavCard = page.locator('.carousel-nav-card').nth(1);
    await secondNavCard.click();

    // Wait for transition
    await page.waitForTimeout(200);

    // Get progress bar width immediately after switching
    const progressBar = page.locator('.carousel-progress-bar');
    const widthAfterSwitch = await progressBar.evaluate((el: HTMLElement) => {
      return parseFloat(window.getComputedStyle(el).width);
    });

    // Progress bar should be at or near 0 after switching
    const progressBarContainer = page.locator('.carousel-progress-container');
    const containerWidth = await progressBarContainer.evaluate((el: HTMLElement) => {
      return parseFloat(window.getComputedStyle(el).width);
    });

    const widthPercentage = (widthAfterSwitch / containerWidth) * 100;
    
    // Should be less than 10% (allowing for animation start)
    expect(widthPercentage).toBeLessThan(10);
  });

  test('should have clickable links with proper styling', async ({ page }) => {
    // Find all post title links in the active slide
    const activeSlide = page.locator('.swiper-slide-active');
    const links = activeSlide.locator('a.post-title-link');

    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);

    // Check the first link has proper color styling
    const firstLink = links.first();
    await expect(firstLink).toBeVisible();

    const linkColor = await firstLink.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).color;
    });

    // Color should be set (not default black or transparent)
    expect(linkColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(linkColor).not.toBe('rgb(0, 0, 0)');
  });

  test('should cycle through all navigation cards', async ({ page }) => {
    const navCards = page.locator('.carousel-nav-card');
    const cardCount = await navCards.count();

    // Click through each navigation card
    for (let i = 0; i < cardCount; i++) {
      const navCard = navCards.nth(i);
      await navCard.click();
      
      // Wait for transition
      await page.waitForTimeout(700);

      // Verify this card is now active
      await expect(navCard).toHaveClass(/active/);

      // Verify the slide changed
      const activeSlide = page.locator('.swiper-slide-active');
      await expect(activeSlide).toBeVisible();
    }
  });

  test('should have bullet pagination', async ({ page }) => {
    const pagination = page.locator('.swiper-pagination');
    await expect(pagination).toBeVisible();

    const bullets = page.locator('.swiper-pagination-bullet');
    const bulletCount = await bullets.count();
    
    expect(bulletCount).toBeGreaterThanOrEqual(5);

    // Verify first bullet is active
    const firstBullet = bullets.first();
    await expect(firstBullet).toHaveClass(/swiper-pagination-bullet-active/);
  });

  test('should auto-advance after timeout (10 seconds)', async ({ page }) => {
    // This test verifies autoplay functionality
    // Note: This is a longer test due to the 10-second autoplay delay
    
    // Get the initially active card
    const initialActiveCard = await page.locator('.carousel-nav-card.active').textContent();

    // Wait for autoplay (10 seconds + transition time)
    await page.waitForTimeout(11000);

    // Get the new active card
    const newActiveCard = await page.locator('.carousel-nav-card.active').textContent();

    // The active card should have changed
    expect(newActiveCard).not.toBe(initialActiveCard);
  }, { timeout: 15000 }); // Increase timeout for this test

  test('should maintain carousel state after browser resize', async ({ page }) => {
    // Get the active slide before resize
    const initialActiveIndex = await page.locator('.carousel-nav-card.active').evaluate((el) => {
      return Array.from(el.parentElement?.children || []).indexOf(el);
    });

    // Resize the browser
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500);

    // Verify the same slide is still active
    const activeIndexAfterResize = await page.locator('.carousel-nav-card.active').evaluate((el) => {
      return Array.from(el.parentElement?.children || []).indexOf(el);
    });

    expect(activeIndexAfterResize).toBe(initialActiveIndex);

    // Resize back
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
