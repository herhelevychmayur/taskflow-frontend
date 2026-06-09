export const getErrorKey = (message: string): string => {
  if (!message) return 'error';
  
  if (message.startsWith('User already exist with username')) {
    return 'err_user_already_exists';
  }
  
  switch (message) {
    case 'User not found':
      return 'err_user_not_found';
    case 'Only the assigned user can update task status':
      return 'err_only_assigned_user_update_status';
    case 'Task not found in project':
      return 'err_task_not_found_in_project';
    case 'Assignee must be a project member':
      return 'err_assignee_must_be_member';
    case 'User is already a member of this project':
      return 'err_user_already_member';
    case 'You are not authorized to respond to this invite':
      return 'err_not_authorized_invite';
    case 'You cannot change your own role':
      return 'err_cannot_change_own_role';
    case 'Project member not found':
      return 'err_project_member_not_found';
    case 'Project not found':
      return 'err_project_not_found';
    case 'Comment not found in task':
      return 'err_comment_not_found_in_task';
    case 'Only comment author or project admin can modify this comment':
      return 'err_only_author_or_admin_modify_comment';
    case 'You cannot demote yourself':
      return 'err_cannot_demote_yourself';
    case 'Cannot perform this action because the project is archived':
      return 'err_project_is_archived';
    case 'An unexpected error occurred':
      return 'err_unexpected';
    case 'Validation failed':
      return 'err_validation_failed';
    default:
      return '';
  }
};
