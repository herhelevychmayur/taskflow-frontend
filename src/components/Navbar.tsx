
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, LogOut } from 'lucide-react';
import { Button } from './ui/Button';

export const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, logout, userId } = useAuth();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'uk' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2">
          Taskflow
        </Link>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <Globe className="w-4 h-4" />
            {i18n.language.toUpperCase()}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              {userId && (
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md font-mono select-all" title={t('your_user_id')}>
                  ID: {userId}
                </span>
              )}
              <Button variant="secondary" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                {t('logout')}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="secondary">{t('login')}</Button>
              </Link>
              <Link to="/register">
                <Button>{t('register')}</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
