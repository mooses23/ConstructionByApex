import { Helmet } from "react-helmet-async";

const SITE_NAME = "Construction By Apex — Central Ohio Contractor";
const BASE_URL = "https://constructionbyapex.com";

interface PageMetaProps {
  title: string;
  description: string;
  path?: string;
  type?: string;
}

export default function PageMeta({ title, description, path = "/", type = "website" }: PageMetaProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Construction By Apex" />
    </Helmet>
  );
}
