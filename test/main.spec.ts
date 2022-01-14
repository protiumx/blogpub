import * as core from '@actions/core';
import { getOctokit } from '@actions/github';
import { promises } from 'fs';

import { createArticle } from '$/api/medium';
import { run } from '$/main';
import { parseArticle } from '$/parser';

const octokitMock = {
  rest: {
    pulls: {
      listFiles: jest.fn(),
    },
  },
};
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));
jest.mock('$/api/medium');
jest.mock('$/parser');
jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'owner',
      repo: 'repo',
    },
    issue: {
      number: 10,
    },
  },
  getOctokit: jest.fn(),
}));
jest.mock('@actions/core');

describe('blogpub', () => {
  beforeEach(jest.clearAllMocks);

  (getOctokit as jest.Mock).mockReturnValue(octokitMock);

  it('should set failed when fails to get PR info', async () => {
    const err = new Error('github');
    octokitMock.rest.pulls.listFiles.mockRejectedValue(err);

    await run();

    expect(octokitMock.rest.pulls.listFiles).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 10,
    });
    expect(core.setFailed).toHaveBeenCalledWith(err);
  });

  it('should set failed if no markdown files found', async () => {
    octokitMock.rest.pulls.listFiles.mockResolvedValue({
      data: [
        {
          filename: 'readme.txt',
        },
      ],
    });

    await run();

    expect(core.debug).toHaveBeenCalledWith('Found 0 markdown files');
    expect(core.setFailed).toHaveBeenCalledWith(expect.any(Error));
    const err = (core.setFailed as jest.Mock).mock.calls[0][0] as Error;
    expect(err.message).toEqual('No markdown files found');
  });

  it('should set failed if fails to read article file', async () => {
    const err = new Error('fs');
    (promises.readFile as jest.Mock).mockRejectedValue(err);
    octokitMock.rest.pulls.listFiles.mockResolvedValue({
      data: [
        {
          filename: 'blog-01.md',
        },
      ],
    });

    await run();

    expect(core.debug).toHaveBeenCalledWith('Using blog-01.md');
    expect(promises.readFile).toHaveBeenCalledWith('blog-01.md', 'utf8');
    expect(core.setFailed).toHaveBeenCalledWith(err);
  });

  it('should set failed if fails to parse article', async () => {
    const err = new Error('parseArticle');

    (promises.readFile as jest.Mock).mockResolvedValue('content');
    (parseArticle as jest.Mock).mockImplementation(() => {
      throw err;
    });
    octokitMock.rest.pulls.listFiles.mockResolvedValue({
      data: [
        {
          filename: 'blog-01.md',
        },
      ],
    });

    await run();

    expect(core.setFailed).toHaveBeenCalledWith(err);
  });

  it('should set failed if fails to create medium article', async () => {
    const err = new Error('createArticle');

    (promises.readFile as jest.Mock).mockResolvedValue('content');
    (parseArticle as jest.Mock).mockReturnValue({
      config: { title: 'New' },
      content: 'parsed',
    });
    (createArticle as jest.Mock).mockRejectedValue(err);
    octokitMock.rest.pulls.listFiles.mockResolvedValue({
      data: [
        {
          filename: 'blog-01.md',
        },
      ],
    });

    await run();

    expect(core.debug).toHaveBeenNthCalledWith(3, 'Uploading article New to Medium');
    expect(core.setFailed).toHaveBeenCalledWith(err);
  });

  it('should upload article to medium and set medium url output', async () => {
    (promises.readFile as jest.Mock).mockResolvedValue('content');
    (parseArticle as jest.Mock).mockReturnValue({
      config: { title: 'New' },
      content: 'parsed',
    });
    (createArticle as jest.Mock).mockResolvedValue('medium.com/new');
    octokitMock.rest.pulls.listFiles.mockResolvedValue({
      data: [
        {
          filename: 'blog-01.md',
        },
      ],
    });

    await run();

    expect(core.getInput).toHaveBeenCalledWith('token', { required: true });
    expect(core.getInput).toHaveBeenCalledWith('medium_token', { required: true });
    expect(core.getInput).toHaveBeenCalledWith('medium_user_id', { required: true });
    expect(core.getInput).toHaveBeenCalledWith('medium_base_url', { required: false });

    expect(core.debug).toHaveBeenNthCalledWith(4, 'Article uploaded to Medium: medium.com/new');
    expect(core.setOutput).toHaveBeenCalledWith('medium_url', 'medium.com/new');
  });
});
