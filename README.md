# blogpub

[![CI](https://github.com/protiumx/blogpub/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/protiumx/blogpub/actions/workflows/ci.yml)

Github action to publish your blog articles to Medium or Dev.to

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
      - 'blogs/*'
```

**Note**: we only want to trigger this action when files are added to the folder
`blogs`.

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
        uses: protiumx/blogpub@v0.1.8
        with:
          devto_api_key: ${{ secrets.DEVTO_API_KEY }}
          gh_token: ${{ secrets.GH_TOKEN }}
          medium_token: ${{ secrets.MEDIUM_TOKEN }}
          medium_user_id: 1f3b633f149233c057af77f0016a9421fa520b9a59f97f5bd07201c2ca2a4a6bc

```
See [blogpub-test](https://github.com/protiumx/blogpub-test) for more examples.
## Inputs

- `gh_token`: Github token. **Required**
- `articles_folder`: Folder to look for new articles. **Default**: `blogs`
- `medium_token`: Your Medium integration token. **Required**
- `medium_base_url`: Medium base URL to post articles. **Default**: `https://api.medium.com/v1`
- `medium_user_id`: Your Medium user ID. **Required**. See [medium api docs](https://github.com/Medium/medium-api-docs#31-users)
- `devto_api_key`: Your Dev.to API Key. **Required**

## Outputs

- `medium_url`: URL of the published article to Medium
- `devto_url`: URL of the published article to Dev.to

## Articles configuration

`blogpub` will search for metadata surrounded by section markers `---`. The metadata
should be a `yml` section.

The following arguments can be set:
- `title`: The title of the article. If not specified, the **first** H1 heading will be used.
- `description`: Description for `dev.to` API.
- `tags`: List of tags. Note: Medium allows up to 5 tags whereas Dev.to only 4.
- `license`: Medium license type. Refer to [Medium API Docs](https://github.com/Medium/medium-api-docs#33-posts). **Default**: `public-domain`

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

- [ ] Support all different `publish status`
- [ ] Remove `axios` in favor of node's `https`
- [ ] Sanitize inputs
- [ ] Support publishing to only 1 platform
- [ ] Support edition and auto update of articles
- [ ] Support multiple articles
- [ ] Upload relative images
