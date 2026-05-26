import { listProjects, loadProject, deleteProject } from './cloud-save.js';

export function setupProjectBar(userId, { onLoad, onNew }) {
  const bar = document.getElementById('project-bar');
  const select = document.getElementById('project-select');
  const btnNew = document.getElementById('btn-new-project');

  bar.classList.remove('hidden');

  async function refreshList() {
    const projects = await listProjects(userId);
    select.innerHTML = '<option value="">— Select project —</option>';
    for (const p of projects) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (${new Date(p.updated_at).toLocaleDateString()})`;
      select.appendChild(opt);
    }
    return projects;
  }

  select.addEventListener('change', async () => {
    if (!select.value) return;
    const project = await loadProject(select.value);
    onLoad(project);
  });

  btnNew.addEventListener('click', () => {
    select.value = '';
    onNew();
  });

  refreshList();

  return { refreshList, getSelectedId: () => select.value, setSelectedId: (id) => { select.value = id; } };
}
