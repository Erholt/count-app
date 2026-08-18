import { FaDice } from 'react-icons/fa';
import ProfileBadge from './Layout/Header/ProfileBadge';

const Header = () => {
  return (
    <header className="flex h-16 px-4 sticky z-50" style={{top: 0}}>
      <a href="/" title="Logo of the page" id="logo" className="p-1 m-2 text-4xl"><FaDice /></a>
      <ul className="flex items-center grow justify-items-end list-none justify-end">
        <ProfileBadge />
      </ul>
    </header>
  );
};

export default Header;