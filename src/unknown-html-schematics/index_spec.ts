import {
  SchematicTestRunner,
  UnitTestTree,
} from "@angular-devkit/schematics/testing";
import * as path from "path";
import { UpdateModuleOptions } from "./schema";
import { findClassBySelector } from "ng-schematics-helpers";
import { getPathTokensGivenHtmlPath } from "./api";

const collectionPath = path.join(__dirname, "../collection.json");

describe("Missing Component inside app.module.ts", () => {
  const runner = new SchematicTestRunner("schematics", collectionPath);
  const projectRootName = "projects";
  const projectName = "unknown-html-testing";
  const sourcePath = `${projectRootName}/${projectName}/src`;

  const workspaceOptions = {
    name: "workspace",
    newProjectRoot: projectRootName,
    version: "1",
  };
  const appOptions = {
    name: projectName,
  };

  let tree: UnitTestTree;

  beforeEach(async () => {
    tree = await runner
      .runExternalSchematicAsync(
        "@schematics/angular",
        "workspace",
        workspaceOptions
      )
      .toPromise();
    tree = await runner
      .runExternalSchematicAsync(
        "@schematics/angular",
        "application",
        appOptions,
        tree
      )
      .toPromise();

    tree = await runner
      .runExternalSchematicAsync(
        "@schematics/angular",
        "module",
        { name: "testing", path: `${sourcePath}/app` },
        tree
      )
      .toPromise();

    const newFilePath = `${sourcePath}/app/testing/testing.component.ts`;

    tree.create(
      newFilePath,
      `
      import { Component, OnInit } from '@angular/core';

      @Component({
        selector: 'app-testing',
        template: 'hello!'
      })
      export class TestingComponent {
        constructor() { }
      }
    `
    );

    tree.overwrite(
      sourcePath + "/app/app.component.html",
      "<app-testing></app-testing>"
    );
  });

  it("should create an new workspace", async () => {
    expect(tree.files.length).toEqual(32);
  });

  it("should return class given selector", () => {
    const options: UpdateModuleOptions = {
      module: `${sourcePath}/app/app.module.ts`,
      name: "TestingComponent",
      selector: "app-testing",
      path: "src/app/app.component.html",
    };
    findClassBySelector(options.selector, sourcePath, tree);
  });

  it("should update app.module using unknown-html-element schematics", async () => {
    const componentName = "TestingComponent";
    const modulePath = `${sourcePath}/app/app.module.ts`;

    const schematicsOptions: UpdateModuleOptions = {
      module: modulePath,
      selector: "app-testing",
      name: componentName,
      path: "src/app/app.component.html",
    };

    tree = await runner
      .runSchematicAsync("fix", schematicsOptions, tree)
      .toPromise();
    expect(tree.readContent(modulePath)).toContain(componentName);
  });

  it("should update app.module using unknown-html-element schematics without name option", async () => {
    const componentName = "TestingComponent";
    const modulePath = `${sourcePath}/app/app.module.ts`;

    const schematicsOptions: UpdateModuleOptions = {
      module: modulePath,
      selector: "app-testing",
      path: "src/app/app.component.html",
    };

    tree = await runner
      .runSchematicAsync("fix", schematicsOptions, tree)
      .toPromise();

    expect(tree.readContent(modulePath)).toContain(componentName);
  });

  it("should update app.module using unknown-html-element schematics without name, and module option", async () => {
    const componentName = "TestingComponent";
    const modulePath = `${sourcePath}/app/app.module.ts`;

    const schematicsOptions: UpdateModuleOptions = {
      selector: "app-testing",
      path: "src/app/app.component.html",
    };

    tree = await runner
      .runSchematicAsync("fix", schematicsOptions, tree)
      .toPromise();

    expect(tree.readContent(modulePath)).toContain(componentName);
  });

  it("should return an array of paths", () => {
    let arrayAux: string[] = getPathTokensGivenHtmlPath(
      "src/app/user/components/menu/menu.component.html"
    );
    expect(arrayAux.length).toEqual(5);
  });
});

describe("Missing Module inside app.module.ts", () => {
  const runner = new SchematicTestRunner("schematics", collectionPath);
  const projectRootName = "projects";
  const projectName = "unknown-html-testing";
  const sourcePath = `/${projectRootName}/${projectName}/src`;

  const workspaceOptions = {
    name: "workspace",
    newProjectRoot: projectRootName,
    version: "1",
  };
  const appOptions = {
    name: projectName,
  };

  let tree: UnitTestTree;

  beforeEach(async () => {
    tree = await runner
      .runExternalSchematicAsync(
        "@schematics/angular",
        "workspace",
        workspaceOptions
      )
      .toPromise();
    tree = await runner
      .runExternalSchematicAsync(
        "@schematics/angular",
        "application",
        appOptions,
        tree
      )
      .toPromise();

    tree = await runner
      .runExternalSchematicAsync(
        "@schematics/angular",
        "module",
        { name: "testing", path: `${sourcePath}/app` },
        tree
      )
      .toPromise();

    tree = tree = await runner
      .runExternalSchematicAsync(
        "@schematics/angular",
        "component",
        { name: "testing", path: `${sourcePath}/app/testing`, export: true },
        tree
      )
      .toPromise();

    tree.overwrite(
      sourcePath + "/app/app.component.html",
      "<app-testing></app-testing>"
    );
  });

  it("should create an new workspace", async () => {
    expect(tree.files.length).toEqual(35);
  });

  it("should update app.module using unknown-html-element schematics without name, and module option", async () => {
    const moduleName = "TestingModule";
    const modulePath = `${sourcePath}/app/app.module.ts`;
    expect(tree.readContent(modulePath)).not.toContain(moduleName);

    const schematicsOptions: UpdateModuleOptions = {
      selector: "testing",
      path: "src/app/app.component.html",
    };

    tree = await runner
      .runSchematicAsync("fix", schematicsOptions, tree)
      .toPromise();

    expect(tree.readContent(modulePath)).toContain(moduleName);
  });
});
