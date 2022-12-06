# blogpub

[![CI](https://github.com/protiumx/blogpub/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/protiumx/blogpub/actions/workflows/ci.yml)

Github action to publish your blog articles to [Medium](https://medium.com/) or [Dev.to](http://dev.to/) using their respective REST APIs.
The action searches for markdown files in the commit of the `push` event and uses **first** `md` file that finds.

## Updating articles

Currently it's not supported to update the articles on the different platforms.
If the markdown file found in the `push` event **already** exists on the commit **before**, the action will **skip it**.
This avoids publishing the article again.

## Pre-requisites

In order to interact with both platforms API's you will need:
- **Medium** [integration token](https://github.com/Medium/medium-api-docs#21-self-issued-access-tokens)
- **Dev.to** [API Key](https://developers.forem.com/api#section/Authentication)
- [Github access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with `reading` permissions

## Usage

The action will grab an `markdown` file from a push event to a branch.
The following workflow configuration will publish articles that are committed to
the `main` branch:

```yml
on:
  push:
    branches:
      - 'main'
    paths:
      - 'articles/*'
```

**Note**: we only want to trigger this action when files are added to the `articles` folder.

You can define your job as follows:
```yml
jobs:
  publish:
    name: publish new article
    runs-on: ubuntu-latest    
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: blogpub
        uses: protiumx/blogpub@v0.6.0
        with:
          devto_api_key: ${{ secrets.DEVTO_API_KEY }}
          gh_token: ${{ secrets.GH_TOKEN }}
          medium_token: ${{ secrets.MEDIUM_TOKEN }}
          medium_user_id: 1f3b633f149233c057af77f0016a9421fa520b9a59f97f5bd07201c2ca2a4a6bc

```
Check my personal [blog](https://github.com/protiumx/blog) source as example of usage

## Inputs

- `gh_token`: Github token. **Required**
- `articles_folder`: Folder to look for new articles. **Default**: `blogs`
- `medium_token`: Your Medium integration token. **Required**
- `medium_base_url`: Medium base URL to post articles. **Default**: `https://api.medium.com/v1`
- `medium_user_id`: Your Medium user ID. **Required**. See [medium api docs](https://github.com/Medium/medium-api-docs#31-users)
- `devto_api_key`: Your Dev.to API Key. **Required**

Example:
```md
---
title: New Article
description: Some description
tags: test, ci
license: public-domain
---
# This is my new Article

In this article we will learn how to setup with `blogpub`

## Relative paths from the repository

![ci-meme.jpg](./assets/meme.jpg)

## Requirements

...
```

## Outputs

- `medium_url`: URL of the published article to Medium
- `devto_url`: URL of the published article to Dev.to

## Articles configuration

`blogpub` will search for metadata surrounded by section markers `---`. The metadata
should be a `yml` section.

The following arguments can be set:
- `title`: `[string]` The title of the article. If not specified, the **first** H1 heading will be used.
- `description`: `[string]` Description for `dev.to` API.
- `tags`: `[string | string[]]` Comma separated tags or yaml list. Note: Medium allows up to 5 tags whereas Dev.to only 4.
- `license`: `[string]` Medium license type. Refer to [Medium API Docs](https://github.com/Medium/medium-api-docs#33-posts). **Default**: `public-domain`
- `published`: `[boolean]`. **Default**: `true`
- `canonicalUrl`: `[string]` The canonical URL of the post (supported in both Medium and Dev.to)

## Template Support

`blogpub` supports [handlebars](https://handlebarsjs.com/) templates.
It provides the following context
```ts
{
  medium: boolean;
  devto: boolean;
}
```
Usage:
```md
{{#if medium}}
This is only for Medium
{{/if}}
```

## Relative Paths

You can use relative paths to use any media files hosted in the same repository as the article files.
All relative paths will be resolved using the **github raw content** URL.

Example:
```
![image](./img1.png)
<img src="../assets/img2.jpg" />
```

Will be parsed as
```
![image](https://raw.githubusercontent.com/<owner>/<repo>/<articles_folder>/img1.png)
<img src="https://raw.githubusercontent.com/<owner>/<repo>/assets/img2.jpg" />
```

## Developing

Run tests
```sh
yarn test
```

Run build
```sh
yarn build
```

### Testing action locally

If you want to test the action locally you could clone `blogpub-test` and use 
[act](https://github.com/nektos/act) to run the action.

## Contributing

Please submit a PR with any contribution. Refer to the list of `TODO's` or open issues.

## TODO

- [x] Relative paths to github raw server
- [ ] Remove `axios` in favor of node's `https`
- [ ] Sanitize inputs
- [ ] Support publishing to only 1 platform
- [ ] Support edition and auto update of articles
- [ ] Support multiple articles per job run
