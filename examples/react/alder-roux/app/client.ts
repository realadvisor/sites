/**
 * The site's one browser script (bundled, loaded by <KitScripts>, never
 * inline): the kit's parts only (enquiry, consent, search, map). The site
 * itself needs no JavaScript, as on the Astro version: the phone menu is a
 * native popover, the search tabs and the stacking-plan filter are CSS (:has).
 */
import { kit } from '@realadvisor/sites-kit-react/client';

kit();
