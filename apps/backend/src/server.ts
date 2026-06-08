import app from './app';
import { env } from './config/env';

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  ClockUp Backend API running successfully!   `);
  console.log(`  Local URL: http://localhost:${PORT}        `);
  console.log(`  API Health: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});
