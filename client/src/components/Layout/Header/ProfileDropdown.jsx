const ProfileDropdown = ({ userInfo, onLogout }) => {
  return (
    <div className="absolute right-0 mt-2 w-52 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-lg z-50">
      <div className="mb-2 border-b border-gray-100 pb-2">
        <p className="text-xl font-semibold text-gray-800">{userInfo.username.charAt(0).toUpperCase() + userInfo.username.slice(1)}</p>
        <p className="text-lg text-gray-500">{userInfo.email}</p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="w-full rounded-md border border-red-300 bg-red-600 px-3 py-2 text-lg font-semibold text-white shadow-sm transition hover:bg-red-700 hover:text-white cursor-pointer"
      >
        Log out
      </button>
    </div>
  );
};

export default ProfileDropdown;