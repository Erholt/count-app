import { FaCrow } from 'react-icons/fa';
import ColorTheme from './Layout/Header/ColorThemes';

const Header = () => {
  return (
    <header className="flex px-2 sticky z-50" style={{top: 0}}>
      <a href="/" title="Logo of the page" id="logo" className="p-1 m-2 text-4xl"><FaCrow /></a>
      <ul className="flex items-center grow justify-items-end">
        <li>Om mig</li>
        <li>Projekter</li>
        <ColorTheme />
      </ul>
    </header>
  );
};

export default Header;