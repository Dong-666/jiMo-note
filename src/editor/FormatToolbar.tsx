import { useEffect, useState } from 'react'
import { toggleMark, setBlockType, wrapIn } from 'prosemirror-commands'
import { Bold, Italic, Strikethrough, Heading, Quote, Code, List } from 'lucide-react'
import type { EditorRef } from './MilkdownEditor'

interface Props {
  editorRef: React.RefObject<EditorRef | null>
}

type ActiveMap = Record<string, boolean>

export default function FormatToolbar({ editorRef }: Props) {
  const [active, setActive] = useState<ActiveMap>({})

  useEffect(() => {
    const view = editorRef.current?.getView()
    if (!view) return

    const update = () => {
      const { state } = view
      const { $from } = state.selection
      const marks = state.storedMarks || $from.marks()

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

    const origDispatch = view.dispatch
    view.dispatch = (tr) => {
      origDispatch.call(view, tr)
      update()
    }

    update()
    view.dom.addEventListener('mouseup', update)
    view.dom.addEventListener('keyup', update)
    return () => {
      view.dispatch = origDispatch
      view.dom.removeEventListener('mouseup', update)
      view.dom.removeEventListener('keyup', update)
    }
  }, [editorRef])

  const run = (fn: (view: NonNullable<ReturnType<EditorRef['getView']>>) => void) => {
    const view = editorRef.current?.getView()
    if (!view) return
    fn(view)
    view.focus()
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

      {btn('heading', '标题', Heading, () => run(v => setBlockType(v.state.schema.nodes.heading, { level: 2 })(v.state, v.dispatch)))}
      {btn('quote', '引用', Quote, () => run(v => wrapIn(v.state.schema.nodes.blockquote)(v.state, v.dispatch)))}
      {btn('code', '代码', Code, () => run(v => setBlockType(v.state.schema.nodes.code_block)(v.state, v.dispatch)))}
      {btn('list', '列表', List, () => run(v => wrapIn(v.state.schema.nodes.bullet_list)(v.state, v.dispatch)))}
    </div>
  )
}
