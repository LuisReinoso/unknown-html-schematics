import {
  Rule,
  SchematicContext,
  Tree,
  SchematicsException,
  chain,
} from "@angular-devkit/schematics";
import { UpdateModuleOptions } from "./schema";
import { getWorkspace } from "@schematics/angular/utility/workspace";
import { findModule } from "@schematics/angular/utility/find-module";
import { getPathTokensGivenHtmlPath } from "./api";
import {
  findClassBySelector,
  updateDeclarations,
  updateImports,
} from "ng-schematics-helpers";

export function fix(_options: UpdateModuleOptions): Rule {
  return async (tree: Tree, _context: SchematicContext) => {
    const workspace = await getWorkspace(tree);
    if (!workspace) {
      throw new SchematicsException(
        "Could not find Angular workspace configuration"
      );
    }

    if (!_options.selector) {
      throw new SchematicsException("No selector provided.");
    }

    if (!_options.path) {
      throw new SchematicsException("No error path provided.");
    }

    let projectKey = _options.project;
    if (!_options.project) {
      projectKey = [...workspace.projects.keys()][0];
    }

    if (!projectKey) {
      throw new SchematicsException("Missing project key provided.");
    }

    const defaultProjectRoot = workspace.projects.get(projectKey);

    let componentName = _options.name as string;
    let componentSelectorPath: string = "";
    let moduleComponentPath = "";
    let moduleComponentName = "";

    if (!componentName || !componentSelectorPath) {
      const classInfo = findClassBySelector(
        _options.selector,
        `/${defaultProjectRoot.root}/src`,
        tree
      );

      if (classInfo) {
        componentName = classInfo.className;
        componentSelectorPath = classInfo.classPath;
        moduleComponentPath = classInfo.modulePath;
        moduleComponentName = classInfo.moduleName;
      }
    }

    if (!componentName || !componentSelectorPath) {
      throw new SchematicsException("Info was not found.");
    }

    let modulePath = _options.module as any;

    if (!modulePath) {
      let possibleModulePaths = getPathTokensGivenHtmlPath(_options.path).map(
        (path) => `/${defaultProjectRoot.root}/${path}`
      );

      while (!modulePath && possibleModulePaths.length > 0) {
        let possiblePath = possibleModulePaths.pop();

        try {
          modulePath = findModule(tree, possiblePath);
        } catch (error) {
          // console.info("module not found in:", possiblePath);
        }
      }
    }

    if (!modulePath) {
      throw new SchematicsException("Module path was not found.");
    }

    return chain([
      (host: Tree) => {
        !!moduleComponentName
          ? updateImports({
              tree,
              modulePathToEdit: modulePath,
              moduleNameToInsert: moduleComponentName,
              modulePathToInsert: moduleComponentPath
                .split(".")
                .slice(0, -1)
                .join("."),
            })
          : updateDeclarations({
              tree,
              modulePathToEdit: "/" + modulePath,
              componentNameToInsert: componentName,
              componentPathToInsert: componentSelectorPath
                .split(".")
                .slice(0, -1)
                .join("."),
            });

        return host;
      },
    ]);
  };
}
