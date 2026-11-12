/**
 * The enquiry endpoint behind <EnquiryForm> (the Astro kit's, lib/enquiry.ts):
 * app/routes/api.enquiry.ts is
 *
 *   import { enquiryAction } from '@realadvisor/sites-kit-react/server/enquiry';
 *   import { sites } from '../lib/data.server';
 *   export const action = ({ request }: Route.ActionArgs) => enquiryAction(request, sites);
 */
export { enquiryAction, type EnquiryClient } from '@realadvisor/sites-kit/enquiry';
