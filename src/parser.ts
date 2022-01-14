import { load as loadYaml } from 'js-yaml';

import { Article, ArticleConfig } from './types';

function getMetadataIndexes(lines: string[]): number[] {
  const indexes: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^---/.test(lines[i])) {
      indexes.push(i);
    }
    if (indexes.length === 2) {
      break;
    }
  }

  return indexes;
}

function getArticleTitle(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const titleMatch = lines[i].match(/^#{1}\s+(.*)/);
    if (titleMatch != null) {
      return titleMatch[1];
    }
  }
  return null;
}

export function parseArticle(content: string): Article {
  const lines = content.split('\n');
  const metadataIndexes = getMetadataIndexes(lines);
  if (metadataIndexes.length !== 2) {
    throw new Error('Incorrect metadata');
  }
  const metadata = lines.slice(metadataIndexes[0] + 1, metadataIndexes[1]);
  const contentLines = lines.slice(metadataIndexes[1] + 1);
  const config = loadYaml(metadata.join('\n')) as ArticleConfig;
  if (!config.title) {
    const title = getArticleTitle(contentLines);
    if (title === null) {
      throw new Error('Article does not have a title');
    }
    config.title = title;
  }

  return {
    config,
    content: contentLines.join('\n'),
  };
}
