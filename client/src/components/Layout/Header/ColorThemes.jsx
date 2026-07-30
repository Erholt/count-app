import { FaLightbulb } from 'react-icons/fa';

const ColorTheme = () => {
  return (
    <li>
      <button type="button" title="Change the background theme" id="theme" className="p-1 m-2 text-2xl" onClick={ console.log("hello world") }>
        <FaLightbulb />
      </button>
    </li>
  );
};

export default ColorTheme;