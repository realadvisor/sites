/**
 * Enquiry endpoint. Every form on the site posts here through the kit's
 * EnquiryForm. Never call another form service. The contract (fields,
 * answers, preview and fixture mode) is the kit's: lib/enquiry.ts.
 */
import type { APIRoute } from 'astro';
import { enquiryAction } from '@realadvisor/sites-kit/enquiry';
import { ra } from '@realadvisor/sites-kit/ra';

export const prerender = false;

export const POST: APIRoute = ({ request }) => enquiryAction(request, ra);
