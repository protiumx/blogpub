import axios from 'axios';

import { PublishStatus, createArticle } from '$/api/medium';
import { MediumLicense } from '$/types';

jest.mock('axios');

describe('medium client', () => {
  beforeEach(jest.clearAllMocks);

  it('should create published article and return new url', async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: { data: { url: 'medium/new' } },
    });
    const published = await createArticle('token', 'medium.com', 'user', {
      config: {
        title: 'New',
        license: MediumLicense.CC40Zero,
        tags: ['one', 'two', 'three', 'four', 'five', 'six'],
        published: true,
        canonicalUrl: 'http://anotherblog.com',
      },
      content: 'Content',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(axios.post).toHaveBeenCalledWith(
      'medium.com/users/user/posts',
      {
        title: 'New',
        contentFormat: 'markdown',
        content: 'Content',
        license: MediumLicense.CC40Zero,
        tags: ['one', 'two', 'three', 'four', 'five'],
        canonicalUrl: 'http://anotherblog.com',
        publishStatus: PublishStatus.Public,
      },
      {
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
      },
    );
    expect(published).toEqual({ url: 'medium/new' });
  });

  it('should create non published article and return new url', async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: { data: { url: 'medium/new' } },
    });
    const published = await createArticle('token', 'medium.com', 'user', {
      config: {
        tags: '',
        published: false,
      },
      content: 'Content',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(axios.post).toHaveBeenCalledWith(
      'medium.com/users/user/posts',
      expect.objectContaining({
        publishStatus: PublishStatus.Draft,
      }),
      expect.anything(),
    );
    expect(published).toEqual({ url: 'medium/new' });
  });
});
