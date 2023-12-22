const users = [];

const addUser = ({ id, email }) => {
  if (!email) {
    return {
      error: "Email is required",
    };
  }
  const existingUser = users.find((user) => {
    return user.email === email;
  });

  if (existingUser) {
    return {
      error: "Email in use",
    };
  }

  const user = { id, email };
  users.push(user);
  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

const getUser = (id) => {
  return users.find((user) => user.id === id);
};

module.exports = {
  addUser,
  removeUser,
  getUser,
};
