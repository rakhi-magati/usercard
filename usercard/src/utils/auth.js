export const getRole = () => {
  return localStorage.getItem(
    "role"
  );
};

export const isLoggedIn = () => {
  return !!localStorage.getItem(
    "token"
  );
};