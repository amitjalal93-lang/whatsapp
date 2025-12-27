import { useState } from "react";
import useLoginStore from "../../store/useLoginStore";
import countries from "../../utils/countries";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { avatars } from "../../utils/avatars.js";

import { toast } from "react-toastify";
import useUserStore from "../../store/useUserSrore";
import useThemeStore from "../../store/themeStore";
import { motion } from "framer-motion";
import { FaChevronDown, FaUser, FaWhatsapp } from "react-icons/fa";
import {
  sendOtp,
  updateUserProfile,
  verifyOtp,
} from "../../services/user.service.js";
import Spinner from "../../utils/Spinner.jsx";
// validation schema

const loginValidationSchema = yup
  .object()
  .shape({
    phoneNumber: yup
      .string()
      .nullable()
      .matches(/^[0-9]{10}$/, {
        message: "Invalid phone number",
        excludeEmptyString: true, // ⭐ IMPORTANT
      }),
    email: yup
      .string()
      .nullable()
      .email("Please enter valid email")
      .transform((value) => (value === "" ? null : value)),
  })
  .test(
    "at-least-one-character",
    "Either email or phone number is required",
    function (value) {
      return !!(value?.phoneNumber || value?.email);
    }
  );
const otpValidationSchema = yup.object().shape({
  otp: yup
    .string()
    .length(6, "otp must be 6 digit")
    .required("otp is required"),
});

