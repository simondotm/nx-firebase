//SM: copied from @nrwl/node:app generator, not all of these are necessary for our app
// TODO: cleanup
export interface Schema {
  name: string;
  tags?: string;
  directory?: string;
  importPath?: string;
  unitTestRunner?: 'jest' | 'none';
  linter?: Linter;  
  babelJest?: boolean;
  strict?: boolean;  
  // not necessary, remove at some point
  buildable?: boolean; 
  publishable?: boolean;
  testEnvironment?: 'jsdom' | 'node';
}
