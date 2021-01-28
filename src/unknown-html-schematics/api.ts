export function getPathTokensGivenHtmlPath(path: string) {
  const arrayPath = path.split("/");
  arrayPath.pop();

  let modulePaths: string[] = [];
  let pathAccumulatorAux = "";

  arrayPath.forEach((element) => {
    element = element + "/";
    pathAccumulatorAux = pathAccumulatorAux + element;
    modulePaths.push(pathAccumulatorAux);
  });
  return modulePaths;
}
