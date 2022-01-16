/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { AxiosError } from 'axios';
import { promises as fs } from 'fs';

import * as devto from '$/api/devto';
import * as medium from '$/api/medium';
import { parseArticle } from '$/parser';

type Github = ReturnType<typeof getOctokit>;

async function loadArticleContent(github: Github, folderName: string): Promise<string> {
  const { owner, repo } = context.repo;
  // NOTE: Pagination returns 30 files by default
  const commit = (
    await github.request('GET /repos/{owner}/{repo}/commits/{ref}', {
      owner,
      repo,
      ref: context.sha,
    })
  ).data;
  const articleFileRegex = new RegExp(`${folderName}\/.*\.md`);
  const mdFiles = commit.files!.filter((f) => articleFileRegex.test(f.filename!));
  core.debug(`Found ${mdFiles.length} markdown files`);
  if (mdFiles.length == 0) {
    throw new Error('No markdown files found');
  }

  const newArticle = mdFiles[0];
  core.debug(`Using ${newArticle.filename!}`);
  const content = await fs.readFile(`./${newArticle.filename!}`, 'utf8');
  return content;
}

export async function run() {
  try {
    const ghToken = core.getInput('gh_token', { required: true });
    const articlesFolder = core.getInput('articles_folder', { required: false });
    const mediumToken = core.getInput('medium_token', { required: true });
    const mediumUserId = core.getInput('medium_user_id', { required: true });
    const mediumBaseUrl = core.getInput('medium_base_url', { required: false });
    const devtoApiKey = core.getInput('devto_api_key', { required: true });

    const github = getOctokit(ghToken);

    const articleContent = await loadArticleContent(github, articlesFolder);
    const article = parseArticle(articleContent);

    core.debug(`Creating Medium article: "${article.config.title!}"`);
    let publish = await medium.createArticle(mediumToken, mediumBaseUrl, mediumUserId, article);
    core.debug(`Article uploaded to Medium: ${publish.url}`);
    core.setOutput('medium_url', publish.url);

    core.debug(`Creating Dev.To article: "${article.config.title!}"`);
    publish = await devto.createArticle(devtoApiKey, article);
    core.debug(`Article uploaded to Dev.To: ${publish.url}`);
    core.setOutput('devto_url', publish.url);
  } catch (err) {
    /* istanbul ignore next */
    {
      const axiosErr = err as AxiosError;
      if (axiosErr.response) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        core.debug(JSON.stringify(axiosErr.response.data));
      }
    }
    core.setFailed(err as Error);
  }
}
