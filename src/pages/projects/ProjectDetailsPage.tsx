import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ProjectService, TaskService, UserService } from '../../services';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { ProjectResponse, ProjectMemberInviteResponse, TaskResponse, TaskPriority, ProjectMemberResponse, ProjectStatsResponse } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getErrorKey } from '../../utils/errors';

export const ProjectDetailsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId: currentUserId, userRole: globalRole } = useAuth();

  // Filtering states
  const [filterScope, setFilterScope] = useState<'all' | 'my'>('all');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE'>('ALL');
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [invites, setInvites] = useState<ProjectMemberInviteResponse[]>([]);
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [members, setMembers] = useState<ProjectMemberResponse[]>([]);
  
  const [inviteeId, setInviteeId] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [usernamesMap, setUsernamesMap] = useState<Record<string, string>>({});

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('MEDIUM');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');

  // Project management fields
  const [activeSubTab, setActiveSubTab] = useState<'view' | 'manage' | 'stats'>('view');
  const [editProjName, setEditProjName] = useState('');
  const [editProjDesc, setEditProjDesc] = useState('');
  const [projectStats, setProjectStats] = useState<ProjectStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchProjectAndMembers = async () => {
    if (!id) return;
    try {
      const projData = await ProjectService.getProject(id);
      setProject(projData);
      setEditProjName(projData.name);
      setEditProjDesc(projData.description || '');

      let role = null;
      try {
        const roleData = await ProjectService.getMemberRole(id);
        role = roleData.role;
      } catch (err) {
        // Not a member, probably a superadmin viewing the project
      }
      setUserRole(role);

      const membersData = await ProjectService.getMembers(id);
      setMembers(membersData);

      if (role === 'ROLE_ADMIN') {
        const invitesData = await ProjectService.getInvitesByProject(id);
        setInvites(invitesData);

        if (invitesData && invitesData.length > 0) {
          const uniqueInviteeIds = Array.from(new Set(invitesData.map((i: any) => i.inviteeId))) as string[];
          for (const uid of uniqueInviteeIds) {
            if (!usernamesMap[uid]) {
              try {
                const u = await UserService.getUserById(uid);
                if (u && u.username) {
                  setUsernamesMap(prev => ({ ...prev, [uid]: u.username }));
                }
              } catch (err) {
                console.error("Failed to fetch invitee details", err);
              }
            }
          }
        }
      }
    } catch (err: any) {
      const key = getErrorKey(err.message);
      toast.error(key ? t(key) : err.message || t('error'));
    }
  };

  const fetchTasks = async () => {
    if (!id) return;
    try {
      const params: any = {};
      if (filterStatus !== 'ALL') {
        params.status = filterStatus;
      }
      if (filterPriority !== 'ALL') {
        params.priority = filterPriority;
      }
      if (filterScope === 'my' && currentUserId) {
        params.assigneeId = currentUserId;
      }
      const tasksData = await TaskService.getProjectTasks(id, params);
      setTasks(tasksData);
    } catch (err: any) {
      console.error("Failed to fetch tasks", err);
    }
  };

  const fetchData = async () => {
    await Promise.all([
      fetchProjectAndMembers(),
      fetchTasks()
    ]);
  };

  const fetchProjectStats = async () => {
    if (!id) return;
    setStatsLoading(true);
    try {
      const stats = await ProjectService.getProjectStats(id);
      setProjectStats(stats);
    } catch (err: any) {
      console.error('Failed to fetch project stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectAndMembers();
  }, [id]);

  useEffect(() => {
    fetchTasks();
  }, [id, filterScope, filterStatus, filterPriority]);

  useEffect(() => {
    if (activeSubTab === 'stats' && (userRole === 'ROLE_ADMIN' || globalRole === 'ROLE_SUPERADMIN')) {
      fetchProjectStats();
    }
  }, [activeSubTab, id, userRole, globalRole]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (members.some(m => m.userId === inviteeId || m.username === inviteeId)) {
      toast.error(t('user_already_member_err'));
      return;
    }

    try {
      await ProjectService.inviteMember(id, inviteeId);
      toast.success(t('success'));
      setInviteeId('');
      fetchData();
    } catch (err: any) {
      const key = getErrorKey(err.message);
      toast.error(key ? t(key) : err.message || t('error'));
    }
  };

  const handleRoleChange = async (userId: string, newRole: any) => {
    if (!id) return;
    try {
      await ProjectService.updateMemberRole(id, userId, newRole);
      toast.success(t('success'));
      fetchData();
    } catch (err: any) {
      const key = getErrorKey(err.message);
      toast.error(key ? t(key) : err.message || t('error'));
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id) return;
    try {
      await ProjectService.removeMember(id, userId);
      toast.success(t('success'));
      fetchData();
    } catch (err: any) {
      const key = getErrorKey(err.message);
      toast.error(key ? t(key) : err.message || t('error'));
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await TaskService.createTask(id, {
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
        assigneeId: newTaskAssigneeId || undefined
      });
      toast.success(t('task_created_success'));
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskPriority('MEDIUM');
      setNewTaskDueDate('');
      setNewTaskAssigneeId('');
      fetchData();
    } catch (err: any) {
      const key = getErrorKey(err.message);
      toast.error(key ? t(key) : err.message || t('fail_create_task'));
    }
  };

  const handleUpdateProjectSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !project) return;
    try {
      const updated = await ProjectService.updateProject(id, {
        name: editProjName,
        description: editProjDesc
      });
      toast.success(t('project_settings_success'));
      setProject(updated);
      fetchProjectAndMembers();
    } catch (err: any) {
      const key = getErrorKey(err.message);
      toast.error(key ? t(key) : err.message || t('fail_update_project_settings'));
    }
  };

  const handleArchiveProject = async (archive: boolean) => {
    if (!id) return;
    try {
      await ProjectService.archiveProject(id, archive);
      toast.success(archive ? t('success') : t('success'));
      fetchData();
    } catch (err: any) {
      const key = getErrorKey(err.message);
      toast.error(key ? t(key) : err.message || t('fail_archive_project'));
    }
  };

  const handleDeleteProject = async () => {
    if (!id || !window.confirm(t('confirm_delete_project'))) return;
    try {
      await ProjectService.deleteProject(id);
      navigate('/');
    } catch (err: any) {
      const key = getErrorKey(err.message);
      toast.error(key ? t(key) : err.message || t('fail_delete_project'));
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch(priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'TODO': return 'bg-slate-100 text-slate-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'DONE': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTasks = tasks;

  if (!project) {
    return <div className="container mx-auto p-4 py-8">{t('loading')}</div>;
  }

  return (
    <div className="container mx-auto p-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground normal-case">
            {project.name}
          </h1>
          <p className={`mt-2 normal-case ${project.description ? 'text-gray-500' : 'text-gray-400 italic'}`}>
            {project.description || t('no_description')}
          </p>
          {userRole && (
            <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
              {userRole === 'ROLE_ADMIN' ? t('admin') : t('member')}
            </span>
          )}
          {project.isArchived && (
            <span className="inline-block mt-2 ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
              {t('archived')}
            </span>
          )}
        </div>
        <Button variant="secondary" onClick={() => navigate('/')}>
          {t('dashboard')}
        </Button>
      </div>

      {/* Role Tabs for Project Admins */}
      {userRole === 'ROLE_ADMIN' && (
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveSubTab('view')}
            className={`pb-2 px-1 font-semibold text-sm transition-colors border-b-2 ${
              activeSubTab === 'view' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-foreground'
            }`}
          >
            {t('tasks_and_members_tab')}
          </button>
          {userRole === 'ROLE_ADMIN' && (
            <button
              onClick={() => setActiveSubTab('manage')}
              className={`pb-2 px-1 font-semibold text-sm transition-colors border-b-2 ${
                activeSubTab === 'manage' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-foreground'
              }`}
            >
              {t('manage_project_tab')}
            </button>
          )}
          {(userRole === 'ROLE_ADMIN' || globalRole === 'ROLE_SUPERADMIN') && (
            <button
              onClick={() => setActiveSubTab('stats')}
              className={`pb-2 px-1 font-semibold text-sm transition-colors border-b-2 ${
                activeSubTab === 'stats' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-foreground'
              }`}
            >
              {t('statistics_tab')}
            </button>
          )}
        </div>
      )}

      {activeSubTab === 'stats' ? (
        /* Statistics View */
        <div className="space-y-6">
          {statsLoading ? (
            <p className="text-gray-500 text-center py-8">{t('loading')}</p>
          ) : !projectStats || projectStats.totalTasks === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <p>{t('stat_no_tasks_yet')}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Top stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase">{t('stat_total_tasks')}</p>
                    <CardTitle className="text-2xl font-bold">{projectStats.totalTasks}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase">{t('stat_total_members')}</p>
                    <CardTitle className="text-2xl font-bold">{projectStats.totalMembers}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase">{t('stat_total_comments')}</p>
                    <CardTitle className="text-2xl font-bold">{projectStats.totalComments}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase">{t('stat_overdue_tasks')}</p>
                    <CardTitle className={`text-2xl font-bold ${projectStats.overdueTasks > 0 ? 'text-red-600' : ''}`}>{projectStats.overdueTasks}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Distribution cards */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* By Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('stat_by_status')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: t('todo'), value: projectStats.todoTasks, color: 'bg-slate-400' },
                      { label: t('in_progress'), value: projectStats.inProgressTasks, color: 'bg-blue-500' },
                      { label: t('done'), value: projectStats.doneTasks, color: 'bg-emerald-500' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{item.label}</span>
                          <span className="text-gray-500">{item.value} ({projectStats.totalTasks > 0 ? Math.round((item.value / projectStats.totalTasks) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full ${item.color} transition-all duration-500`}
                            style={{ width: `${projectStats.totalTasks > 0 ? (item.value / projectStats.totalTasks) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* By Priority */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('stat_by_priority')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: t('low'), value: projectStats.lowPriorityTasks, color: 'bg-green-500' },
                      { label: t('medium'), value: projectStats.mediumPriorityTasks, color: 'bg-yellow-500' },
                      { label: t('high'), value: projectStats.highPriorityTasks, color: 'bg-red-500' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{item.label}</span>
                          <span className="text-gray-500">{item.value} ({projectStats.totalTasks > 0 ? Math.round((item.value / projectStats.totalTasks) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full ${item.color} transition-all duration-500`}
                            style={{ width: `${projectStats.totalTasks > 0 ? (item.value / projectStats.totalTasks) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      ) : activeSubTab === 'view' ? (
        /* Members / Default View */
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column: Tasks */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 space-y-2 sm:space-y-0">
                <CardTitle>{t('tasks')}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {/* Scope Toggle: All vs Mine */}
                  <div className="inline-flex rounded-md shadow-sm">
                    <button
                      type="button"
                      onClick={() => setFilterScope('all')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-l-md border ${
                        filterScope === 'all'
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-700 border-border hover:bg-gray-50'
                      }`}
                    >
                      {t('all')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterScope('my')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-r-md border-t border-b border-r ${
                        filterScope === 'my'
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-700 border-border hover:bg-gray-50'
                      }`}
                    >
                      {t('my_tasks')}
                    </button>
                  </div>

                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="h-8 rounded-md border border-border bg-white px-2 py-1 text-xs focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="ALL">{t('all_statuses')}</option>
                    <option value="TODO">{t('todo')}</option>
                    <option value="IN_PROGRESS">{t('in_progress')}</option>
                    <option value="DONE">{t('done')}</option>
                  </select>

                  {/* Priority Filter */}
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as any)}
                    className="h-8 rounded-md border border-border bg-white px-2 py-1 text-xs focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="ALL">{t('all_priorities')}</option>
                    <option value="LOW">{t('low')}</option>
                    <option value="MEDIUM">{t('medium')}</option>
                    <option value="HIGH">{t('high')}</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredTasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">{t('no_tasks_match')}</p>
                ) : (
                  <ul className="divide-y divide-border border border-border rounded-md overflow-hidden">
                    {filteredTasks.map((task) => (
                      <li key={task.id} className="hover:bg-slate-50 transition-colors">
                        <Link to={`/projects/${project.id}/tasks/${task.id}`} className="p-4 flex items-center justify-between block">
                          <div>
                            <p className="font-semibold text-lg normal-case">{task.title}</p>
                            <div className="flex gap-2 mt-2">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${getStatusColor(task.status)}`}>
                                {task.status === 'TODO' ? t('todo') : task.status === 'IN_PROGRESS' ? t('in_progress') : t('done')}
                              </span>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${getPriorityColor(task.priority)}`}>
                                {t('priority_label', { priority: task.priority === 'LOW' ? t('low') : task.priority === 'MEDIUM' ? t('medium') : t('high') })}
                              </span>
                              {task.dueDate && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-purple-100 text-purple-800 flex items-center gap-1">
                                  📅 {new Date(task.dueDate).toLocaleDateString('en-GB')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500 normal-case">
                              {t('assignee_value', { name: task.assigneeFullName ? `${task.assigneeFullName} (${task.assigneeUsername || ''})` : t('unassigned') })}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Members (Read-only) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('members')}</CardTitle>
              </CardHeader>
              <CardContent>
                {(!members || members.length === 0) ? (
                  <p className="text-gray-500">{t('no_members')}</p>
                ) : (
                  <ul className="divide-y divide-border border border-border rounded-md">
                    {members.map((member) => (
                      <li key={member.userId} className="p-4 bg-white">
                        <p className="font-medium normal-case">
                          {member.fullName ? `${member.fullName} (${member.username || ''})` : (member.username || member.userId)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{member.role === 'ROLE_ADMIN' ? t('admin') : t('member')}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Admin Management Panel View */
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Create Task Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('create_new_task')}</CardTitle>
              </CardHeader>
              {project.isArchived ? (
                <CardContent>
                  <p className="text-gray-500 italic">{t('cannot_create_tasks_archived')}</p>
                </CardContent>
              ) : (
                <form onSubmit={handleCreateTask}>
                  <CardContent className="space-y-4">
                    <Input
                      label={t('task_title')}
                      value={newTaskTitle}
                      onChange={(e: any) => setNewTaskTitle(e.target.value)}
                      required
                    />
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('description')}</label>
                      <textarea 
                        className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                        value={newTaskDesc}
                        onChange={(e: any) => setNewTaskDesc(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('priority')}</label>
                      <select 
                        className="w-full h-10 rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={newTaskPriority}
                        onChange={(e: any) => setNewTaskPriority(e.target.value as TaskPriority)}
                      >
                        <option value="LOW">{t('low')}</option>
                        <option value="MEDIUM">{t('medium')}</option>
                        <option value="HIGH">{t('high')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('assignee')}</label>
                      <select 
                        className="w-full h-10 rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={newTaskAssigneeId}
                        onChange={(e: any) => setNewTaskAssigneeId(e.target.value)}
                      >
                        <option value="">{t('unassigned')}</option>
                        {members.map(m => (
                          <option key={m.userId} value={m.userId}>
                            {m.fullName ? `${m.fullName} (${m.username || ''})` : (m.username || m.userId)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label={t('deadline')}
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e: any) => setNewTaskDueDate(e.target.value)}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit">{t('create_task_btn')}</Button>
                  </CardFooter>
                </form>
              )}
            </Card>

            {/* Project Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('project_settings')}</CardTitle>
              </CardHeader>
              <form onSubmit={handleUpdateProjectSettings}>
                <CardContent className="space-y-4">
                  <Input
                    label={t('project_name')}
                    value={editProjName}
                    onChange={(e: any) => setEditProjName(e.target.value)}
                    required
                    disabled={project.isArchived}
                  />
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('project_description')}</label>
                    <textarea 
                      className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] disabled:opacity-50"
                      value={editProjDesc}
                      onChange={(e: any) => setEditProjDesc(e.target.value)}
                      disabled={project.isArchived}
                      maxLength={200}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-4">
                  {!project.isArchived && <Button type="submit">{t('save_settings')}</Button>}
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="secondary"
                      onClick={() => handleArchiveProject(!project.isArchived)}
                    >
                      {project.isArchived ? t('unarchive') : t('archive')}
                    </Button>
                    <Button 
                      type="button" 
                      variant="danger"
                      onClick={handleDeleteProject}
                    >
                      {t('delete_project_btn')}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Team Members Management */}
            <Card>
              <CardHeader>
                <CardTitle>{t('manage_team_roles')}</CardTitle>
              </CardHeader>
              <CardContent>
                {(!members || members.length === 0) ? (
                  <p className="text-gray-500">{t('no_members')}</p>
                ) : (
                  <ul className="divide-y divide-border border border-border rounded-md">
                    {members.map((member) => (
                      <li key={member.userId} className="p-4 flex flex-col gap-3 bg-white">
                        <div>
                          <p className="font-medium normal-case">
                            {member.fullName ? `${member.fullName} (${member.username || ''})` : (member.username || member.userId)}
                          </p>
                          <p className="text-xs text-gray-500">{t('current_role', { role: member.role === 'ROLE_ADMIN' ? t('admin') : t('member') })}</p>
                        </div>
                        {member.userId !== members?.[0]?.userId && member.userId !== currentUserId && !project.isArchived && (
                          <div className="flex gap-2 items-center w-full">
                            <select 
                              className="flex-1 h-9 rounded-md border border-border bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                              value={member.role}
                              onChange={(e: any) => handleRoleChange(member.userId, e.target.value)}
                            >
                              <option value="ROLE_ADMIN">{t('admin')}</option>
                              <option value="ROLE_MEMBER">{t('member')}</option>
                            </select>
                            <Button variant="danger" className="text-xs py-1 h-9" onClick={() => handleRemoveMember(member.userId)}>
                              X
                            </Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Invite Members */}
            <Card>
              <CardHeader>
                <CardTitle>{t('invite_member')}</CardTitle>
              </CardHeader>
              {project.isArchived ? (
                <CardContent>
                  <p className="text-gray-500 italic">{t('cannot_invite_archived')}</p>
                </CardContent>
              ) : (
                <form onSubmit={handleInvite}>
                  <CardContent className="space-y-4">
                    <Input
                      label={t('user_id_to_invite')}
                      type="text"
                      value={inviteeId}
                      onChange={(e: any) => setInviteeId(e.target.value)}
                      required
                    />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full">
                      {t('invite_member')}
                    </Button>
                  </CardFooter>
                </form>
              )}
            </Card>

            {/* Sent Invites List */}
            {invites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('sent_invites')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border border border-border rounded-md">
                    {invites.map((invite) => (
                       <li key={invite.id} className="p-3 flex items-center justify-between bg-white">
                         <div>
                            <p className="font-medium text-sm normal-case">
                              {(() => {
                                const inviteeUser = usernamesMap[invite.inviteeId] || invite.inviteeUsername;
                                return invite.inviteeFullName 
                                  ? `${invite.inviteeFullName}${inviteeUser ? ` (${inviteeUser})` : ''}` 
                                  : (inviteeUser || invite.inviteeId);
                              })()}
                            </p>
                           <p className="text-xs text-gray-500">{t('status_label', { status: t(invite.status.toLowerCase()) })}</p>
                         </div>
                       </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
