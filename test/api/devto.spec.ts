import axios from 'axios';

import { createArticle } from '$/api/devto';

jest.mock('axios');

describe('dev.to client', () => {
  beforeEach(jest.clearAllMocks);

  it('should create article and return new url', async () => {
    (axios.post as jest.Mock).mockResolvedValue({ data: { url: 'dev.to/new' } });
    const published = await createArticle('apiKey', {
      config: {
        title: 'New',
        tags: ['one', 'two', 'three', 'four', 'five'],
        description: 'description',
      },
      content: 'Content',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(axios.post).toHaveBeenCalledWith(
      'https://dev.to/api/articles',
      {
        article: {
          title: 'New',
          description: 'description',
          body_markdown: 'Content',
          tags: ['one', 'two', 'three', 'four'],
          published: true,
        },
      },
      {
        headers: {
          'api-key': 'apiKey',
        },
      },
    );
    expect(published).toEqual({ url: 'dev.to/new' });
  });
});
