---
name: Bug report
about: Create a report to help us improve
title: ''
labels: ''
assignees: ''

---

### Description
A clear and concise description of what the bug is.

### Article Metadata
Metadata used for the article or a link to the article itself. E.g.:
```md
---
title: New Article
---
```

### Action configuration
Workflow configuration. E.g.
```yml
jobs:
  publish:
    name: publish new article
    runs-on: ubuntu-latest    
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: blogpub
        uses: protiumx/blogpub@v0.4
        with:
          devto_api_key: ${{ secrets.DEVTO_API_KEY }}
          gh_token: ${{ secrets.GH_TOKEN }}
          medium_token: ${{ secrets.MEDIUM_TOKEN }}
          medium_user_id: some_id
```
