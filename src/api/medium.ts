import axios from 'axios';

import { Article, PublishedArticle } from '$/types';

const MAX_TAGS = 5;

interface PostArticleResponse {
  data: PublishedArticle;
}

export enum PublishStatus {
  Public = 'public',
  Draft = 'draft',
  Unlisted = 'unlisted',
}

export async function createArticle(
  token: string,
  baseUrl: string,
  userId: string,
  article: Article,
): Promise<PublishedArticle> {
  const result = (
    await axios.post(
      `${baseUrl}/users/${userId}/posts`,
      {
        title: article.config.title,
        contentFormat: 'markdown',
        content: article.content,
        license: article.config.license,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        tags: article.config.tags!.slice(0, MAX_TAGS),
        publishStatus: PublishStatus.Public,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
  ).data as PostArticleResponse;
  return result.data;
}
