export interface NxFirebaseAppGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  importPath?: string;
  unitTestRunner?: 'jest' | 'none';
  linter?: Linter;  


  buildable?: boolean;
  publishable?: boolean;
  testEnvironment?: 'jsdom' | 'node';
  babelJest?: boolean;
  strict?: boolean;  
}
