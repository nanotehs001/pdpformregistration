import dotenv from 'dotenv';
import app from './app.js';
import { configProblems } from './config/runtimeConfig.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const problems = configProblems();
if (problems.length > 0) {
  console.warn('\n⚠ Configuration incomplete — submissions will fail until fixed:');
  problems.forEach((problem) => console.warn('  •', problem));
  console.warn('');
}

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log('✓ Configuration source: environment variables');
});
