export function formatUser(user: any, token: string) {
  return {
    email: user.email,
    username: user.username,
    bio: user.bio,
    image: user.image,
    token,
  };
}
