import Handlebars from 'handlebars';
import * as core from '@actions/core';
import { getOctokit } from '@actions/github';
import { promises } from 'fs';

import * as devto from '$/api/devto';
import * as medium from '$/api/medium';
import { run } from '$/main';
import { parseArticle } from '$/parser';

const octokitMock = {
  request: jest.fn(),
};
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));
jest.mock('handlebars', () => ({
  compile: jest.fn(),
}));
jest.mock('$/api/medium');
jest.mock('$/api/devto');
jest.mock('$/parser');
jest.mock('@actions/github', () => ({
  context: {
    serverUrl: 'https://github.com',
    ref: 'refs/heads/main',
    repo: {
      owner: 'owner',
      repo: 'repo',
    },
    sha: '1234',
  },
  getOctokit: jest.fn(),
}));
jest.mock('@actions/core');

describe('blogpub', () => {
  beforeEach(jest.clearAllMocks);

  (getOctokit as jest.Mock).mockReturnValue(octokitMock);

  const fileData = {
      data: {
        files: [
          {
            filename: 'blogs/blog-01.md',
          },
        ],
      },
    };

  it('should set failed when fails to get PR info', async () => {
    const err = new Error('github');
    octokitMock.request.mockRejectedValue(err);

    await run();

    expect(octokitMock.request).toHaveBeenCalledWith('GET /repos/{owner}/{repo}/commits/{ref}', {
      owner: 'owner',
      repo: 'repo',
      ref: '1234',
    });
    expect(core.setFailed).toHaveBeenCalledWith(err);
  });

  it('should set failed if no markdown files found', async () => {
    (core.getInput as jest.Mock).mockImplementation((key: string) => {
      return key === 'articles_folder' ? 'blogs' : '';
    });
    octokitMock.request.mockResolvedValue({
      data: {
        files: [
          {
            filename: 'readme.txt',
          },
        ],
      },
    });

    await run();

    expect(core.setFailed).toHaveBeenCalledWith(expect.any(Error));
    const err = (core.setFailed as jest.Mock).mock.calls[0][0] as Error;
    expect(err.message).toEqual('No markdown files found');
  });

  it('should set failed if fails to read article file', async () => {
    (core.getInput as jest.Mock).mockImplementation((key: string) => {
      return key === 'articles_folder' ? 'blogs' : '';
    });
    const err = new Error('fs');
    (promises.readFile as jest.Mock).mockRejectedValue(err);
    octokitMock.request.mockResolvedValue(fileData);

    await run();

    expect(promises.readFile).toHaveBeenCalledWith('./blogs/blog-01.md', 'utf8');
    expect(core.setFailed).toHaveBeenCalledWith(err);
  });

  it('should set failed if fails to parse article', async () => {
    (core.getInput as jest.Mock).mockImplementation((key: string) => {
      return key === 'articles_folder' ? 'blogs' : '';
    });

    const err = new Error('parseArticle');

    (promises.readFile as jest.Mock).mockResolvedValue('content');
    (parseArticle as jest.Mock).mockImplementation(() => {
      throw err;
    });
    octokitMock.request.mockResolvedValue(fileData);

    await run();

    expect(core.setFailed).toHaveBeenCalledWith(err);
  });

  it('should set failed if fails to create medium article', async () => {
    const template = jest.fn(() => 'compiled');
    (Handlebars.compile as jest.Mock).mockReturnValue(template);
    (core.getInput as jest.Mock).mockImplementation((key: string) => {
      switch (key) {
        case 'articles_folder':
          return 'blogs';
        case 'medium_token':
          return 'mediumToken';
        case 'medium_user_id':
          return 'user';
        case 'medium_base_url':
          return 'baseUrl';
        default:
          return '';
      }
    });
    const err = new Error('createArticle');

    (promises.readFile as jest.Mock).mockResolvedValue('content');
    (parseArticle as jest.Mock).mockReturnValue({
      config: { title: 'New' },
      content: 'parsed',
    });
    (medium.createArticle as jest.Mock).mockRejectedValue(err);
    octokitMock.request.mockResolvedValue(fileData);

    await run();

    expect(Handlebars.compile).toHaveBeenCalledWith('parsed');
    expect(template).toHaveBeenCalledWith({ medium: true });
    expect(medium.createArticle).toHaveBeenCalledWith('mediumToken', 'baseUrl', 'user', {
      config: { title: 'New' },
      content: 'compiled',
    });
    expect(core.setFailed).toHaveBeenCalledWith(err);
  });

  it('should upload article to medium and set medium url output', async () => {
    const template = jest.fn(() => 'compiled');
    (Handlebars.compile as jest.Mock).mockReturnValue(template);

    (core.getInput as jest.Mock).mockReturnValueOnce('github-token');
    (promises.readFile as jest.Mock).mockResolvedValue('content');
    (parseArticle as jest.Mock).mockReturnValue({
      config: { title: 'New' },
      content: 'parsed',
    });
    (devto.createArticle as jest.Mock).mockRejectedValue(new Error(''));
    (medium.createArticle as jest.Mock).mockResolvedValue({ url: 'medium.com/new' });
    octokitMock.request.mockResolvedValue(fileData);

    await run();

    expect(getOctokit).toHaveBeenCalledWith('github-token');
    expect(core.getInput).toHaveBeenCalledWith('gh_token', { required: true });
    expect(core.getInput).toHaveBeenCalledWith('medium_token', { required: true });
    expect(core.getInput).toHaveBeenCalledWith('medium_user_id', { required: true });
    expect(core.getInput).toHaveBeenCalledWith('medium_base_url', { required: false });
    expect(core.setOutput).toHaveBeenCalledWith('medium_url', 'medium.com/new');
  });

  it('should set failed if fails to create dev.to article', async () => {
    const template = jest.fn(() => 'compiled');
    (Handlebars.compile as jest.Mock).mockReturnValue(template);

    (core.getInput as jest.Mock).mockImplementation((key: string) => {
      switch (key) {
        case 'articles_folder':
          return 'blogs';
        case 'devto_api_key':
          return 'devtoApiKey';
        default:
          return '';
      }
    });
    const err = new Error('createArticle');

    (promises.readFile as jest.Mock).mockResolvedValue('content');
    (parseArticle as jest.Mock).mockReturnValue({
      config: { title: 'New' },
      content: 'parsed',
    });
    (medium.createArticle as jest.Mock).mockResolvedValue({ url: 'medium.com/new' });
    (devto.createArticle as jest.Mock).mockRejectedValue(err);
    octokitMock.request.mockResolvedValue(fileData);

    await run();

    expect(Handlebars.compile).toHaveBeenCalledWith('parsed');
    expect(template).toHaveBeenCalledWith({ devto: true });
    expect(devto.createArticle).toHaveBeenCalledWith('devtoApiKey', {
      config: { title: 'New' },
      content: 'compiled',
    });
    expect(core.setFailed).toHaveBeenCalledWith(err);
  });

  it('should upload article to dev.to and set dev.tp url output', async () => {
    const template = jest.fn(() => 'compiled');
    (Handlebars.compile as jest.Mock).mockReturnValue(template);
    (core.getInput as jest.Mock).mockImplementation((key: string) => {
      switch (key) {
        case 'articles_folder':
          return 'blogs';
        case 'devto_api_key':
          return 'devtoApiKey';
        default:
          return '';
      }
    });
    (promises.readFile as jest.Mock).mockResolvedValue('content');
    (parseArticle as jest.Mock).mockReturnValue({
      config: { title: 'New' },
      content: 'parsed',
    });
    (medium.createArticle as jest.Mock).mockResolvedValue({ url: 'medium.com/new' });
    (devto.createArticle as jest.Mock).mockResolvedValue({ url: 'dev.to/new' });
    octokitMock.request.mockResolvedValue(fileData);

    await run();

    expect(core.getInput).toHaveBeenCalledWith('devto_api_key', { required: true });
    expect(devto.createArticle).toHaveBeenCalledWith('devtoApiKey', {
      config: { title: 'New' },
      content: 'compiled',
    });
    expect(core.setOutput).toHaveBeenCalledWith('devto_url', 'dev.to/new');
    expect(parseArticle).toHaveBeenCalledWith(
      'content', 'raw.githubusercontent.com/owner/repo/main/blogs/');
  });
});
