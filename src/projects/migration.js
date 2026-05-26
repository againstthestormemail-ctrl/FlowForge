import { saveProject } from './cloud-save.js';

const AUTOSAVE_KEY = 'flowforge_autosave';
const LEGACY_KEY = 'omninapkin_autosave';
const MIGRATION_FLAG = 'flowforge_cloud_migrated';

export async function migrateLocalProjects(userId, tenantId) {
  if (localStorage.getItem(MIGRATION_FLAG)) return null;

  let payload = localStorage.getItem(AUTOSAVE_KEY);
  if (!payload) payload = localStorage.getItem(LEGACY_KEY);
  if (!payload) {
    localStorage.setItem(MIGRATION_FLAG, '1');
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(payload);
  } catch {
    localStorage.setItem(MIGRATION_FLAG, '1');
    return null;
  }

  const name = parsed.projectName || parsed.title || 'Migrated Project';
  const project = await saveProject(null, userId, name, parsed, tenantId);

  localStorage.setItem(MIGRATION_FLAG, '1');
  return project;
}
