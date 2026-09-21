interface SEOProps {
  title: string
  description: string
  canonical: string
  noindex?: boolean
  ogImage?: string
  ogType?: string
}

export function SEO({ title, description, canonical, noindex = false, ogImage = '/logo.png', ogType = 'website' }: SEOProps) {
  const base = 'https://akhilbharatiyagoswami.com'
  const url = `${base}${canonical}`
  const img = ogImage.startsWith('http') ? ogImage : `${base}${ogImage}`
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex ? <meta name="robots" content="noindex,nofollow" /> : <meta name="robots" content="index,follow" />}
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:site_name" content="Akhil Bharatiya Goswami Sabha Paschim Bangal" />
      <meta property="og:locale" content="en_IN" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
    </>
  )
}
