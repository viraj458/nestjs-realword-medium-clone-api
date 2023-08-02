export function formatAuthor(author: any, userId?: number) {
  const isFollowing =
    userId !== null
      ? author.following.some((user) => {
          return user.id === userId;
        })
      : false;

  return {
    username: author.username,
    bio: author.bio,
    image: author.image,
    following: isFollowing,
  };
}

export function formatArticle(article: any, userId?: number) {
  const favoriteCount = article.favoritedBy.length;
  const isFavorited =
    userId !== null
      ? article.favoritedBy.some((user) => user.id === userId)
      : false;
  const formattedAuthor = formatAuthor(article.author, userId);
  const formattedTags = article.tags.map((tag: any) => tag.name);

  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: formattedTags,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    author: formattedAuthor,
    favorited: isFavorited,
    favoritesCount: favoriteCount,
  };
}

export function formatComment(comment: any, userId?: number) {
  const formattedAuthor = formatAuthor(comment.author, userId);

  return {
    id: comment.id,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    body: comment.body,
    author: formattedAuthor,
  };
}
