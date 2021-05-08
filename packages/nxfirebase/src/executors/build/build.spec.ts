import { BuildExecutorSchema } from './schema';
import executor from './build';

const options: BuildExecutorSchema = {};

describe('Build Executor', () => {
  it('can run', async () => {
    const output = await executor(options);
    expect(output.success).toBe(true);
  });
});
