import { parseArticle } from '$/parser';

describe('parser', () => {
  it('should error when article does not contain metadata', () => {
    expect(parseArticle.bind(null, '')).toThrowError('Incorrect metadata');
  });

  it('should error when article does not contain a title', () => {
    const article = `
---
tags:
  - tagOne
---
## some sub title
some content
`;
    expect(parseArticle.bind(null, article)).toThrowError('Article does not have a title');
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
    const parsed = parseArticle(article);
    expect(parsed.config.title).toEqual('Main Title');
  });

  it('should get title from article metadata', () => {
    const article = `
---
title: Metadata Title

---
# Main Title
some content`;
    const parsed = parseArticle(article);
    expect(parsed.config.title).toEqual('Metadata Title');
    expect(parsed.content).toEqual(`# Main Title
some content`);
  });
});
