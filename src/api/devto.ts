import axios from 'axios';

import { Article, PublishedArticle } from '$/types';

const MAX_TAGS = 4;

export async function createArticle(apiKey: string, article: Article): Promise<PublishedArticle> {
  const result = (
    await axios.post(
      'https://dev.to/api/articles',
      {
        article: {
          title: article.config.title,
          body_markdown: article.content,
          published: true,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          tags: article.config.tags!.slice(0, MAX_TAGS),
          description: article.config.description,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
      },
    )
  ).data as PublishedArticle;
  return result;
}
