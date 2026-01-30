
export function getProjectsList(): string[] {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  const projectDirs = fs.readdirSync(PROJECTS_DIR);
  return projectDirs
    .filter(dir => fs.statSync(path.join(PROJECTS_DIR, dir)).isDirectory())
    .map(dir => dir.split('-').pop() || dir);
}
