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
  { config, content }: Article,
): Promise<PublishedArticle> {
  const payload = {
    title: config.title,
    contentFormat: 'markdown',
    content: content,
    license: config.license,
    tags: (config.tags as string[]).slice(0, MAX_TAGS),
    canonicalUrl: config.canonicalUrl,
    publishStatus: config.published ? PublishStatus.Public : PublishStatus.Draft,
  };
  const result = (
    await axios.post(`${baseUrl}/users/${userId}/posts`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  ).data as PostArticleResponse;
  return result.data;
}
