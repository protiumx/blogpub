import axios from 'axios';

import { PublishStatus, createArticle } from '$/api/medium';
import { MediumLicense } from '$/types';

jest.mock('axios');

describe('medium client', () => {
  it('should create article and return new url', async () => {
    (axios.post as jest.Mock).mockResolvedValue({ data: { url: 'medium/new' } });
    const url = await createArticle('token', 'medium.com', 'user', {
      config: { title: 'New', license: MediumLicense.CC40Zero, tags: [] },
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
        tags: [],
        publishStatus: PublishStatus.Public,
      },
      {
        headers: {
          Authorization: 'Bearer token',
        },
      },
    );
    expect(url).toEqual('medium/new');
  });
});