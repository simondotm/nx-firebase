/**
 * Custom test sequencer to ensure e2e tests run in the correct order.
 * Some tests depend on shared libraries created by earlier tests.
 */
const Sequencer = require('@jest/test-sequencer').default

class CustomSequencer extends Sequencer {
  /**
   * Define the order in which test files should run.
   * test-workspace must run first to verify setup
   * test-libraries must run second to create shared libraries
   * other tests can then run and use those libraries
   */
  sort(tests) {
    const testOrder = [
      'test-workspace.spec.ts',
      'test-libraries.spec.ts',
      'test-application.spec.ts',
      'test-function.spec.ts',
      'test-bundler.spec.ts',
      'test-sync.spec.ts',
      'test-targets.spec.ts',
      'test-migrate.spec.ts',
    ]

    const getOrder = (test) => {
      const filename = test.path.split('/').pop() || ''
      const index = testOrder.indexOf(filename)
      return index === -1 ? testOrder.length : index
    }

    return [...tests].sort((a, b) => getOrder(a) - getOrder(b))
  }
}

module.exports = CustomSequencer
