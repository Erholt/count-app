import { useEffect, useState } from 'react';
import { FaPalette } from 'react-icons/fa';
import api from '@/api';

const Profile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    api.get('/verify-token')
      .then((response) => {
        setUserInfo(response.data.user || null);
      })
      .catch(() => {
        setUserInfo(null);
      });
  }, []);

  useEffect(() => {
    document.body.classList.remove('dark-theme');

    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  if (!userInfo) {
    return (
      <div className="min-h-[calc(100vh-4rem)] w-full px-4 py-8 flex items-center justify-center">
        <p className="text-gray-600">Cannot load user info.</p>
      </div>
    );
  }

  return (
    <div className="profile-page min-h-[calc(100vh-4rem)] w-full px-4 py-8 flex">
      <div className="profile-page__content flex flex-1 flex-col lg:flex-row gap-6 w-full">
        <div className="profile-page__sidebar flex w-full max-w-md flex-col gap-6">
          <aside id="user-info" className="profile-card rounded-lg border p-6 h-full shadow-md backdrop-blur-sm">
            <h2 className="text-2xl font-semibold">{userInfo.username}</h2>
            <div className="mb-4">
              <p className="">{userInfo.email}</p>
            </div>
          </aside>

          <aside className="profile-card rounded-lg border p-6 h-full shadow-md backdrop-blur-sm">
            <h2 className="profile-card__title text-2xl font-semibold">Preferences</h2>
            <h3 className="profile-card__subtitle mt-4 text-lg font-semibold">Themes</h3>
            <p className="profile-card__text">Select your preferred theme.</p>
            <label className="profile-card__label mt-3 block text-sm font-medium" htmlFor="theme-select">
              Theme
            </label>
            <div className="profile-select mt-1 flex items-center gap-2 rounded-md border px-3 py-2">
              <FaPalette className="profile-select__icon" />
              <div className="relative w-full">
                <select
                  id="theme-select"
                  value={theme}
                  onChange={(event) => setTheme(event.target.value)}
                  className="profile-select__control w-full appearance-none bg-transparent pr-6 text-sm font-medium outline-none"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
                <span className={`pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-xs`}>▾</span>
              </div>
            </div>
          </aside>
        </div>

        <div className="profile-card w-full rounded-lg border p-6 self-stretch shadow-md backdrop-blur-sm min-h-full">
          <h2 className="mb-2 text-xl font-semibold">Welcome back</h2>
          <p className="">This is your profile page, showing the authenticated user information.</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;