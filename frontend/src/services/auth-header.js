export default function authHeader() {
    const user = JSON.parse(localStorage.getItem("user"));
  
    if (user && user.key) {
      // return { Authorization: 'Bearer ' + user.accessToken };
      return { "x-auth-token": user.key };
    } else {
      return {};
    }
  }