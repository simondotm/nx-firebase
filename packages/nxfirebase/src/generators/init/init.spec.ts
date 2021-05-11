import { readJson, readWorkspaceConfiguration, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import nxfirebaseInitGenerator from './init';
import { Schema } from './schema';

describe('init', () => {
  let tree: Tree;
  const schema: Schema = {
    skipFormat: false,
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should add firebase dependencies', async () => {
    await nxfirebaseInitGenerator(tree, schema);
    const packageJson = readJson(tree, 'package.json');
    expect(packageJson.dependencies['firebase-admin']).toBeDefined();
    expect(packageJson.dependencies['firebase-functions']).toBeDefined();
    //expect(packageJson.devDependencies['@types/react']).toBeDefined();
    //expect(packageJson.devDependencies['@types/react-dom']).toBeDefined();
    //expect(packageJson.devDependencies['@testing-library/react']).toBeDefined();
  });
/*
  describe('defaultCollection', () => {
    it('should be set if none was set before', async () => {
      await nxfirebaseInitGenerator(tree, schema);
      const workspace = readWorkspaceConfiguration(tree);
      expect(workspace.cli.defaultCollection).toEqual('@nrwl/react');
      expect(workspace.generators['@nrwl/react'].application.babel).toBe(true);
    });
  });

  it('should not add jest config if unitTestRunner is none', async () => {
    await nxfirebaseInitGenerator(tree, { ...schema, unitTestRunner: 'none' });
    expect(tree.exists('jest.config.js')).toEqual(false);
  });
  */
});