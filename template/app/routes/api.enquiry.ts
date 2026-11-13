/**
 * Enquiry endpoint. Every form on the site posts here through the kit's
 * EnquiryForm. Never call another form service. The contract (fields,
 * answers, preview and fixture mode) is the kit's. Keep it.
 */
import type { Route } from './+types/api.enquiry';
import { enquiryAction } from '@realadvisor/sites-kit-react/server/enquiry';
import { sites } from '../lib/data.server';

export const action = ({ request }: Route.ActionArgs) => enquiryAction(request, sites);
export const loader = () => new Response(null, { status: 405, headers: { allow: 'POST' } });
