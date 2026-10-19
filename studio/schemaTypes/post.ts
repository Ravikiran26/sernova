import {defineArrayMember, defineField, defineType} from 'sanity'
import {treatments} from './treatments'

export const post = defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      group: 'content',
      description: 'The post will live at srenova.in/journal/<slug>. Click Generate. Do not change after publishing.',
      options: {source: 'title', maxLength: 80},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'Short summary shown on the Journal listing card.',
      validation: (r) => r.required().max(220),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      group: 'content',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          validation: (r) => r.required().error('Alt text is required'),
        }),
      ],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
      group: 'content',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'author'}],
      group: 'content',
    }),
    defineField({
      name: 'medicallyReviewedBy',
      title: 'Medically reviewed by',
      type: 'reference',
      to: [{type: 'author'}],
      group: 'content',
      description: 'The doctor who checked this article. Strongly recommended for medical topics.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published date',
      type: 'datetime',
      group: 'content',
      initialValue: () => new Date().toISOString(),
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'relatedTreatments',
      title: 'Related treatments',
      type: 'array',
      group: 'content',
      description: 'Links to these treatment pages appear at the end of the post.',
      of: [defineArrayMember({type: 'string'})],
      options: {list: treatments},
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
      group: 'content',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      group: 'content',
      description: 'Optional. Shown at the end of the post and added as FAQ data for Google.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faq',
          fields: [
            defineField({name: 'question', title: 'Question', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'answer', title: 'Answer', type: 'text', rows: 3, validation: (r) => r.required()}),
          ],
          preview: {select: {title: 'question', subtitle: 'answer'}},
        }),
      ],
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo', group: 'seo'}),
  ],
  orderings: [
    {title: 'Newest first', name: 'publishedDesc', by: [{field: 'publishedAt', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'title', category: 'category.title', media: 'coverImage', date: 'publishedAt'},
    prepare: ({title, category, media, date}) => ({
      title,
      subtitle: [category, date && new Date(date).toLocaleDateString('en-IN')].filter(Boolean).join(' · '),
      media,
    }),
  },
})
