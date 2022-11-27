import { FirebaseBuildExecutorSchema } from './schema';
import executor from './build';

const options: FirebaseBuildExecutorSchema = {};

describe('Build Executor', () => {
  it('can run', async () => {
    const output = await executor(options);
    expect(output.success).toBe(true);
  });
});
