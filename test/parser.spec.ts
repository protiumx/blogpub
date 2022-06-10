import { parseArticle } from '$/parser';
import { MediumLicense } from '$/types';

describe('parser', () => {
  beforeEach(jest.clearAllMocks);

  it('should error when article does not contain metadata', () => {
    expect(parseArticle.bind(null, '', '')).toThrowError('Incorrect metadata');
  });

  it('should error when article does not contain a title', () => {
    const article = `
---
tags: tagOne
---
## some sub title
some content
`;
    expect(parseArticle.bind(null, article, '')).toThrowError('Article does not have a title');
  });

  it('should get title from article content', () => {
    const article = `
---
tags:
  - tagOne
---
# Main Title
some content
`;
    const parsed = parseArticle(article, '');
    expect(parsed.config.title).toEqual('Main Title');
  });

  it('should get title from article metadata', () => {
    const article = `
---
title: Metadata Title
---
# Main Title
some content`;
    const parsed = parseArticle(article, '');
    expect(parsed.config.title).toEqual('Metadata Title');
    expect(parsed.config.description).toEqual('');
    expect(parsed.config.license).toEqual(MediumLicense.PublicDomain);
    expect(parsed.config.published).toEqual(true);
    expect(parsed.content).toEqual(`# Main Title
some content`);
  });

  it('should parse all configuration values', () => {
    const article = `
---
title: Metadata Title
description: New Article
tags: one, two
license: ${MediumLicense.CC40Zero}
published: false
---
# Main Title
some content`;
    const parsed = parseArticle(article, '');
    expect(parsed.config.title).toEqual('Metadata Title');
    expect(parsed.config.description).toEqual('New Article');
    expect(parsed.config.tags).toEqual(['one', 'two']);
    expect(parsed.config.license).toEqual(MediumLicense.CC40Zero);
    expect(parsed.config.published).toEqual(false);
    expect(parsed.content).toEqual(`# Main Title
some content`);
  });

  it('should parse all images with relative path', () => {
    const article = `
---
title: Some Title
description: New Article
tags:
  - one
  - images
published: false
---

# Main Title
some content

![img](./assets/img.png)
![img](../global/img.png)

<img alt="image" src="./assets/img.gif" />
<video src='./assets/video.mp4' />

## Description
`;
    const parsed = parseArticle(article, 'raw.github.com/protiumx/blogpub/main/articles/');

    expect(parsed.config.tags).toEqual(['one', 'images']);
    expect(
      parsed.content.includes(
        '![img](https://raw.github.com/protiumx/blogpub/main/articles/assets/img.png)',
      ),
    ).toBeTruthy();
    expect(
      parsed.content.includes(
        '![img](https://raw.github.com/protiumx/blogpub/main/global/img.png)',
      ),
    ).toBeTruthy();
    expect(
      parsed.content.includes(
        '<img alt="image" src="https://raw.github.com/protiumx/blogpub/main/articles/assets/img.gif"',
      ),
    ).toBeTruthy();
    expect(
      parsed.content.includes(
        "<video src='https://raw.github.com/protiumx/blogpub/main/articles/assets/video.mp4'",
      ),
    ).toBeTruthy();
  });
});
