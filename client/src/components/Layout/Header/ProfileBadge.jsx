import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';
import api from '@/api';

const ProfileBadge = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const refreshUserInfo = () => {
    api.get('/verify-token')
      .then((response) => {
        setUserInfo(response.data.user || null);
      })
      .catch(() => {
        setUserInfo(null);
      });
  };

  useEffect(() => {
    refreshUserInfo();
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('[data-profile-card]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/logout');
      setUserInfo(null);
      setIsOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  if (!userInfo) {
    return (
      <li className="ml-2">
        <Link to="/login" className="text-gray-700 hover:text-gray-900">
          Login
        </Link>
      </li>
    );
  }

  const initials = userInfo.username?.[0]?.toUpperCase();

  return (
    <li className="relative ml-2 flex items-center justify-center" data-profile-card>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="bg-green-500 text-white rounded-full w-12 h-12 inline-flex place-items-center place-content-center text-lg cursor-pointer shadow-sm hover:bg-green-600 transition"
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          {initials}
        </button>

        {isOpen && (
          <ProfileDropdown userInfo={userInfo} onLogout={handleLogout} />
        )}
      </div>
    </li>
  );
};

export default ProfileBadge;