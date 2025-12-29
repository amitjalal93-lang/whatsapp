import React, { useState } from "react";
import useThemeStore from "../../store/themeStore";
import { logoutUser } from "../../services/user.service";
import { toast } from "react-toastify";
import useUserStore from "../../store/useUserStore";

const Setting = () => {
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const { theme } = useThemeStore();
  const { user, clearUser } = useUserStore();
  const toggleThemeDialog = () => setIsThemeDialogOpen(!isThemeDialogOpen);

  const handleLogout = async () => {
    try {
      await logoutUser();
      clearUser();
      toast.success("user Logged out successfully");
    } catch (error) {
      console.log("fallied to logout user", error);
    }
  };

  return (
    <Layout
      isThemeDialogOpen={isThemeDialogOpen}
      toggleThemeDialog={toggleThemeDialog}
    >
      <div
        className={`flex h-screen ${
          theme === "dark"
            ? "bg-[#rgb(17,27,33)] text-white"
            : "bg-white text-black"
        }`}
      >
        <div
          className={`w-100 border-r ${
            theme === "dark" ? "border-gray-600" : "border-gray-200"
          }`}
        >
          <div className="p-4">
            <h1 className="text-2xl font-semibold mb-4">Settings</h1>

            <div className="relative mb-4">
              <FaSearch className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search settings"
                className={`w-full 
              ${
                theme === "dark"
                  ? "bg-[#202c33] text-white"
                  : "bg-gray-100 text-black"
              } border-none pl-10 placeholder:gray-400 rounded p-2`}
              />
            </div>

            <div
              className={`flex items-center gap-4 p-3 rounded cursor-pointer mb-4 ${
                theme === "dark"
                  ? "hover:bg-[#202c33] "
                  : "hover:bg-gray-100 text-black"
              }`}
            >
              <img
                src={user.profilePicture}
                alt="profile"
                className="w-14 h-14 rounded-full"
              />

              <div>
                <h1 className="font-semibold">{user?.username}</h1>
                <p className="text-sm text-gray-400">{user?.about}</p>
              </div>
            </div>

            {/* menu items */}
            <div className="h-[calc(100vh-280px)] overflow-y-auto">
              <div className="space-y-1">
                {[
                  { icon: <FaUser />, lable: "Account", href: "/user-profile" },
                  { icon: <FaComment />, lable: "Chats", href: "/" },
                  {
                    icon: <FaQusestionCircle />,
                    lable: "Help",
                    href: "/help",
                  },
                ].map((item) => (
                  <Link
                    to={item.href}
                    key={item.lable}
                    className={`w-full flex items-center gap-3 p-2 rounded 
                ${
                  theme === "dark"
                    ? " text-white hover:bg-[#202c33] "
                    : "hover:bg-gray-100 text-black"
                }`}
                  >
                    <item.icon className="w-5 h-5" />

                    <div
                      className={`border-b ${
                        theme === "dark" ? "border-gray-700" : "border-gray-200"
                      } w-full p-4`}
                    >
                      {item.lable}
                    </div>
                  </Link>
                ))}
                {/* theme button */}
                <button
                  onClick={toggleThemeDialog}
                  className={`w-full flex items-center gap-3 p-2 rounded ${
                    theme === "dark"
                      ? " text-white hover:bg-[#202c33] "
                      : "hover:bg-gray-100 text-black"
                  }`}
                >
                  {theme === "dark" ? (
                    <FaMoon className="w-5 h-5" />
                  ) : (
                    <FaSun className="w-5 h-5" />
                  )}
                  <div
                    className={`flex flex-col text-start border-b 
                    ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    } w-full p-2`}
                  >
                    Theme{" "}
                    <span className="mt-auto text-sm text-gray-400">
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </span>
                  </div>
                </button>
              </div>

              <button
                className={`w-ful flex items-center gap-3 p-2 rounded text-red-500
                ${
                  theme === "dark"
                    ? " text-white hover:bg-[#202c33] "
                    : "hover:bg-gray-100 text-black"
                } mt-10 md:mt-36`}
                onClick={handleLogout}
              >
                <FaSignInAlt className="w-5 h-5" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Setting;
