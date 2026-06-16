const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
import i18n from './i18n';


export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorData = await response.json();
      if (errorData.message === 'Validation failed' && errorData.errors && errorData.errors.length > 0) {
        const translatedErrors = errorData.errors.map((errStr: string) => {
          const parts = errStr.split(': ');
          if (parts.length < 2) return errStr;
          const fieldName = parts[0];
          const errorMessage = parts.slice(1).join(': ');
          
          const fieldKey = `field_${fieldName}`;
          let translatedField = i18n.t(fieldKey);
          if (translatedField === fieldKey) translatedField = fieldName;

          let translatedMessage = errorMessage;
          if (errorMessage === 'must not be blank') translatedMessage = i18n.t('val_not_blank');
          else if (errorMessage === 'must not be null') translatedMessage = i18n.t('val_not_null');
          else if (errorMessage === 'must not be empty') translatedMessage = i18n.t('val_not_empty');
          else if (errorMessage === 'must contain only english letters' || errorMessage === 'must contain only english letters and numbers') translatedMessage = i18n.t('val_pattern_letters');
          else {
            const sizeMatch = errorMessage.match(/size must be between (\d+) and (\d+)/);
            if (sizeMatch) {
              translatedMessage = i18n.t('val_size_between', { min: sizeMatch[1], max: sizeMatch[2] });
            }
          }
          return `${translatedField} ${translatedMessage}`;
        });
        errorMsg = `${i18n.t('err_validation_failed')}: ${translatedErrors.join(', ')}`;
      } else {
        errorMsg = errorData.message || errorMsg;
      }
    } catch {
      // Ignored
    }
    throw new Error(errorMsg);
  }

  // Some endpoints might return 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
};
