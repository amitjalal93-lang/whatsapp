import axiosInstance from "./url.service";

export const sendOtp = async (phoneNumber, phoneSuffix, email) => {
  try {
    const responce = await axiosInstance.post("/auth/send-otp", {
      phoneNumber,
      phoneSuffix,
      email,
    });
    return responce.data;
  } catch (error) {
    throw error.responce ? error.responce.data : error.message;
  }
};

export const verifyOtp = async (phoneNumber, phoneSuffix, otp, email) => {
  try {
    const responce = await axiosInstance.post("/auth/verify-otp", {
      phoneNumber,
      phoneSuffix,
      otp,
      email,
    });
    return responce.data;
  } catch (error) {
    throw error.responce ? error.responce.data : error.message;
  }
};

export const updateUserProfile = async (updateData) => {
  try {
    const responce = await axiosInstance.put(
      "/auth/update-profile",
      updateData
    );
    return responce.data;
  } catch (error) {
    throw error.responce ? error.responce.data : error.message;
  }
};

export const checkUserAuth = async () => {
  try {
    const responce = await axiosInstance.get("/auth/check-auth");
    if (responce.data.status === "success") {
      return { isAuthenticated: true, user: responce?.data?.data };
    } else if (responce.data.status === "error") {
      return { isAuthenticated: false };
    }
  } catch (error) {
    throw error.responce ? error.responce.data : error.message;
  }
};

export const logoutUser = async () => {
  try {
    const responce = await axiosInstance.get("/auth/logout");
    return responce.data;
  } catch (error) {
    throw error.responce ? error.responce.data : error.message;
  }
};

export const getAllUsers = async () => {
  try {
    const responce = await axiosInstance.get("/auth/users");
    return responce.data;
  } catch (error) {
    throw error.responce ? error.responce.data : error.message;
  }
};
