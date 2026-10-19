import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'SRENOVA Journal',
  projectId: 'wl7g0dv3',
  dataset: 'production',
  plugins: [structureTool({structure}), visionTool()],
  schema: {types: schemaTypes},
})