const profileValidationSchema = yup.object().shape({
  username: yup.string().required("username is required"),
  agreed: yup
    .bool()
    .oneOf([true], "You must agree to the terms and conditions"),
});
const Login = () => {
  const { step, setStep, setUserPhoneData, userPhoneData, resetLoginState } =
    useLoginStore();
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const { theme } = useThemeStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const {
    register: loginRegister,
    handleSubmit: loginHandleSubmit,
    formState: { errors: loginErrors },
  } = useForm({
    resolver: yupResolver(loginValidationSchema),
  });

  const {
    handleSubmit: handleOtpSubmit,
    formState: { errors: OtpErrors },
    setValue: setOtpValue,
  } = useForm({
    resolver: yupResolver(otpValidationSchema),
  });

  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    watch,
  } = useForm({
    resolver: yupResolver(profileValidationSchema),
  });
  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.dialCode.includes(searchTerm)
  );

  const onLoginSubmit = async (data) => {
    const { phoneNumber, email } = data;
    try {
      setLoading(true);
      if (email) {
        const responce = await sendOtp(null, null, email);
        if (responce.status === "success") {
          toast.info("otp has been sent to your email");
          setUserPhoneData({ email });
          setStep(2);
        }
      } else {
        const responce = await sendOtp(phoneNumber, selectedCountry.dialCode);
        if (responce.status === "success") {
          toast.info("otp has been sent to your phone");
          setUserPhoneData({
            phoneNumber,
            phoneSuffix: selectedCountry.dialCode,
          });
          setStep(2);
        }
      }
    } catch (error) {
      console.log(error);
      setError(error.message || "failed to send otp ");
    } finally {
      setLoading(false);
    }
  };

  //
  const onOtpSubmit = async () => {
    try {
      setLoading(true);
      if (!userPhoneData) {
        throw new Error("phone number or email is missing");
      }
      const otpString = otp.join("");
      let responce;
      if (userPhoneData?.email) {
        responce = await verifyOtp(null, null, otpString, userPhoneData.email);
      } else {
        responce = await verifyOtp(
          userPhoneData.phoneNumber,
          userPhoneData.phoneSuffix,
          otpString
        );
      }

      if (responce.status === "success") {
        toast.success("otp verified successfully");
        const user = responce.data?.user;
        if (user?.username && user?.profilePicture) {
          setUser(user);
          toast.success("Welcome back to watsapp");
          navigate("/");
          resetLoginState();
        }
      }
    } catch (error) {
      console.log(error);
      setError(error.message || "failed to verify otp ");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      setProfilePicture(URL.createObjectURL(file));
    }
  };

  const onProfileSubmit = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("agreed", data.agreed);

      if (profilePictureFile) {
        formData.append("media", profilePictureFile);
      } else {
        formData.append("profilePicture", selectedAvatar);
      }
      await updateUserProfile(formData);
      toast.success("welcome to watsapp");
      navigate("/");
      resetLoginState();
    } catch (error) {
      console.log(error);
      setError(error.message || "failed to update user profile");
    } finally {
      setLoading(false);
    }
  };

  //
  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpValue(newOtp.join(""));
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const ProgressBar = () => (
    <div
      className={`w-full rounded-full h-2.5 mb-6 ${
        theme === "dark" ? "bg-gray-700" : "bg-gray-200"
      }`}
    >
      <div
        className=" bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
        style={{ width: `${(step / 3) * 100}%` }}
      ></div>
    </div>
  );

  const handleBack = () => {
    setStep(1);
    setUserPhoneData(null);
    setOtp(["", "", "", "", "", ""]);
    setError("");
  };

  console.log("errors", loginErrors);

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-gray-900"
          : "bg-linear-to-br from-green-500 to-blue-500 "
      } flex items-center justify-center p-4 overflow-hidden`}
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`${
          theme === "dark" ? "bg-gray-900: text-white " : "bg-white  "
        } p-6 md:p-8 rounded-lg shadow-lg w-full max-w-md relative z-10}`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.2,
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="flex  items-center justify-center w-24 h-24 bg-green-500 rounded-full mx-auto mb-6 "
        >
          <FaWhatsapp size={48} className="text-white w-16 h-16 " />
        </motion.div>
        <h1
          className={`${
            theme === "dark" ? "text-white" : "text-gray-900"
          } text-2xl font-semibold mb-6`}
        >
          watsapp login
        </h1>
        <ProgressBar />
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {step === 1 && (
          <form
            className="space-y-4"
            onSubmit={loginHandleSubmit(onLoginSubmit)}
          >
            <p
              className={`text-center mb-4 ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Enter your phone number to receive an otp
            </p>

            <div className="relative">
              <div className="flex">
                <div className="relative w-1/3">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    type="button"
                    className={`shrink-0 z-10 inline-flex
   items-center py-2.5 px-4 text-sm font-medium text-center 
   ${
     theme === "dark"
       ? "text-white bg-gray-700 border-gray-600"
       : "text-gray-900 bg-gray-100 border-gray-300"
   } 
   border rounded-s-lg  hover:bg-gray-200 focus:right-4 focus:outline-none focus:ring-gray-100 }`}
                  >
                    <span>
                      {selectedCountry.flag}
                      {selectedCountry.dial_code}
                    </span>
                    <FaChevronDown className="ml-2" />
                  </button>
                  {showDropdown && (
                    <div
                      className={`absolute z-10 w-full mt-1 
        ${
          theme === "dark"
            ? "bg-gray-700 border-gray-600"
            : "bg-white border-gray-300"
        }
       border rounded-md shadow-lg mx-h-60 overflow-auto `}
                    >
                      <div
                        className={`sticky top-0 ${
                          theme === "dark" ? "bg-gray-700 " : "bg-white"
                        } p-2`}
                      >
                        <input
                          type="text"
                          placeholder="search country"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`w-full px-2 py- border ${
                            theme === "dark"
                              ? "bg-gray-600 border-gray-500 text-white"
                              : "bg-white border-gray-300"
                          } rounded-md text-sm focus:outline-none focus:right-2 focus:ring-green-500`}
                        />
                      </div>
                      {filteredCountries.map((country) => (
                        <button
                          key={country.alpha2}
                          type="button"
                          className={`w-full text-left px-3 py-2 ${
                            theme === "dark"
                              ? "bg-gray-600  "
                              : "hover:bg-gray-100"
                          }   focus:outline-none focus:bg-gray-100`}
                          onClick={() => {
                            setSelectedCountry(country);
                            setShowDropdown(false);
                          }}
                        >
                          {country.flag}({country.dialCode}) {country.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  {...loginRegister("phoneNumber")}
                  placeholder="phone number"
                  className={`w-2/3 px-4 py-2 border ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white  border-gray-300"
                  }  rounded-md  focus:outline-none focus:right-2 focus:ring-green-500 ${
                    loginErrors.phoneNumber ? "border-red-500" : ""
                  }`}
                />
              </div>
              {loginErrors.phoneNumber && (
                <p className="text-red-500 text-sm">
                  {loginErrors.phoneNumber.message}
                </p>
              )}
            </div>
            {/* diverder with or */}
            <div className="flex items-center my-4">
              <div className="grow h-px bg-gray-200" />
              <span className="mx-3 text-sm font-medium">or</span>
              <div className="grow h-px bg-gray-200" />
            </div>
            {/* email input box */}
            <div
              className={`flex items-center border rounded-md px-3 py-2 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600"
                  : "bg-white  border-gray-300"
              }
   `}
            >
              <FaUser
                className={`mr-2 text-gray-400 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              />
              <input
                type="email"
                {...loginRegister("email")}
                placeholder="email (optional)"
                className={`w-full bg-transparent focus:outline-none
 ${theme === "dark" ? " text-white" : "bg-black"} 
  
  ${loginErrors.email ? "border-red-500" : ""}`}
              />
              {loginErrors.email && (
                <p className="text-red-500 text-sm">
                  {loginErrors.email.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition "
            >
              {loading ? <Spinner /> : "send otp"}
            </button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-4">
            <p
              className={`text-center ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-4`}
            >
              Please enter the 6-digit code sent to your{" "}
              {userPhoneData ? userPhoneData.phoneSuffix : "email"}
              {userPhoneData.phoneNumber && userPhoneData?.phoneNumber}
            </p>
            <div>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className={`w-12 h-12 text-center border  ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    OtpErrors.otp ? "border-red-500" : ""
                  } `}
                />
              ))}
            </div>
            {OtpErrors.otp && (
              <p className="text-red-500 text-sm">{OtpErrors.otp.message}</p>
            )}

            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition"
            >
              {loading ? <Spinner /> : "Vrify otp"}
            </button>

            <button
              type="button"
              onClick={handleBack}
              className={`w-full mt-2 ${
                theme === "dark"
                  ? "bg-gray-700 text-gray-300"
                  : "text-gray-700 bg-gray-200"
              } rounded-md py-2 hover:bg-gray-300 transition flex items-center justify-center`}
            >
              <FaArrowLeft className="mr-2" />
              Worng number ? Go back
            </button>
          </form>
        )}

        {step === 3 && (
          <form
            onSubmit={handleProfileSubmit(onProfileSubmit)}
            className="space-y-4"
          >
            <div className="flex flex-col items-center mb-4">
              <div className="relative w-24 h-24 mb-2">
                <img
                  src={profilePicture || selectedAvatar}
                  alt="profile"
                  className="w-full h-full rounded-full object-cover"
                />
                <label
                  htmlFor="profile picture"
                  className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full cursor-pointer hover:bg-green-600 transition duration-300"
                >
                  <FaPlus className="w-4 h-4 " />
                </label>
                <input
                  type="file"
                  id="profile picture"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <p
                className={`text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-500"
                } mb-2`}
              >
                Choose an avatar
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {avatars.map((avatar, index) => (
                  <img
                    key={index}
                    src={avatar}
                    alt={`avatar-${index + 1}`}
                    className={`w-12 h-12 rounded-full cursor-pointer transition duration-300 ease-in-out transform hover:scale-110 ${
                      selectedAvatar === avatar ? "ring-2 ring-green-500" : ""
                    }`}
                    onClick={() => setSelectedAvatar(avatar)}
                  />
                ))}
              </div>
            </div>

            <div className="relative">
              <FaUser
                className={`absolute top-1/2 left-3 transform -translate-y-1/2 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              />
              <input
                type="text"
                {...profileRegister("username")}
                placeholder="Username"
                className={`w-full pl-10 pr-3 py-2 border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                } rounded-md focus:outline-none focus:ring-2 text-lg focus:ring-green-500   `}
              />
              {profileErrors.username && (
                <p className="text-red-500 text-sm mt-10">
                  {profileErrors.username.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                {...profileRegister("agreed")}
                type="checkbox"
                className={`rounded ${
                  theme === "dark"
                    ? "text-green-500 bg-gray-700"
                    : "text-green-500 "
                }  focus:ring-green-500 `}
              />
              <label
                htmlFor="terms"
                className={`text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                I agree to the
                <a href="#" className="text-red-500 hover:underline">
                  Thrms and Conditions
                </a>
              </label>
            </div>
            {profileErrors.agreed && (
              <p className="text-red-500 text-sm mt-1">
                {profileErrors.agreed.message}
              </p>
            )}

            <button
              type="submit"
              disabled={!watch("agreed") || loading}
              className={`w-full bg-green-500 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-lg
${loading ? "opacity-50 cursor-not-allowed" : ""} `}
            >
              {loading ? <Spinner /> : "Create Profile"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
