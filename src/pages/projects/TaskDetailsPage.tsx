import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ProjectService, TaskService, CommentService } from '../../services';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { TaskResponse, CommentResponse, TaskStatus, TaskPriority, ProjectMemberResponse } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getErrorKey } from '../../utils/errors';

export const TaskDetailsPage = () => {
  const { t } = useTranslation();
  const { id: projectId, taskId } = useParams<{ id: string; taskId: string }>();
  const navigate = useNavigate();
  const { userId: currentUserId } = useAuth();

  const [task, setTask] = useState<TaskResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [members, setMembers] = useState<ProjectMemberResponse[]>([]);
  
  const [userRole, setUserRole] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');

  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [project, setProject] = useState<any>(null);

  const fetchAll = async () => {
    if (!projectId || !taskId) return;
    try {
      const taskData = await TaskService.getTask(projectId, taskId);
      setTask(taskData);
      setStatus(taskData.status);
      setPriority(taskData.priority);
      setAssigneeId(taskData.assigneeId || '');
      setDueDate(taskData.dueDate ? formatToInputDate(taskData.dueDate) : '');

      const commentsData = await CommentService.getTaskComments(projectId, taskId);
      setComments(commentsData);

      const projData = await ProjectService.getProject(projectId);
      setProject(projData);

      let role = null;
      try {
        const roleData = await ProjectService.getMemberRole(projectId);
        role = roleData.role;
      } catch (err) {
        // user has no role (e.g. superadmin viewer)
      }
      setUserRole(role);

      if (role === 'ROLE_ADMIN') {
        const membersData = await ProjectService.getMembers(projectId);
        setMembers(membersData);
      }
    } catch (err: any) {
      const key = getErrorKey(err.message);
      toast.error(key ? t(key) : err.message || t('error_loading_task_details'));
    }
  };

  useEffect(() => {
    fetchAll();
  }, [projectId, taskId]);

  const formatToInputDate = (dateString?: string | null) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSaveChanges = async () => {
    if (!projectId || !taskId || !task) return;
    try {
      // 1. Update status if changed
      if (status !== task.status) {
        if (canManageStatus) {
          await TaskService.updateTaskStatus(projectId, taskId, { status });
        } else {
          throw new Error(t('only_assignee_can_update_status'));
        }
      }
      
      // 2. Update priority/dueDate if changed
      const isPriorityChanged = priority !== task.priority;
      const isDueDateChanged = dueDate !== (task.dueDate ? formatToInputDate(task.dueDate) : '');
      if (isPriorityChanged || isDueDateChanged) {
        if (isAdmin) {
          await TaskService.updateTask(projectId, taskId, {
            priority,
            dueDate: dueDate ? new Date(dueDate).toISOString() : undefined
          });
        } else {
          throw new Error(t('only_admin_can_update_priority_deadline'));
        }
      }

      // 3. Update assignee if changed
      if (assigneeId !== (task.assigneeId || '')) {
        if (isAdmin) {
          if (!assigneeId) {
            await TaskService.unassignTask(projectId, taskId);
          } else {
            await TaskService.assignTask(projectId, taskId, { assigneeId });
          }
        } else {
          throw new Error(t('only_admin_can_update_assignee'));
        }
      }

      toast.success(t('task_updated_success'));
      fetchAll();
    } catch (err: any) {
      const key = getErrorKey(err.message);
      toast.error(key ? t(key) : err.message || t('fail_update_task'));
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !taskId || !newComment.trim()) return;
    try {
      await CommentService.createComment(projectId, taskId, { content: newComment });
      setNewComment('');
      toast.success(t('comment_posted_success'));
      fetchAll();
    } catch (err: any) {
      const key = getErrorKey(err.message);
      toast.error(key ? t(key) : err.message || t('fail_post_comment'));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!projectId || !taskId) return;
    if (!window.confirm(t('confirm_delete_comment', 'Are you sure you want to delete this comment?'))) return;
    
    try {
      await CommentService.deleteComment(projectId, taskId, commentId);
      toast.success(t('comment_deleted_success', 'Comment deleted successfully'));
      fetchAll();
    } catch (err: any) {
      const key = getErrorKey(err.message);
      toast.error(key ? t(key) : err.message || t('fail_delete_comment', 'Failed to delete comment'));
    }
  };

  if (!task) {
    return <div className="container mx-auto p-4 py-8">{t('loading')}</div>;
  }

  const isAdmin = userRole === 'ROLE_ADMIN';
  const isMemberOrAdmin = userRole === 'ROLE_ADMIN' || userRole === 'ROLE_MEMBER';
  const canManageStatus = task.assigneeId === currentUserId;

  return (
    <div className="container mx-auto p-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm text-primary font-medium mb-1 flex items-center gap-2">
            <Link to={`/projects/${projectId}`} className="hover:underline">{project?.name || t('project')}</Link>
            <span>/</span>
            <span className="text-gray-500">{t('task')}</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground normal-case">
            {task.title}
          </h1>
        </div>
        <Button variant="secondary" onClick={() => navigate(`/projects/${projectId}`)}>
          {t('back_to_project')}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Col: Task Info & Comments */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed normal-case">
                {task.description || <span className="italic text-gray-400">{t('no_description')}</span>}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('comments')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">{t('no_comments_yet')}</p>
              ) : (
                <div className="space-y-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex flex-col p-4 bg-slate-50 rounded-lg border border-border group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm normal-case">
                          {comment.authorFullName ? `${comment.authorFullName} (${comment.authorUsername || ''})` : (comment.authorUsername || comment.authorId || 'Unknown')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString('en-GB')}</span>
                          {(isAdmin || comment.authorId === currentUserId) && !project?.isArchived && (
                            <button 
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-1 font-bold"
                              title={t('delete', 'Delete')}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap normal-case">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {isMemberOrAdmin && (
              <CardFooter className="bg-slate-50 border-t border-border mt-4">
                {project?.isArchived ? (
                  <span className="text-xs text-gray-500 italic w-full text-center">
                    {t('comments_disabled_archived')}
                  </span>
                ) : (
                  <form onSubmit={handlePostComment} className="w-full flex gap-3">
                    <Input 
                      placeholder={t('write_comment_placeholder')}
                      value={newComment}
                      onChange={(e: any) => setNewComment(e.target.value)}
                      className="flex-1"
                      required
                    />
                    <Button type="submit">{t('post_comment_btn')}</Button>
                  </form>
                )}
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Right Col: Controls & Meta */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('status_priority_card')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">{t('status_label', { status: '' }).replace(': ', '')}</label>
                {canManageStatus && !project?.isArchived ? (
                  <select
                    className="w-full h-10 rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value as TaskStatus)}
                  >
                    <option value="TODO">{t('todo')}</option>
                    <option value="IN_PROGRESS">{t('in_progress')}</option>
                    <option value="DONE">{t('done')}</option>
                  </select>
                ) : (
                  <div className="w-full h-10 rounded-md border border-border bg-gray-50 px-3 py-2 text-sm flex items-center">
                    {task.status === 'TODO' ? t('todo') : task.status === 'IN_PROGRESS' ? t('in_progress') : t('done')}
                  </div>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">{t('priority')}</label>
                {isAdmin && !project?.isArchived ? (
                  <select
                    className="w-full h-10 rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value as TaskPriority)}
                  >
                    <option value="LOW">{t('low')}</option>
                    <option value="MEDIUM">{t('medium')}</option>
                    <option value="HIGH">{t('high')}</option>
                  </select>
                ) : (
                  <div className="w-full h-10 rounded-md border border-border bg-gray-50 px-3 py-2 text-sm flex items-center">
                    {task.priority === 'LOW' ? t('low') : task.priority === 'MEDIUM' ? t('medium') : task.priority === 'HIGH' ? t('high') : task.priority}
                  </div>
                )}
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">{t('assignee')}</label>
                {isAdmin && !project?.isArchived ? (
                  <select
                    className="w-full h-10 rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    value={assigneeId}
                    onChange={(e: any) => setAssigneeId(e.target.value)}
                  >
                    <option value="">{t('unassigned')}</option>
                    {members.map(m => (
                      <option key={m.userId} value={m.userId} className="normal-case">
                        {m.fullName ? `${m.fullName} (${m.username || ''})` : (m.username || m.userId)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full h-10 rounded-md border border-border bg-gray-50 px-3 py-2 text-sm flex items-center normal-case">
                    {task.assigneeFullName 
                      ? `${task.assigneeFullName} (${task.assigneeUsername || ''})` 
                      : (task.assigneeUsername || (task.assigneeId ? `User: ${task.assigneeId}` : t('unassigned')))}
                  </div>
                )}
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">{t('deadline')}</label>
                {isAdmin && !project?.isArchived ? (
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e: any) => setDueDate(e.target.value)}
                  />
                ) : (
                  <div className="w-full h-10 rounded-md border border-border bg-gray-50 px-3 py-2 text-sm flex items-center">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : t('no_deadline')}
                  </div>
                )}
              </div>
            </CardContent>
            {(isAdmin || canManageStatus) && (
              <CardFooter className="border-t border-border pt-4">
                {project?.isArchived ? (
                  <span className="text-xs text-error font-medium w-full text-center">
                    {t('project_archived_no_save')}
                  </span>
                ) : (
                  <Button className="w-full" onClick={handleSaveChanges}>
                    {t('save_changes_btn')}
                  </Button>
                )}
              </CardFooter>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('details_card')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>{t('creator_label')}</span>
                <span className="font-medium text-gray-900 normal-case">
                  {task.creatorFullName ? `${task.creatorFullName} (${task.creatorUsername || ''})` : (task.creatorUsername || task.creatorId || 'Unknown')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('created_label')}</span>
                <span className="font-medium text-gray-900">{new Date(task.createdAt).toLocaleDateString('en-GB')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('deadline')}:</span>
                <span className="font-medium text-gray-900">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : t('no_deadline')}
                </span>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};
