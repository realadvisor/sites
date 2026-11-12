/**
 * The site's one browser script (bundled, loaded by <KitScripts>, never
 * inline): the kit's parts (enquiry, consent, search, map) and the site's
 * own small vanilla behaviours, as in the Astro version. Every page: phone
 * menu, favourites and saved searches (localStorage). Only on a page that
 * has them (one small module each): home search pill, listing tabs, gallery,
 * payment estimate. No React islands on this site.
 */
import { kit } from '@realadvisor/sites-kit-react/client';
import './behaviours/menu';
import './behaviours/saved';

kit();
const has = (sel: string) => !!document.querySelector(sel);
if (has('.sp__form')) void import('./behaviours/searchPill');
if (has('[data-tabs]')) void import('./behaviours/tabs');
if (has('[data-gallery]')) void import('./behaviours/gallery');
if (has('[data-pay]')) void import('./behaviours/payment');
