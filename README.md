# MTG Collection Manager — UI Prototype

An Angular interface for a personal Magic: The Gathering collection, built with Bootstrap and customized using SCSS. This project focuses on the assignment's interface requirements.

## Run and check

```sh
npm install
npm start
npm run build
npm test -- --watch=false
```

`npm start` opens a development server at http://localhost:4200.

## What is implemented

- Responsive header, footer, branding, and card images.
- Desktop collection table and compact rows on smaller screens, without horizontal scrolling.
- Top navigation on desktop and fixed bottom navigation on mobile.
- Custom SCSS for typography, spacing, navigation, table and row layouts, condition badges, buttons, and dialogs.
- Realistic static sample cards, with sample Collection, Favorites, and Trade pages.
- Bootstrap dialogs for Add Card, Manage Card, filtering, and a removal confirmation state.
- Form controls, a sort selector, and a heart button that demonstrates its pressed state.
- The previously implemented sample card lookup and dependent printing selection. Selecting a printing determines which foil options are available.

## Prototype behavior

**The controls do not change the sample collection.** Add Card, Save Changes, Remove Card, and Apply Filters close their dialogs. They do not add, update, remove, or filter rows. The search field and sort selector can be used, but do not change the displayed list. Heart button state is a visual preview; it does not update the Favorites page.

Manage Card opens with sample values. Changes remain in that form only and are reset when a card is opened again. The removal confirmation demonstrates the dialog flow without deleting anything.

The small card lookup inside Add Card remains interactive to demonstrate the previously agreed form sequence: choose a card, choose its printing, then view the allowed finish. It searches only Dogmeat, Lightning Bolt, and Sol Ring from the sample catalog.

There is no collection store, persistence, backend, live Scryfall search, or price lookup. Images load directly from the supplied Scryfall image URLs.

## Files

- `src/app/app.html`: shared header, footer, router outlet, and mobile navigation.
- `src/app/app.routes.ts`: routes for the three sample pages.
- `src/app/data/sample-cards.ts`: static card data and sample printings.
- `src/app/pages/collection/collection.html`: table, mobile rows, and dialog markup.
- `src/app/pages/collection/collection.ts`: sample-view selection and form-preview behavior.
- `src/styles.scss`: Bootstrap theme customization.
- Component SCSS files: responsive layout and component styling.

The desktop table starts at 1200px; navigation moves to the bottom below 768px.
