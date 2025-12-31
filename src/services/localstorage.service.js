export const getAccessTokenLocalStorage = () => {
  return localStorage.getItem("auth_token");
};

export const setAccessTokenLocalStorage = (token) => {
  localStorage.setItem("auth_token", token);
};

export const getUserLocalStorage = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const setUserLocalStorage = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};
