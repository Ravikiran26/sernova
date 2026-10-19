import {defineArrayMember, defineField, defineType} from 'sanity'

export const blockContent = defineType({
  name: 'blockContent',
  title: 'Body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'Heading 2', value: 'h2'},
        {title: 'Heading 3', value: 'h3'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      marks: {
        decorators: [
          {title: 'Bold', value: 'strong'},
          {title: 'Italic', value: 'em'},
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              defineField({
                name: 'href',
                title: 'URL',
                type: 'url',
                description: 'Use /treatments/... for pages on this site, or a full https:// link.',
                validation: (r) =>
                  r.required().uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']}),
              }),
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Describe the image for Google and screen readers.',
          validation: (r) => r.required().error('Alt text is required'),
        }),
        defineField({name: 'caption', title: 'Caption', type: 'string'}),
      ],
    }),
    defineArrayMember({
      name: 'callout',
      title: 'Call to action',
      type: 'object',
      fields: [
        defineField({name: 'heading', title: 'Heading', type: 'string', validation: (r) => r.required()}),
        defineField({name: 'text', title: 'Text', type: 'text', rows: 2}),
        defineField({
          name: 'buttonLabel',
          title: 'Button label',
          type: 'string',
          initialValue: 'Book Consultation',
        }),
      ],
      preview: {select: {title: 'heading'}, prepare: ({title}) => ({title: `CTA: ${title}`})},
    }),
  ],
})
