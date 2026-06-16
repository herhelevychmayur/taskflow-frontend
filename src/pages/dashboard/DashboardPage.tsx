import { useAuth } from '../../context/AuthContext';
import { DashboardService, UserService } from '../../services';
import type { DashboardStatsResponse, ProjectResponse, User, ProjectMemberInviteResponse } from '../../types';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  isArchived: boolean;
}



import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import { getErrorKey } from '../../utils/errors';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userRole, userId: currentUserId } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [invites, setInvites] = useState<ProjectMemberInviteResponse[]>([]);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usernamesMap, setUsernamesMap] = useState<Record<string, string>>({});

  // Superadmin dashboard states
  const [activeTab, setActiveTab] = useState<'my' | 'admin'>('my');
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [allProjects, setAllProjects] = useState<ProjectResponse[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const fetchProjects = async () => {
    try {
      const data = await apiFetch('/projects');
      setProjects(data || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchInvites = async () => {
    try {
      const data = await apiFetch('/projects/invites/user');
      setInvites(data || []);

      if (data && data.length > 0) {
        const uniqueInviterIds = Array.from(new Set(data.map((i: any) => i.inviterId))) as string[];
        for (const uid of uniqueInviterIds) {
          if (!usernamesMap[uid]) {
            try {
              const u = await UserService.getUserById(uid);
              if (u && u.username) {
                setUsernamesMap(prev => ({ ...prev, [uid]: u.username }));
              }
            } catch (err) {
              console.error("Failed to fetch inviter details", err);
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchAdminData = async () => {
    try {
      const statsData = await DashboardService.getStats();
      setStats(statsData);
      const projData = await DashboardService.getProjects();
      setAllProjects(projData || []);
      const usersData = await DashboardService.getUsers();
      setAllUsers(usersData || []);
    } catch (err: any) {
      console.error("Failed to fetch admin data", err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchInvites();
    if (userRole === 'ROLE_SUPERADMIN') {
      fetchAdminData();
    }
  }, [userRole]);

  useEffect(() => {
    if (activeTab === 'admin') {
      fetchAdminData();
    }
  }, [activeTab]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({ name: projectName, description }),
      });
      if (data && data.id) {
        navigate(`/projects/${data.id}`);
      } else {
        setProjectName('');
        setDescription('');
        fetchProjects();
      }
    } catch (err: any) {
      const key = getErrorKey(err.message);
      toast.error(key ? t(key) : err.message || t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const respondToInvite = async (inviteId: string, status: 'ACCEPTED' | 'DECLINED') => {
    try {
      await apiFetch(`/projects/invites/${inviteId}`, {
        method: 'PATCH',
        body: JSON.stringify(status),
      });
      fetchInvites();
      fetchProjects();
    } catch (err: any) {
      const key = getErrorKey(err.message);
      toast.error(key ? t(key) : err.message || t('error'));
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm(t('confirm_delete_project'))) return;
    try {
      await DashboardService.deleteProject(projectId);
      fetchAdminData();
      fetchProjects();
    } catch (err: any) {
      const key = getErrorKey(err.message);
      toast.error(key ? t(key) : err.message || t('fail_delete_project'));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm(t('confirm_delete_user'))) return;
    try {
      await DashboardService.deleteUser(userId);
      fetchAdminData();
    } catch (err: any) {
      const key = getErrorKey(err.message);
      toast.error(key ? t(key) : err.message || t('fail_delete_user'));
    }
  };

  const handleMakeSuperadmin = async (userId: string) => {
    try {
      await DashboardService.assignSuperadmin(userId);
      fetchAdminData();
    } catch (err: any) {
      const key = getErrorKey(err.message);
      toast.error(key ? t(key) : err.message || t('fail_promote_superadmin'));
    }
  };

  const handleDemoteSuperadmin = async (userId: string) => {
    if (userId === currentUserId) {
      toast.error(t('cannot_demote_self'));
      return;
    }
    try {
      await DashboardService.demoteSuperadmin(userId);
      fetchAdminData();
    } catch (err: any) {
      const key = getErrorKey(err.message);
      toast.error(key ? t(key) : err.message || t('fail_demote_superadmin'));
    }
  };

  return (
    <div className="container mx-auto p-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t('dashboard')}</h1>
        {userRole === 'ROLE_SUPERADMIN' && (
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
            {t('dashboard_admin')}
          </span>
        )}
      </div>
      
      {/* Role Tabs for Superadmin */}
      {userRole === 'ROLE_SUPERADMIN' && (
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('my')}
            className={`pb-2 px-1 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'my' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-foreground'
            }`}
          >
            {t('my_projects')}
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`pb-2 px-1 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'admin' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-foreground'
            }`}
          >
            {t('system_admin_panel')}
          </button>
        </div>
      )}

      {activeTab === 'my' ? (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4 text-foreground">{t('projects')}</h2>
              <div className="space-y-4">
                {projects.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-gray-500">
                      <p>{t('no_projects')}</p>
                    </CardContent>
                  </Card>
                ) : (
                  projects.map((proj) => (
                    <Card key={proj.id} className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate(`/projects/${proj.id}`)}>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg normal-case">{proj.name}</CardTitle>
                          {proj.isArchived && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              {t('archived')}
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className={`text-sm normal-case ${proj.description ? 'text-gray-500' : 'text-gray-400 italic'}`}>
                          {proj.description || t('no_description')}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {invites.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-foreground">{t('pending_invites')}</h2>
                <div className="space-y-4">
                  {invites.filter(i => i.status === 'PENDING').map(invite => (
                    <Card key={invite.id}>
                      <CardHeader>
                        <CardTitle className="text-lg normal-case">{invite.projectName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-500 normal-case">
                          {(() => {
                            const inviterUser = usernamesMap[invite.inviterId] || invite.inviterUsername;
                            const displayName = invite.inviterFullName 
                              ? `${invite.inviterFullName}${inviterUser ? ` (${inviterUser})` : ''}` 
                              : (inviterUser || invite.inviterId);
                            return t('invited_by', { name: displayName });
                          })()}
                        </p>
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        <Button onClick={() => respondToInvite(invite.id, 'ACCEPTED')}>{t('accept')}</Button>
                        <Button variant="danger" onClick={() => respondToInvite(invite.id, 'DECLINED')}>{t('decline')}</Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-foreground">{t('create_project')}</h2>
            <Card>
              <form onSubmit={handleCreateProject}>
                <CardContent className="space-y-4 pt-6">
                  <Input
                    label={t('project_name')}
                    type="text"
                    value={projectName}
                    onChange={(e: any) => setProjectName(e.target.value)}
                    required
                  />
                  <Input
                    label={t('description')}
                    type="text"
                    value={description}
                    onChange={(e: any) => setDescription(e.target.value)}
                    maxLength={200}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? t('loading') : t('create_project')}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      ) : (
        /* Superadmin System Panel View */
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase">{t('total_projects')}</p>
                <CardTitle className="text-2xl font-bold">{stats?.projectsCount ?? 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase">{t('archived_projects')}</p>
                <CardTitle className="text-2xl font-bold">{stats?.archivedProjectsCount ?? 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase">{t('total_users')}</p>
                <CardTitle className="text-2xl font-bold">{stats?.usersCount ?? 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase">{t('total_tasks')}</p>
                <CardTitle className="text-2xl font-bold">{stats?.tasksCount ?? 0}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* System Projects Management */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-foreground">{t('all_system_projects')}</h2>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b border-border">
                        <tr>
                          <th className="p-4 font-semibold">{t('project_name_th')}</th>
                          <th className="p-4 font-semibold text-right">{t('actions_th')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {allProjects.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-4 font-medium">
                              <div className="flex items-center gap-2">
                                <span className="normal-case">{p.name}</span>
                                {p.isArchived && (
                                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                    {t('archived')}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 normal-case">{p.description || t('no_description')}</span>
                            </td>
                            <td className="p-4 text-right flex justify-end gap-2">
                              <Button
                                variant="secondary"
                                className="text-xs py-1 px-3 h-8"
                                onClick={() => navigate(`/projects/${p.id}`)}
                              >
                                {t('view', 'View')}
                              </Button>
                              <Button
                                variant="danger"
                                className="text-xs py-1 px-3 h-8"
                                onClick={() => handleDeleteProject(p.id)}
                              >
                                {t('delete')}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Users Management */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-foreground">{t('all_system_users')}</h2>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b border-border">
                        <tr>
                          <th className="p-4 font-semibold">{t('user_details_th')}</th>
                          <th className="p-4 font-semibold text-right">{t('actions_th')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {allUsers.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50">
                            <td className="p-4 font-medium">
                              <span className="block normal-case">{u.fullName || u.username}</span>
                              <span className="text-xs text-gray-400 normal-case">{u.username} ({u.role === 'ROLE_SUPERADMIN' ? t('dashboard_admin') : u.role === 'ROLE_ADMIN' ? t('admin') : u.role === 'ROLE_USER' ? t('user') : t('member')})</span>
                            </td>
                            <td className="p-4 text-right flex justify-end gap-2">
                              {u.id !== currentUserId && (
                                <>
                                  {u.role === 'ROLE_SUPERADMIN' ? (
                                    <Button
                                      variant="secondary"
                                      className="text-xs py-1 px-3 h-8"
                                      onClick={() => handleDemoteSuperadmin(u.id)}
                                    >
                                      {t('demote')}
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="secondary"
                                      className="text-xs py-1 px-3 h-8"
                                      onClick={() => handleMakeSuperadmin(u.id)}
                                    >
                                      {t('promote')}
                                    </Button>
                                  )}
                                  <Button
                                    variant="danger"
                                    className="text-xs py-1 px-3 h-8"
                                    onClick={() => handleDeleteUser(u.id)}
                                  >
                                    {t('delete')}
                                  </Button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
