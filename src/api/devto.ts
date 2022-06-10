import axios from 'axios';

import { Article, PublishedArticle } from '$/types';

const MAX_TAGS = 4;

export async function createArticle(
  apiKey: string,
  { config, content }: Article,
): Promise<PublishedArticle> {
  const payload = {
    article: {
      body_markdown: content,
      description: config.description,
      published: config.published,
      title: config.title,
      tags: (config.tags as string[]).slice(0, MAX_TAGS),
    },
  };
  const result = (
    await axios.post('https://dev.to/api/articles', payload, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
    })
  ).data as PublishedArticle;
  return result;
}
