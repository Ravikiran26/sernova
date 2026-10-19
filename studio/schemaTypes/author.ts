import {defineField, defineType} from 'sanity'

export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'credentials',
      title: 'Credentials / role',
      type: 'string',
      description: 'e.g. "MBBS, MD (Dermatology) — Consultant Dermatologist". Shown on posts; medical credentials help with Google trust signals.',
    }),
    defineField({name: 'photo', title: 'Photo', type: 'image', options: {hotspot: true}}),
    defineField({name: 'bio', title: 'Short bio', type: 'text', rows: 3}),
  ],
  preview: {select: {title: 'name', subtitle: 'credentials', media: 'photo'}},
})
