export function formatUser(profile: any, isFollowing: boolean) {
  return {
    username: profile.username,
    bio: profile.bio,
    image: profile.image,
    following: isFollowing,
  };
}
