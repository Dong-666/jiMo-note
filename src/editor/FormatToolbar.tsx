import { Bold, Italic, Strikethrough, Heading, Quote, Code, List } from 'lucide-react'
import { TextSelection } from 'prosemirror-state'
import type { EditorRef } from './MilkdownEditor'

interface Props {
  editorRef: React.RefObject<EditorRef | null>
}

const tools = [
  { cmd: 'bold', icon: Bold, label: '粗体', open: '**', close: '**' },
  { cmd: 'italic', icon: Italic, label: '斜体', open: '*', close: '*' },
  { cmd: 'strike', icon: Strikethrough, label: '删除线', open: '~~', close: '~~' },
  null,
  { cmd: 'heading', icon: Heading, label: '标题', open: '# ', close: '' },
  { cmd: 'quote', icon: Quote, label: '引用', open: '> ', close: '' },
  { cmd: 'code', icon: Code, label: '代码', open: '`', close: '`' },
  { cmd: 'list', icon: List, label: '列表', open: '- ', close: '' },
] as const

export default function FormatToolbar({ editorRef }: Props) {
  const exec = (cmd: string) => {
    const view = editorRef.current?.getView()
    if (!view) return

    const tool = tools.find(t => t !== null && t.cmd === cmd)
    if (!tool || tool === null) return

    const { from, to } = view.state.selection
    const selectedText = view.state.doc.textBetween(from, to)
    const haveSelection = from !== to

    if (haveSelection) {
      const wrapped = tool.open + selectedText + tool.close
      const tr = view.state.tr.replaceSelectionWith(view.state.schema.text(wrapped), false)
      view.dispatch(tr)
    } else {
      const text = tool.open + tool.close
      const pos = from
      const tr = view.state.tr.insert(pos, view.state.schema.text(text))
      const cursorPos = pos + tool.open.length
      tr.setSelection(TextSelection.create(tr.doc, cursorPos))
      view.dispatch(tr)
    }

    view.focus()
  }

  return (
    <div className="ink-toolbar">
      {tools.map((tool, i) =>
        tool === null ? (
          <div key={`div-${i}`} className="ink-divider" />
        ) : (
          <button
            key={tool.cmd}
            title={tool.label}
            onClick={() => exec(tool.cmd)}
          >
            <tool.icon size={19} />
          </button>
        )
      )}
    </div>
  )
}
