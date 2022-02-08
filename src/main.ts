/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Handlebars from 'handlebars';
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

    const rawGithubUrl = context.serverUrl
      .replace('//github.com', '//raw.githubusercontent.com');

    const github = getOctokit(ghToken);

    const articleContent = await loadArticleContent(github, articlesFolder);
    const { repo, owner } = context.repo;
    const baseUrl = `${rawGithubUrl}/${owner}/${repo}/${context.ref.replace('ref/heads/', '')}/${articlesFolder}`;
    /* istanbul ignore next */
    core.debug(`Base URL: ${baseUrl}`);
    const article = parseArticle(articleContent, baseUrl);

    const template = Handlebars.compile(article.content);

    /* istanbul ignore next */
    core.debug(`Creating Medium article: "${article.config.title!}"`);

    /* istanbul ignore next */
    core.debug(`Creating Medium article: "${article.config.title!}"`);
    article.content = template({ medium: true });
    let publish = await medium.createArticle(mediumToken, mediumBaseUrl, mediumUserId, article);
    /* istanbul ignore next */
    core.debug(`Article uploaded to Medium: ${publish.url}`);
    core.setOutput('medium_url', publish.url);

    /* istanbul ignore next */
    core.debug(`Creating Dev.To article: "${article.config.title!}"`);
    article.content = template({ devto: true });
    publish = await devto.createArticle(devtoApiKey, article);
    /* istanbul ignore next */
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
