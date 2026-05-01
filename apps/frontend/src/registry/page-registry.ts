import { createRegistry } from './create-registry';
import type { PageRenderer } from './page.types';
import { FormPageRenderer } from './pages/FormPage';
import { TablePageRenderer } from './pages/TablePage';
import { DashboardPageRenderer } from './pages/DashboardPage';
import { UnknownPage } from './pages/UnknownPage';

export const pageRegistry = createRegistry<PageRenderer>({
  name: 'page',
  fallback: UnknownPage,
  entries: {
    form: FormPageRenderer as PageRenderer,
    table: TablePageRenderer as PageRenderer,
    dashboard: DashboardPageRenderer as PageRenderer,
  },
});
