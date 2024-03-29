export enum MediumLicense {
  AllRightsReserved = 'all-rights-reserved',
  CC40By = 'cc-40-by',
  CC40By_SA = 'cc-40-by-sa',
  CC40By_ND = 'cc-40-by-nd',
  CC40By_NC = 'cc-40-by-nc',
  CC40BY_NC_ND = 'cc-40-by-nc-nd',
  CC40By_NC_SA = 'cc-40-by-nc-sa',
  CC40Zero = 'cc-40-zero',
  PublicDomain = 'public-domain',
}

export interface ArticleConfig {
  description?: string;
  license?: MediumLicense;
  published?: boolean;
  title?: string;
  // Comma separated tags or a yaml list
  tags?: string | string[];
  canonicalUrl?: string;
}

export interface Article {
  config: ArticleConfig;
  content: string;
}

export interface PublishedArticle {
  url: string;
}
