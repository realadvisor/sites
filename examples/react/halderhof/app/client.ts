/**
 * The site's one browser script (bundled, loaded by <KitScripts>, never
 * inline): the kit's parts (enquiry form, consent, listings search and map)
 * and the affordability calculator, the same vanilla script as the Astro
 * version. The phone menu is a native popover (no script). No React in the browser.
 */
import { kit } from '@realadvisor/sites-kit-react/client';

kit();
if (document.querySelector('[data-calc]')) void import('./calc').then((m) => m.default());
