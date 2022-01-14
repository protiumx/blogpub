/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { promises as fs } from 'fs';

import { createArticle } from '$/api/medium';
import { parseArticle } from '$/parser';

type Github = ReturnType<typeof getOctokit>;

async function loadArticleContent(github: Github): Promise<string> {
  const { owner, repo } = context.repo;
  // NOTE: Pagination returns 30 files by default
  const files = await github.rest.pulls.listFiles({
    owner,
    repo,
    // https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts#L60
    pull_number: context.issue.number,
  });
  const mdFiles = files.data.filter((f) => f.filename.includes('.md'));
  core.debug(`Found ${mdFiles.length} markdown files`);
  if (mdFiles.length == 0) {
    throw new Error('No markdown files found');
  }

  const newArticle = mdFiles[0];
  core.debug(`Using ${newArticle.filename}`);
  const content = await fs.readFile(newArticle.filename, 'utf8');
  return content;
}

export async function run() {
  try {
    const token = core.getInput('token', { required: true });
    const mediumToken = core.getInput('medium_token', { required: true });
    const mediumUserId = core.getInput('medium_user_id', { required: true });
    const mediumBaseUrl = core.getInput('medium_base_url', { required: false });

    const github = getOctokit(token);

    const articleContent = await loadArticleContent(github);
    const article = parseArticle(articleContent);

    core.debug(`Uploading article ${article.config.title!} to Medium`);
    const url = await createArticle(mediumToken, mediumBaseUrl, mediumUserId, article);
    core.debug(`Article uploaded to Medium: ${url}`);
    core.setOutput('medium_url', url);
  } catch (err) {
    core.setFailed(err as Error);
  }
}
