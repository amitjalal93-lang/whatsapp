import { setAccessTokenLocalStorage } from "./localstorage.service";
import {
  apiGetRequestAuthenticated,
  apiPostRequest,
  apiPutRequestAuthenticated,
} from "./url.service";

export const sendOtp = async (phoneNumber, phonePrefix, email) => {
  try {
    const responce = await apiPostRequest("/auth/send-otp", {
      phoneNumber,
      phonePrefix,
      email,
    });
    return responce.data;
  } catch (error) {
    throw error.responce ? error.responce.data : error.message;
  }
};

export const verifyOtp = async (phoneNumber, phonePrefix, otp, email) => {
  try {
    const responce = await apiPostRequest("/auth/verify-otp", {
      phoneNumber,
      phonePrefix,
      otp,
      email,
    });

    setAccessTokenLocalStorage(responce?.data?.data?.token);
    return responce.data;
  } catch (error) {
    throw error.responce ? error.responce.data : error.message;
  }
};

export const updateUserProfile = async (updateData) => {
  try {
    const responce = await apiPutRequestAuthenticated(
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
    const responce = await apiGetRequestAuthenticated("/auth/check-auth");
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
    const responce = await apiGetRequestAuthenticated("/auth/logout");
    return responce.data;
  } catch (error) {
    throw error.responce ? error.responce.data : error.message;
  }
};

export const getAllUsers = async () => {
  try {
    const responce = await apiGetRequestAuthenticated("/auth/users");
    return responce.data;
  } catch (error) {
    throw error.responce ? error.responce.data : error.message;
  }
};
