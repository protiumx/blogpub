import path from 'path';
import { load as loadYaml } from 'js-yaml';

import { Article, ArticleConfig, MediumLicense } from './types';

const RelativePathRegex = /([\.]{1,2}\/.*)/;

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

function parseRelativeImages(lines: string[], basePath: string) {
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(RelativePathRegex);
    if (match !== null) {
      const absolutePath = path.join(basePath, match[1]);
      lines[i] = lines[i].replace(match[1], `https://${absolutePath}`);
    }
  }
}

/* 
 * Parses the content and configuration, replacing relative paths with full raw content github url.
 */
export function parseArticle(content: string, basePath: string): Article {
  const lines = content.split('\n');
  const metadataIndexes = getMetadataIndexes(lines);
  if (metadataIndexes.length !== 2) {
    throw new Error('Incorrect metadata');
  }
  const metadata = lines.slice(metadataIndexes[0] + 1, metadataIndexes[1]);
  const contentLines = lines.slice(metadataIndexes[1] + 1);
  parseRelativeImages(metadata, basePath);
  const config = loadYaml(metadata.join('\n')) as ArticleConfig;

  if (!config.title) {
    const title = getArticleTitle(contentLines);
    if (title === null) {
      throw new Error('Article does not have a title');
    }
    config.title = title;
  }

  parseRelativeImages(contentLines, basePath);
  config.description ??= '';
  config.license ??= MediumLicense.PublicDomain;
  config.published ??= true;

  return {
    config,
    content: contentLines.join('\n'),
  };
}
