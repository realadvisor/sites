// Only routes with `handle = { hydrate: true }` load this (none on this site):
// React Router hydrates the page, and the site's behaviours run as on static routes.
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';
import './client';

startTransition(() => {
  hydrateRoot(document, <StrictMode><HydratedRouter /></StrictMode>);
});
