export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  createdAt?: string;
  avatarUrl?: string; // Add other properties as expected
}

export type ProjectRole = 'ROLE_ADMIN' | 'ROLE_MEMBER';
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ProjectResponse {
  id: string;
  name: string;
  description: string;
  isArchived: boolean;
  createdAt: string;
  members?: ProjectMemberResponse[];
  tasks?: TaskResponse[];
}

export interface ProjectMemberResponse {
  id?: string;
  userId: string;
  projectId?: string;
  fullName?: string;
  username?: string;
  role: ProjectRole;
  user?: User;
}

export interface ProjectMemberInviteResponse {
  id: string;
  projectId: string;
  projectName?: string;
  inviterId: string;
  inviterFullName?: string;
  inviterUsername?: string;
  inviteeId: string;
  inviteeFullName?: string;
  inviteeUsername?: string;
  status: InviteStatus;
  createdAt: string;
}

export interface TaskResponse {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  creatorId: string;
  creatorFullName?: string;
  creatorUsername?: string;
  assigneeId?: string | null;
  assigneeFullName?: string | null;
  assigneeUsername?: string | null;
  createdAt: string;
  dueDate?: string | null;
  creator?: User;
  assignee?: User;
  comments?: CommentResponse[];
}

export interface CommentResponse {
  id: string;
  taskId: string;
  authorId: string;
  authorFullName?: string;
  authorUsername?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  author?: User;
}

export interface DashboardStatsResponse {
  projectsCount: number;
  archivedProjectsCount: number;
  usersCount: number;
  superadminsCount: number;
  tasksCount: number;
  commentsCount: number;
}

export interface ProjectStatsResponse {
  totalTasks: number;
  totalMembers: number;
  totalComments: number;
  overdueTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  lowPriorityTasks: number;
  mediumPriorityTasks: number;
  highPriorityTasks: number;
}

export interface ProjectCreateRequest {
  name: string;
  description?: string;
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface TaskStatusUpdateRequest {
  status: TaskStatus;
}

export interface TaskAssignRequest {
  assigneeId: string;
}

export interface CommentCreateRequest {
  content: string;
}

export interface CommentUpdateRequest {
  content: string;
}

export interface LoginRequest {
  username: string;
  password?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
