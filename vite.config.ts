import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build timestamp in Eastern time: YYMMDD-HHmm (e.g., "250212-2035")
const parts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false,
}).formatToParts(new Date());
const p = (type: string) => parts.find(x => x.type === type)?.value || '00';
const buildId = `${p('year').slice(2)}${p('month')}${p('day')}-${p('hour')}${p('minute')}`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3060,
    host: '0.0.0.0',
  },
  define: {
    'process.env.IS_PREACT': JSON.stringify('false'),
    '__APP_VERSION__': JSON.stringify(buildId),
  },
});
