import { useEffect, useState } from 'react';
import api from '@/api';

const ProfileCard = () => {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    api.get('/verify-token')
      .then((response) => {
        setUserInfo(response.data.user || null);
      })
      .catch(() => {
        setUserInfo(null);
      });
  }, []);

  if (!userInfo) {
    return null;
  }

  return (
    <li className="flex items-center justify-center ml-2">
      <div>
        <span className="bg-green-500 text-white rounded-full w-12 h-12 inline-flex place-items-center place-content-center text-lg cursor-pointer">
          {userInfo.username[0].toUpperCase()}
        </span>
      </div>
    </li>
  );
};

export default ProfileCard;