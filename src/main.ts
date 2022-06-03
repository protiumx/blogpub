/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Handlebars from 'handlebars';
import path from 'path';
import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { PushEvent } from '@octokit/webhooks-definitions/schema';
import { AxiosError } from 'axios';
import { promises as fs } from 'fs';

import * as devto from '$/api/devto';
import * as medium from '$/api/medium';
import { parseArticle } from '$/parser';

type Github = ReturnType<typeof getOctokit>;

async function loadArticleFile(
  github: Github, folderName: string,
): Promise<{ fileName: string, content: string }> {
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
  return { fileName: newArticle.filename!, content };
}

// Check if file already existed in a commit
async function checkFileExists(github: Github, filePath: string, ref: string): Promise<boolean> {
  const { owner, repo } = context.repo;
  const res = await github.request('GET /repos/{owner}/{repo}/contents/{path}/{?ref}', {
    owner,
    repo,
    ref,
    path: filePath,
  });
  console.log(res, ref, filePath);
  return res.status === 200;
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

    const articleFile = await loadArticleFile(github, articlesFolder);
    const before = (context.payload as PushEvent).before;
    const articleAlreadyExists = await checkFileExists(github, articleFile.fileName, before);
    /* istanbul ignore next */
    if (articleAlreadyExists) {
      /* istanbul ignore next */
      core.debug(`Article ${articleFile.fileName} already published. Skipping.`);      
      return;
    }
    const rawGithubUrl = context.serverUrl
      .replace('//github.com', '//raw.githubusercontent.com');
    const { repo, owner } = context.repo;
    const branchName = context.ref.replace('refs/heads/', '');
    const fileUrl = `${rawGithubUrl}/${owner}/${repo}/${branchName}/${articleFile.fileName}`;
    const basePath = path.dirname(fileUrl).replace('https://', '');
    /* istanbul ignore next */
    core.debug(`Base path: ${basePath}`);
    const article = parseArticle(articleFile.content, `${basePath}/`);
    const template = Handlebars.compile(article.content);

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
