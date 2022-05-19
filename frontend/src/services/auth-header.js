const authHeader = () => {

  const getLocalStorageItemName = () => {
    if (window.location.origin === "http://localhost:3000" || window.location.origin === "http://127.0.0.1:3000") {
      return "user_dev";
    } else {
      return "user_prod";
    }
  }

  const user = JSON.parse(localStorage.getItem(getLocalStorageItemName()));

  if (user && user.key) {
    return { Authorization: 'Token ' + user.key };
  } else {
    return {};
  }
}

export default authHeader;