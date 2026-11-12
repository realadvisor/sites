import { createSiteWorker } from '@realadvisor/sites-kit-react/worker';

export default createSiteWorker(() => import('virtual:react-router/server-build'));
