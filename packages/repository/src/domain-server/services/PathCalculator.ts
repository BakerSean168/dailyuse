export class PathCalculator {
  public static buildPath(parentPath: string | null, name: string): string {
    if (!parentPath || parentPath === '/') {
      return `/${name}`;
    }

    return `${parentPath.replace(/\/$/, '')}/${name}`;
  }

  public static replaceName(path: string, newName: string): string {
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash < 0) {
      return `/${newName}`;
    }

    return `${path.slice(0, lastSlash + 1)}${newName}`;
  }
}
