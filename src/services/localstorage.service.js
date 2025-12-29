export const getAccessTokenLocalStorage = () => {
  return localStorage.getItem("accessToken");
};

export const setAccessTokenLocalStorage = (token) => {
  localStorage.setItem("accessToken", token);
};

export const getUserLocalStorage = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const setUserLocalStorage = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};
