import { supabase } from '../auth/supabase-client.js';

export async function listProjects(userId) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Failed to list projects: ${error.message}`);
  return data;
}

export async function loadProject(projectId) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, data')
    .eq('id', projectId)
    .single();

  if (error) throw new Error(`Failed to load project: ${error.message}`);
  return data;
}

export async function saveProject(projectId, userId, name, projectData, tenantId) {
  const row = {
    user_id: userId,
    name,
    data: projectData,
    updated_at: new Date().toISOString()
  };

  if (tenantId) row.tenant_id = tenantId;

  if (projectId) {
    const { data, error } = await supabase
      .from('projects')
      .update(row)
      .eq('id', projectId)
      .eq('user_id', userId)
      .select('id, name, updated_at')
      .single();
    if (error) throw new Error(`Failed to save project: ${error.message}`);
    return data;
  } else {
    row.data = projectData;
    const { data, error } = await supabase
      .from('projects')
      .insert(row)
      .select('id, name, updated_at')
      .single();
    if (error) throw new Error(`Failed to create project: ${error.message}`);
    return data;
  }
}

export async function deleteProject(projectId, userId) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to delete project: ${error.message}`);
}
