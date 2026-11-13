/**
 * The site's one browser script (bundled, loaded by <KitScripts>, never
 * inline). kit() loads each kit part (enquiry, consent, search, map) only on
 * a page that has it. Add the site's small behaviours (menu, tabs, gallery)
 * here as plain functions. Real React interactivity: <Island> + islands()
 * (kit-react AGENTS.md).
 */
import { kit } from '@realadvisor/sites-kit-react/client';

kit();
