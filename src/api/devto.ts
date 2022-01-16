import axios from 'axios';

import { Article, PublishedArticle } from '$/types';

const MAX_TAGS = 4;

export async function createArticle(
  apiKey: string,
  { config, content }: Article,
): Promise<PublishedArticle> {
  const payload = {
    article: {
      title: config.title,
      body_markdown: content,
      published: config.published,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      tags: config.tags!.split(/,\s*/).slice(0, MAX_TAGS),
      description: config.description,
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
