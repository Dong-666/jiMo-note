import { useEffect, useState } from 'react'
import { toggleMark, setBlockType, wrapIn } from 'prosemirror-commands'
import { liftTarget } from 'prosemirror-transform'
import { Bold, Italic, Strikethrough, Heading, Quote, Code, List } from 'lucide-react'
import type { EditorRef } from './MilkdownEditor'

interface Props {
  editorRef: React.RefObject<EditorRef | null>
}

type ActiveMap = Record<string, boolean>

function replaceBlock(state: import('prosemirror-state').EditorState, dispatch: (tr: import('prosemirror-state').Transaction) => void, nodeType: import('prosemirror-model').NodeType) {
  const { $from } = state.selection
  const start = $from.before($from.depth)
  const end = $from.after($from.depth)
  dispatch(state.tr.setBlockType(start, end, nodeType).scrollIntoView())
}

function liftOut(state: import('prosemirror-state').EditorState, dispatch: (tr: import('prosemirror-state').Transaction) => void, nodeType: import('prosemirror-model').NodeType) {
  const { $from, $to } = state.selection
  const range = $from.blockRange($to, n => n.type === nodeType)
  if (!range) return
  const target = liftTarget(range)
  if (target != null) dispatch(state.tr.lift(range, target).scrollIntoView())
}

export default function FormatToolbar({ editorRef }: Props) {
  const [active, setActive] = useState<ActiveMap>({})

  const update = (view: NonNullable<ReturnType<EditorRef['getView']>>) => {
    const { state } = view
    const { $from } = state.selection
    const marks = state.storedMarks ?? $from.marks()

    const isNodeActive = (type: string) =>
      $from.parent.type === state.schema.nodes[type as keyof typeof state.schema.nodes]

    const isParentActive = (type: string) =>
      $from.node($from.depth)?.type === state.schema.nodes[type as keyof typeof state.schema.nodes] ||
      $from.node($from.depth - 1)?.type === state.schema.nodes[type as keyof typeof state.schema.nodes]

    setActive({
      bold: marks.some(m => m.type === state.schema.marks.strong),
      italic: marks.some(m => m.type === state.schema.marks.emphasis),
      strike: marks.some(m => m.type === state.schema.marks.strike_through),
      heading: isNodeActive('heading'),
      quote: isParentActive('blockquote'),
      code: isNodeActive('code_block'),
      list: isParentActive('bullet_list') || isParentActive('ordered_list'),
    })
  }

  useEffect(() => {
    const view = editorRef.current?.getView()
    if (!view) return

    const handler = () => update(view)
    handler()
    view.dom.addEventListener('mouseup', handler)
    view.dom.addEventListener('keyup', handler)
    return () => {
      view.dom.removeEventListener('mouseup', handler)
      view.dom.removeEventListener('keyup', handler)
    }
  }, [editorRef])

  const run = (fn: (view: NonNullable<ReturnType<EditorRef['getView']>>) => void) => {
    const view = editorRef.current?.getView()
    if (!view) return
    fn(view)
    view.focus()
    update(view)
  }

  const btn = (cmd: string, title: string, Icon: typeof Bold, onClick: () => void) => (
    <button
      key={cmd}
      title={title}
      onClick={onClick}
      className={active[cmd] ? 'active' : ''}
    >
      <Icon size={19} />
    </button>
  )

  return (
    <div className="ink-toolbar">
      {btn('bold', '粗体', Bold, () => run(v => toggleMark(v.state.schema.marks.strong)(v.state, v.dispatch)))}
      {btn('italic', '斜体', Italic, () => run(v => toggleMark(v.state.schema.marks.emphasis)(v.state, v.dispatch)))}
      {btn('strike', '删除线', Strikethrough, () => run(v => toggleMark(v.state.schema.marks.strike_through)(v.state, v.dispatch)))}

      <div className="ink-divider" />

      {btn('heading', '标题', Heading, () =>
        run(v => {
          const { state, dispatch } = v
          if (state.selection.$from.parent.type === state.schema.nodes.heading) {
            replaceBlock(state, dispatch, state.schema.nodes.paragraph)
          } else {
            setBlockType(state.schema.nodes.heading, { level: 2 })(state, dispatch)
          }
        })
      )}
      {btn('quote', '引用', Quote, () =>
        run(v => {
          const { state, dispatch } = v
          if (state.selection.$from.node(state.selection.$from.depth)?.type === state.schema.nodes.blockquote ||
              state.selection.$from.node(state.selection.$from.depth - 1)?.type === state.schema.nodes.blockquote) {
            liftOut(state, dispatch, state.schema.nodes.blockquote)
          } else {
            wrapIn(state.schema.nodes.blockquote)(state, dispatch)
          }
        })
      )}
      {btn('code', '代码', Code, () =>
        run(v => {
          const { state, dispatch } = v
          if (state.selection.$from.parent.type === state.schema.nodes.code_block) {
            replaceBlock(state, dispatch, state.schema.nodes.paragraph)
          } else {
            setBlockType(state.schema.nodes.code_block)(state, dispatch)
          }
        })
      )}
      {btn('list', '列表', List, () =>
        run(v => {
          const { state, dispatch } = v
          if (state.selection.$from.node(state.selection.$from.depth)?.type === state.schema.nodes.bullet_list ||
              state.selection.$from.node(state.selection.$from.depth - 1)?.type === state.schema.nodes.bullet_list) {
            liftOut(state, dispatch, state.schema.nodes.bullet_list)
          } else {
            wrapIn(state.schema.nodes.bullet_list)(state, dispatch)
          }
        })
      )}
    </div>
  )
}
