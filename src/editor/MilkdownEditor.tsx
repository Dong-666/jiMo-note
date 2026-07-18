import { forwardRef, useImperativeHandle } from 'react'
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, serializerCtx, schemaCtx } from '@milkdown/core'
import { commonmark, createCodeBlockInputRule } from '@milkdown/preset-commonmark'
import {
  strikethroughAttr, strikethroughSchema, strikethroughInputRule, strikethroughKeymap,
  tableSchema, tableHeaderRowSchema, tableRowSchema, tableCellSchema, tableHeaderSchema,
  tableEditingPlugin, tablePasteRule, tableKeymap, commands, remarkGFMPlugin,
} from '@milkdown/preset-gfm'
import { prism } from '@milkdown/plugin-prism'
import { history } from '@milkdown/plugin-history'
import { trailing } from '@milkdown/plugin-trailing'
import { clipboard } from '@milkdown/plugin-clipboard'
import { $inputRuleAsync } from '@milkdown/utils'
import { wrappingInputRule, textblockTypeInputRule } from '@milkdown/prose/inputrules'
import { markRule } from '@milkdown/prose'
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react'
import type { EditorView } from 'prosemirror-view'

export interface EditorRef {
  getMarkdown: () => string
  getView: () => EditorView | null
}

const wrapInBlockquote = $inputRuleAsync(async (ctx) => {
  const schema = ctx.get(schemaCtx)
  if (!schema.nodes.blockquote) throw new Error('Missing blockquote node')
  return wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote)
}, 'JIMO_BLOCKQUOTE')

const wrapInBulletList = $inputRuleAsync(async (ctx) => {
  const schema = ctx.get(schemaCtx)
  if (!schema.nodes.bullet_list) throw new Error('Missing bullet_list node')
  return wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bullet_list)
}, 'JIMO_BULLET_LIST')

const wrapInOrderedList = $inputRuleAsync(async (ctx) => {
  const schema = ctx.get(schemaCtx)
  if (!schema.nodes.ordered_list) throw new Error('Missing ordered_list node')
  return wrappingInputRule(/^\s*(\d+)\.\s$/, schema.nodes.ordered_list, (match) => ({ order: Number(match[1]) }))
}, 'JIMO_ORDERED_LIST')

const wrapInHeading = $inputRuleAsync(async (ctx) => {
  const schema = ctx.get(schemaCtx)
  if (!schema.nodes.heading) throw new Error('Missing heading node')
  return textblockTypeInputRule(/^(#{1,6})\s$/, schema.nodes.heading, (match) => ({ level: match[1].length }))
}, 'JIMO_HEADING')

const strongInputRulePlugin = $inputRuleAsync(async (ctx) => {
  const schema = ctx.get(schemaCtx)
  if (!schema.marks.strong) throw new Error('Missing strong mark')
  return markRule(/(?<![\w:/])(?:\*\*|__)([^*_]+?)(?:\*\*|__)(?![\w/])$/, schema.marks.strong, {
    getAttr: (match) => ({ marker: match[0].startsWith('*') ? '*' : '_' }),
  })
}, 'JIMO_STRONG')

const emphasisInputRulePlugin = $inputRuleAsync(async (ctx) => {
  const schema = ctx.get(schemaCtx)
  if (!schema.marks.emphasis) throw new Error('Missing emphasis mark')
  return markRule(/(?:^|[^*])\*([^*]+)\*$/, schema.marks.emphasis, {
    getAttr: () => ({ marker: '*' }),
    updateCaptured: ({ fullMatch, start }) =>
      !fullMatch.startsWith('*')
        ? { fullMatch: fullMatch.slice(1), start: start + 1 }
        : {},
  })
}, 'JIMO_EMPHASIS')

const wrapInFencedCode = $inputRuleAsync(async (ctx) => {
  const schema = ctx.get(schemaCtx)
  if (!schema.nodes.code_block) throw new Error('Missing code_block node')
  return textblockTypeInputRule(
    /^```(?<language>[a-z]+)[\s\n]$/,
    schema.nodes.code_block,
    (match) => ({
      language: match.groups?.language ?? '',
    })
  )
}, 'JIMO_FENCED_CODE')

const commonmarkPlugins = commonmark.filter(p => p !== createCodeBlockInputRule)

const EditorInner = forwardRef<EditorRef, { content: string }>(({ content }, ref) => {
  const { get } = useEditor((root) => {
    return Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, content)
      })
      .use(commonmarkPlugins)
      .use(wrapInFencedCode)
      .use(history)
      .use(trailing)
      .use(clipboard)
      .use(wrapInBlockquote)
      .use(wrapInBulletList)
      .use(wrapInOrderedList)
      .use(wrapInHeading)
      .use(strongInputRulePlugin)
      .use(emphasisInputRulePlugin)
      .use(strikethroughAttr)
      .use(strikethroughSchema)
      .use(strikethroughInputRule)
      .use(strikethroughKeymap)
      .use(commands)
      .use(tableSchema)
      .use(tableHeaderRowSchema)
      .use(tableRowSchema)
      .use(tableCellSchema)
      .use(tableHeaderSchema)
      .use(tableEditingPlugin)
      .use(tablePasteRule)
      .use(tableKeymap)
      .use(remarkGFMPlugin)
      .use(prism)
  }, [])

  useImperativeHandle(ref, () => ({
    getMarkdown: () => {
      const editor = get()
      if (!editor) return ''
      return editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        const serializer = ctx.get(serializerCtx)
        return serializer(view.state.doc)
      })
    },
    getView: () => {
      const editor = get()
      if (!editor) return null
      return editor.action((ctx) => ctx.get(editorViewCtx))
    }
  }))

  return <Milkdown />
})

interface Props {
  content: string
  editorRef?: React.RefObject<EditorRef | null>
}

export default function MilkdownEditor({ content, editorRef }: Props) {
  return (
    <MilkdownProvider>
      <EditorInner ref={editorRef} content={content} />
    </MilkdownProvider>
  )
}
