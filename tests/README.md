# Carousel Test Suite

This directory contains Playwright-based E2E tests for the home page carousel.

## Prerequisites

- Node.js and npm installed
- Jekyll and bundler installed
- Repository dependencies installed

## Setup

```bash
# Install test dependencies (already done during test creation)
npm install
```

## Running Tests

### 1. Start Jekyll Server

In one terminal, start the Jekyll development server:

```bash
cd site
bundle exec jekyll serve
```

Wait for the server to start (usually takes 10-20 seconds). You should see:
```
Server address: http://127.0.0.1:4000/
Server running... press ctrl-c to stop.
```

### 2. Run Tests

In another terminal, run the tests:

```bash
# Run all tests
npm test

# Run tests with UI mode (interactive)
npm run test:ui

# Run tests in headed mode (see the browser)
npm run test:headed

# Run tests in debug mode
npm run test:debug
```

## Test Coverage

The test suite covers:

1. **Carousel Rendering** - Verifies the carousel displays correctly with the first card visible
2. **Navigation** - Tests clicking navigation cards switches to the correct card  
3. **Color Changes** - Validates colors change dynamically when switching cards
4. **Progress Bar** - Checks progress bar animates and resets correctly
5. **Interactive Links** - Ensures links have proper styling and are clickable
6. **Complete Cycle** - Tests cycling through all navigation cards
7. **Bullet Pagination** - Verifies pagination bullets work
8. **Auto-advance** - Tests autoplay after 10 seconds
9. **Responsive** - Checks carousel maintains state after browser resize

## Test Structure

```
tests/
  └── carousel.spec.ts  # Main carousel test suite
```

## Adding New Tests

When adding carousel features, update `carousel.spec.ts` with new test cases following the existing patterns.

## Workflow for Changes

1. Run tests BEFORE making changes: `npm test`
2. Make your code changes
3. Run tests AFTER changes: `npm test`  
4. Fix any failing tests or update tests if behavior intentionally changed
5. Commit changes only when all tests pass
