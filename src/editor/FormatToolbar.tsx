import { toggleMark, setBlockType, wrapIn } from 'prosemirror-commands'
import { Bold, Italic, Strikethrough, Heading, Quote, Code, List } from 'lucide-react'
import type { EditorRef } from './MilkdownEditor'

interface Props {
  editorRef: React.RefObject<EditorRef | null>
}

export default function FormatToolbar({ editorRef }: Props) {
  const run = (fn: (view: NonNullable<ReturnType<EditorRef['getView']>>) => void) => {
    const view = editorRef.current?.getView()
    if (!view) return
    fn(view)
    view.focus()
  }

  return (
    <div className="ink-toolbar">
      <button title="粗体" onClick={() => run(v => toggleMark(v.state.schema.marks.strong)(v.state, v.dispatch))}>
        <Bold size={19} />
      </button>
      <button title="斜体" onClick={() => run(v => toggleMark(v.state.schema.marks.emphasis)(v.state, v.dispatch))}>
        <Italic size={19} />
      </button>
      <button title="删除线" onClick={() => run(v => toggleMark(v.state.schema.marks.strike_through)(v.state, v.dispatch))}>
        <Strikethrough size={19} />
      </button>

      <div className="ink-divider" />

      <button title="标题" onClick={() => run(v => setBlockType(v.state.schema.nodes.heading, { level: 2 })(v.state, v.dispatch))}>
        <Heading size={19} />
      </button>
      <button title="引用" onClick={() => run(v => wrapIn(v.state.schema.nodes.blockquote)(v.state, v.dispatch))}>
        <Quote size={19} />
      </button>
      <button title="代码" onClick={() => run(v => setBlockType(v.state.schema.nodes.code_block)(v.state, v.dispatch))}>
        <Code size={19} />
      </button>
      <button title="列表" onClick={() => run(v => wrapIn(v.state.schema.nodes.bullet_list)(v.state, v.dispatch))}>
        <List size={19} />
      </button>
    </div>
  )
}
