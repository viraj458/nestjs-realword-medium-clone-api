export function formatAuthor(author: any) {
  return {
    username: author.username,
    bio: author.bio,
    image: author.image,
  };
}

export function formatArticle(article: any) {
  const favoriteCount = article.favoritedBy.length;
  const isFavorited = favoriteCount > 0;
  const formattedAuthor = formatAuthor(article.author);
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

export function formatComment(comment: any) {
  const formattedAuthor = formatAuthor(comment.author);

  return {
    id: comment.id,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    body: comment.body,
    author: formattedAuthor,
  };
}
