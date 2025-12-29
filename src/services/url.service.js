import axios from "axios";
import { getAccessTokenLocalStorage } from "./localstorage.service";
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    accept: "application/json",
    "Allowed-State": "na",
  },
});

// with token
const AUTHENTICATED_API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    accept: "application/json",
    "Allowed-State": "na",
  },
});

const FILE_API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "multipart/form-data",
    accept: "application/json",
  },
});

// with token
const AUTHENTICATED_FILE_API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

// Axios interceptor to refresh token when expired
AUTHENTICATED_API.interceptors.request.use(
  async (config) => {
    const token = getAccessTokenLocalStorage() || "";
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Axios interceptor to refresh token when expired
AUTHENTICATED_FILE_API.interceptors.request.use(
  async (config) => {
    const token = getAccessTokenLocalStorage();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      return Promise.reject();
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const apiGetRequest = async (path) => {
  return API.get(path);
};

export const apiPostRequest = async (path, postData) => {
  return API.post(path, postData);
};

export const apiPutRequest = async (path, postData) => {
  return API.put(path, postData);
};

export const apiGetRequestAuthenticated = async (path) => {
  return AUTHENTICATED_API.get(path);
};

export const apiPostRequestAuthenticated = async (path, postData) => {
  return AUTHENTICATED_API.post(path, postData);
};

export const apiPutRequestAuthenticated = async (path, postData) => {
  return AUTHENTICATED_API.put(path, postData);
};

export const apiFilePostRequest = async (path, postData) => {
  return FILE_API.post(path, postData);
};

export const apiFilePostRequestAuthenticated = async (path, postData) => {
  return AUTHENTICATED_FILE_API.post(path, postData);
};

export const apiFilePutRequestAuthenticated = async (path, postData) => {
  return AUTHENTICATED_FILE_API.put(path, postData);
};

export const apiDeleteRequestAuthenticated = async (path, postData) => {
  return AUTHENTICATED_API.delete(path, postData);
};
