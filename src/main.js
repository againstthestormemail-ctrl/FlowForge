import { getSession, onAuthChange, signOut, getUserEmail, getUserId } from './auth/session.js';
import { renderLoginForm } from './auth/login.js';
import { setupProjectBar } from './projects/project-list.js';
import { saveProject, loadProject } from './projects/cloud-save.js';
import { migrateLocalProjects } from './projects/migration.js';

const authGate = document.getElementById('auth-gate');
const appHost = document.getElementById('app-host');
const projectBar = document.getElementById('project-bar');

let currentSession = null;
let currentProjectId = null;
let projectBarApi = null;
let appFrame = null;

async function boot() {
  currentSession = await getSession();

  if (currentSession) {
    await showApp(currentSession);
  } else {
    showLogin();
  }

  onAuthChange(async (session) => {
    if (session && !currentSession) {
      currentSession = session;
      await showApp(session);
    } else if (!session && currentSession) {
      currentSession = null;
      showLogin();
    }
  });
}

function showLogin() {
  authGate.classList.remove('hidden');
  appHost.classList.remove('active');
  projectBar.classList.add('hidden');
  authGate.innerHTML = '';
  renderLoginForm(authGate);
}

async function showApp(session) {
  authGate.classList.add('hidden');
  appHost.classList.add('active');

  document.getElementById('user-info').textContent = getUserEmail(session);
  document.getElementById('btn-sign-out').addEventListener('click', () => signOut());

  const userId = getUserId(session);

  const migrated = await migrateLocalProjects(userId, null);
  if (migrated) currentProjectId = migrated.id;

  projectBarApi = setupProjectBar(userId, {
    onLoad: (project) => {
      currentProjectId = project.id;
      injectProjectIntoApp(project.data);
    },
    onNew: () => {
      currentProjectId = null;
      injectNewProject();
    }
  });

  if (migrated) {
    projectBarApi.setSelectedId(migrated.id);
  }

  document.getElementById('btn-save-project').addEventListener('click', handleSave);

  await loadAppFrame();
}

async function loadAppFrame() {
  if (appFrame) return;

  appFrame = document.createElement('iframe');
  appFrame.src = '/flowforge.html';
  appFrame.id = 'flowforge-frame';
  appHost.appendChild(appFrame);

  await new Promise((resolve) => {
    appFrame.addEventListener('load', resolve, { once: true });
  });

  patchAppGlobals();
}

function patchAppGlobals() {
  const win = appFrame.contentWindow;

  win.__flowforge_cloudSave = async (payload) => {
    const userId = getUserId(currentSession);
    const name = payload.projectName || payload.title || 'Untitled';
    const result = await saveProject(currentProjectId, userId, name, payload, null);
    currentProjectId = result.id;
    if (projectBarApi) {
      await projectBarApi.refreshList();
      projectBarApi.setSelectedId(result.id);
    }
    return result;
  };

  win.__flowforge_cloudLoad = async (projectId) => {
    const project = await loadProject(projectId);
    return project.data;
  };

  const origSave = win.saveProjectToFile || win.saveProject;
  if (origSave) {
    win.saveProjectToFile = win.saveProject = async function () {
      const payload = win.captureProjectPayload ? win.captureProjectPayload() : null;
      if (payload) {
        await win.__flowforge_cloudSave(payload);
      } else if (origSave) {
        origSave.call(win);
      }
    };
  }
}

function injectProjectIntoApp(data) {
  if (!appFrame || !appFrame.contentWindow) return;
  const win = appFrame.contentWindow;
  if (win.applyLoadedProjectData) {
    const parsed = win.parseProjectPayload ? win.parseProjectPayload(JSON.stringify(data)) : data;
    win.applyLoadedProjectData(parsed);
  }
}

function injectNewProject() {
  if (!appFrame || !appFrame.contentWindow) return;
  const win = appFrame.contentWindow;
  if (win.newProject) {
    win.newProject();
  }
}

async function handleSave() {
  if (!appFrame || !appFrame.contentWindow) return;
  const win = appFrame.contentWindow;

  let payload;
  if (win.captureProjectPayload) {
    payload = win.captureProjectPayload();
  } else {
    return;
  }

  const name = payload.projectName || payload.title || prompt('Project name:') || 'Untitled';
  payload.projectName = name;

  const userId = getUserId(currentSession);
  const result = await saveProject(currentProjectId, userId, name, payload, null);
  currentProjectId = result.id;

  if (projectBarApi) {
    await projectBarApi.refreshList();
    projectBarApi.setSelectedId(result.id);
  }
}

boot();
