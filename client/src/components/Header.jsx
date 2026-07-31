import { FaDice } from 'react-icons/fa';
import ColorTheme  from './Layout/Header/ColorThemes';
import ProfileCard from './Layout/Header/ProfileCard';

const Header = () => {
  return (
    <header className="flex px-2 sticky z-50" style={{top: 0}}>
      <a href="/" title="Logo of the page" id="logo" className="p-1 m-2 text-4xl"><FaDice /></a>
      <ul className="flex items-center grow justify-items-end list-none">
        <li>tekst</li>
        <li>tekst2</li>
        <ColorTheme />
        <ProfileCard />
      </ul>
    </header>
  );
};

export default Header;