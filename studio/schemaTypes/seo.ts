import {defineField, defineType} from 'sanity'

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: {collapsible: true, collapsed: false},
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta title',
      type: 'string',
      description: 'Shown in Google results and browser tabs. Leave empty to use the post title. Aim for 50–60 characters.',
      validation: (r) => r.max(60).warning('Google usually cuts titles longer than 60 characters'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description: 'The summary under the title in Google. 120–160 characters works best.',
      validation: (r) => [
        r.required().error('A meta description is required for SEO'),
        r.max(160).warning('Google usually cuts descriptions longer than 160 characters'),
        r.min(70).warning('Too short — aim for at least 120 characters'),
      ],
    }),
    defineField({
      name: 'focusKeyword',
      title: 'Focus keyword',
      type: 'string',
      description: 'The main search phrase this post targets, e.g. "hair transplant cost in Hyderabad". For the team’s reference.',
    }),
    defineField({
      name: 'ogImage',
      title: 'Social share image',
      type: 'image',
      description: 'Image shown when shared on WhatsApp, Facebook, LinkedIn. Leave empty to use the cover image. Ideal size 1200×630.',
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from Google',
      type: 'boolean',
      description: 'Turn on only for pages that should not appear in search results.',
      initialValue: false,
    }),
  ],
})
