import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { toggleMark, setBlockType, wrapIn } from 'prosemirror-commands'
import { liftTarget } from 'prosemirror-transform'
import { Bold, Italic, Strikethrough, Heading, Quote, Code, List, ListOrdered, Table } from 'lucide-react'
import type { EditorRef } from './MilkdownEditor'
import Modal from '../components/Modal'

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'css', 'html', 'bash', 'json',
  'markdown', 'yaml', 'sql', 'rust', 'go', 'java', 'c', 'cpp', 'php',
  'ruby', 'swift', 'kotlin', 'scala', 'lua', 'perl', 'r', 'dart',
  'elixir', 'haskell', 'clojure', 'powershell', 'shell', 'diff',
  'graphql', 'http', 'xml', 'toml', 'dockerfile', 'makefile',
]

interface Props {
  editorRef: React.RefObject<EditorRef | null>
}

type ActiveMap = Record<string, boolean | number>

function replaceBlock(state: import('prosemirror-state').EditorState, dispatch: (tr: import('prosemirror-state').Transaction) => void, nodeType: import('prosemirror-model').NodeType, attrs?: Record<string, unknown>) {
  const { $from } = state.selection
  const start = $from.before($from.depth)
  const end = $from.after($from.depth)
  dispatch(state.tr.setBlockType(start, end, nodeType, attrs).scrollIntoView())
}

function liftOut(state: import('prosemirror-state').EditorState, dispatch: (tr: import('prosemirror-state').Transaction) => void, nodeType: import('prosemirror-model').NodeType) {
  const { $from, $to } = state.selection
  const range = $from.blockRange($to, n => n.type === nodeType)
  if (!range) return
  const target = liftTarget(range)
  if (target != null) dispatch(state.tr.lift(range, target).scrollIntoView())
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, fn: () => void, triggerRef?: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current && !ref.current.contains(target)) {
        if (!triggerRef?.current?.contains(target)) fn()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, fn, triggerRef])
}

function Dropdown({ children, open, onClose, triggerRef }: { children: React.ReactNode; open: boolean; onClose: () => void; triggerRef: React.RefObject<HTMLElement | null> }) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<React.CSSProperties>(() => {
    if (!triggerRef.current) return {}
    const rect = triggerRef.current.getBoundingClientRect()
    return {
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: Math.max(rect.width, 180),
    }
  })
  useClickOutside(dropdownRef, onClose, triggerRef)

  useEffect(() => {
    if (!open || !triggerRef.current) return

    const updatePosition = () => {
      const rect = triggerRef.current!.getBoundingClientRect()
      const ddRect = dropdownRef.current?.getBoundingClientRect()
      const ddWidth = ddRect?.width ?? 180
      const ddHeight = ddRect?.height ?? 200
      const vw = window.innerWidth
      const vh = window.innerHeight
      const gap = 4

      let left = rect.left
      let top = rect.bottom + gap

      if (left + ddWidth > vw - 12) {
        left = Math.max(12, rect.right - ddWidth)
      }
      if (top + ddHeight > vh - 12) {
        top = Math.max(12, rect.top - ddHeight - gap)
      }

      setStyle({
        position: 'fixed',
        top,
        left,
        minWidth: Math.max(rect.width, 180),
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [open, triggerRef])

  if (!open) return null
  return createPortal(
    <div
      ref={dropdownRef}
      style={style}
      className="min-w-[180px] max-w-[calc(100vw-24px)] bg-paper-card dark:bg-dark-card border border-paper-border/60 dark:border-dark-border/60 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] z-50 py-1 overflow-hidden text-sm"
    >
      {children}
    </div>,
    document.body
  )
}

function DropdownItem({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors cursor-pointer
        ${active ? 'text-seal dark:text-seal-dark bg-seal/8 dark:bg-seal-dark/12 font-medium' : 'text-ink dark:text-dark-text hover:bg-paper-border/50 dark:hover:bg-dark-border/50'}`}
    >
      {children}
    </button>
  )
}

export default function FormatToolbar({ editorRef }: Props) {
  const [active, setActive] = useState<ActiveMap>({})
  const [headingLevel, setHeadingLevel] = useState(0)
  const [codeBlockLang, setCodeBlockLang] = useState('')
  const [headingOpen, setHeadingOpen] = useState(false)
  const [codeOpen, setCodeOpen] = useState(false)
  const [codeLang, setCodeLang] = useState('')
  const [listOpen, setListOpen] = useState(false)
  const [tableModal, setTableModal] = useState(false)
  const [tableRows, setTableRows] = useState('3')
  const [tableCols, setTableCols] = useState('3')

  const headingBtnRef = useRef<HTMLButtonElement>(null)
  const codeBtnRef = useRef<HTMLButtonElement>(null)
  const listBtnRef = useRef<HTMLButtonElement>(null)

  const update = (view: NonNullable<ReturnType<EditorRef['getView']>>) => {
    const { state } = view
    const { $from } = state.selection
    const marks = state.storedMarks ?? $from.marks()
    const parent = $from.parent

    const isNodeActive = (type: string) =>
      parent.type === state.schema.nodes[type as keyof typeof state.schema.nodes]

    const isParentActive = (type: string) =>
      $from.node($from.depth)?.type === state.schema.nodes[type as keyof typeof state.schema.nodes] ||
      $from.node($from.depth - 1)?.type === state.schema.nodes[type as keyof typeof state.schema.nodes]

    let hl = 0
    if (isNodeActive('heading')) {
      hl = parent.attrs.level as number
    }
    setHeadingLevel(hl)

    let cl = ''
    if (isNodeActive('code_block')) {
      cl = parent.attrs.language as string || ''
    }
    setCodeBlockLang(cl)

    setActive({
      bold: marks.some(m => m.type === state.schema.marks.strong),
      italic: marks.some(m => m.type === state.schema.marks.emphasis),
      strike: marks.some(m => m.type === state.schema.marks.strike_through),
      heading: !!hl,
      quote: isParentActive('blockquote'),
      code: isNodeActive('code_block'),
      list: isParentActive('bullet_list'),
      listOrdered: isParentActive('ordered_list'),
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

  const run = useCallback((fn: (view: NonNullable<ReturnType<EditorRef['getView']>>) => void) => {
    const view = editorRef.current?.getView()
    if (!view) return
    fn(view)
    view.focus()
    update(view)
  }, [editorRef])

  const btn = (cmd: string, title: string, Icon: typeof Bold, onClick: () => void, extra?: React.ReactNode) => (
    <button key={cmd} title={title} onClick={onClick} className={active[cmd] ? 'active' : ''}>
      <Icon size={19} />
      {extra}
    </button>
  )

  return (
    <div className="ink-toolbar relative">
      {btn('bold', '粗体', Bold, () => run(v => toggleMark(v.state.schema.marks.strong)(v.state, v.dispatch)))}
      {btn('italic', '斜体', Italic, () => run(v => toggleMark(v.state.schema.marks.emphasis)(v.state, v.dispatch)))}
      {btn('strike', '删除线', Strikethrough, () => run(v => toggleMark(v.state.schema.marks.strike_through)(v.state, v.dispatch)))}

      <div className="ink-divider" />

      {/* Heading dropdown */}
      <div className="relative">
        <button
          ref={headingBtnRef}
          title="标题"
          onClick={() => setHeadingOpen(v => !v)}
          className={active.heading ? 'active' : ''}
        >
          <Heading size={19} />
          {active.heading && headingLevel ? (
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-seal dark:text-seal-dark leading-none">
              H{headingLevel}
            </span>
          ) : null}
        </button>
        <Dropdown open={headingOpen} onClose={() => setHeadingOpen(false)} triggerRef={headingBtnRef}>
          {[1, 2, 3, 4, 5].map(level => (
            <DropdownItem
              key={level}
              active={headingLevel === level}
              onClick={() => {
                setHeadingOpen(false)
                run(v => {
                  const { state, dispatch } = v
                  if (state.selection.$from.parent.type === state.schema.nodes.heading &&
                      state.selection.$from.parent.attrs.level === level) {
                    replaceBlock(state, dispatch, state.schema.nodes.paragraph)
                  } else {
                    setBlockType(state.schema.nodes.heading, { level })(state, dispatch)
                  }
                })
              }}
            >
            <span className="w-6 text-xs text-ink-muted dark:text-dark-text-secondary font-medium">H{level}</span>
            <span className="text-xs text-ink-muted/50 dark:text-dark-text-secondary/50">级标题</span>
            </DropdownItem>
          ))}
        </Dropdown>
      </div>

      {btn('quote', '引用', Quote, () =>
        run(v => {
          const { state, dispatch } = v
          const { $from } = state.selection
          if ($from.node($from.depth)?.type === state.schema.nodes.blockquote ||
              $from.node($from.depth - 1)?.type === state.schema.nodes.blockquote) {
            liftOut(state, dispatch, state.schema.nodes.blockquote)
          } else {
            wrapIn(state.schema.nodes.blockquote)(state, dispatch)
          }
        })
      )}

      {/* Code language dropdown */}
      <div className="relative">
        <button ref={codeBtnRef} title="代码" onClick={() => setCodeOpen(v => !v)} className={active.code ? 'active' : ''}>
          <Code size={19} />
          {active.code && codeBlockLang ? (
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-seal dark:text-seal-dark leading-none truncate max-w-[36px]">
              {codeBlockLang}
            </span>
          ) : null}
        </button>
        <Dropdown open={codeOpen} onClose={() => setCodeOpen(false)} triggerRef={codeBtnRef}>
          <div className="px-2 py-1.5 border-b border-paper-border/50 dark:border-dark-border/50">
            <input
              autoFocus
              value={codeLang}
              onChange={e => setCodeLang(e.target.value)}
              placeholder="搜索或输入语言..."
              className="w-full px-2.5 py-1.5 text-xs bg-paper dark:bg-dark-bg border border-paper-border dark:border-dark-border rounded-lg text-ink dark:text-dark-text placeholder-ink-muted/40 outline-none focus:border-seal/50 dark:focus:border-seal-dark/50 transition-colors"
              onKeyDown={e => {
                if (e.key === 'Enter' && codeLang.trim()) {
                  setCodeOpen(false)
                  run(v => {
                    const { state, dispatch } = v
                    if (state.selection.$from.parent.type === state.schema.nodes.code_block) {
                      const attrs: Record<string, unknown> = {}
                      attrs.language = codeLang.trim()
                      replaceBlock(state, dispatch, state.schema.nodes.code_block, attrs)
                    } else {
                      setBlockType(state.schema.nodes.code_block, { language: codeLang.trim() })(state, dispatch)
                    }
                  })
                }
              }}
            />
          </div>
          <div className="max-h-[180px] overflow-y-auto scrollbar-thin">
            {LANGUAGES.filter(l => !codeLang || l.includes(codeLang.toLowerCase())).map(lang => (
              <DropdownItem
                key={lang}
                active={codeBlockLang === lang}
                onClick={() => {
                  setCodeLang('')
                  setCodeOpen(false)
                  run(v => {
                    const { state, dispatch } = v
                    if (state.selection.$from.parent.type === state.schema.nodes.code_block) {
                      replaceBlock(state, dispatch, state.schema.nodes.code_block, { language: lang })
                    } else {
                      setBlockType(state.schema.nodes.code_block, { language: lang })(state, dispatch)
                    }
                  })
                }}
              >
                <span className="text-xs font-mono">{lang}</span>
              </DropdownItem>
            ))}
          </div>
        </Dropdown>
      </div>

      {/* List dropdown */}
      <div className="relative">
        <button ref={listBtnRef} title="列表" onClick={() => setListOpen(v => !v)} className={(active.list || active.listOrdered) ? 'active' : ''}>
          {(active.listOrdered && !active.list) ? <ListOrdered size={19} /> : <List size={19} />}
        </button>
        <Dropdown open={listOpen} onClose={() => setListOpen(false)} triggerRef={listBtnRef}>
          <DropdownItem
            active={!!active.list}
            onClick={() => {
              setListOpen(false)
              run(v => {
                const { state, dispatch } = v
                const { $from } = state.selection
                if ($from.node($from.depth)?.type === state.schema.nodes.bullet_list ||
                    $from.node($from.depth - 1)?.type === state.schema.nodes.bullet_list) {
                  liftOut(state, dispatch, state.schema.nodes.bullet_list)
                } else if ($from.node($from.depth)?.type === state.schema.nodes.ordered_list ||
                    $from.node($from.depth - 1)?.type === state.schema.nodes.ordered_list) {
                  const range = $from.blockRange(v.state.selection.$to, n => n.type === state.schema.nodes.ordered_list)
                  if (range) {
                    const target = liftTarget(range)
                    if (target != null) dispatch(state.tr.lift(range, target).scrollIntoView())
                  }
                } else {
                  wrapIn(state.schema.nodes.bullet_list)(state, dispatch)
                }
              })
            }}
          >
            <List size={16} /> 无序列表
          </DropdownItem>
          <DropdownItem
            active={!!active.listOrdered}
            onClick={() => {
              setListOpen(false)
              run(v => {
                const { state, dispatch } = v
                const { $from } = state.selection
                if ($from.node($from.depth)?.type === state.schema.nodes.ordered_list ||
                    $from.node($from.depth - 1)?.type === state.schema.nodes.ordered_list) {
                  liftOut(state, dispatch, state.schema.nodes.ordered_list)
                } else if ($from.node($from.depth)?.type === state.schema.nodes.bullet_list ||
                    $from.node($from.depth - 1)?.type === state.schema.nodes.bullet_list) {
                  const range = $from.blockRange(v.state.selection.$to, n => n.type === state.schema.nodes.bullet_list)
                  if (range) {
                    const target = liftTarget(range)
                    if (target != null) dispatch(state.tr.lift(range, target).scrollIntoView())
                  }
                } else {
                  wrapIn(state.schema.nodes.ordered_list)(state, dispatch)
                }
              })
            }}
          >
            <ListOrdered size={16} /> 有序列表
          </DropdownItem>
        </Dropdown>
      </div>

      {/* Table button */}
      <button title="表格" onClick={() => { setTableRows('3'); setTableCols('3'); setTableModal(true) }}>
        <Table size={19} />
      </button>

      <Modal
        open={tableModal}
        title="插入表格"
        onCancel={() => setTableModal(false)}
        onConfirm={() => {
          const rows = parseInt(tableRows) || 2
          const cols = parseInt(tableCols) || 2
          setTableModal(false)
          run(v => {
            const { state, dispatch } = v
            const schema = state.schema
            const cells = Array.from({ length: cols }, () => schema.nodes.table_cell.createAndFill())
            const headerCells = Array.from({ length: cols }, () => schema.nodes.table_header.createAndFill())
            const headerRow = schema.nodes.table_header_row.create(null, headerCells)
            const bodyRows = Array.from({ length: rows - 1 }, () => schema.nodes.table_row.create(null, cells))
            const table = schema.nodes.table.create(null, [headerRow, ...bodyRows])
            if (table) dispatch(state.tr.replaceSelectionWith(table).scrollIntoView())
          })
        }}
        confirmText="插入"
        confirmDisabled={!tableRows || !tableCols || parseInt(tableRows) < 1 || parseInt(tableCols) < 1}
      >
        <div className="flex gap-3">
          <label className="flex-1">
            <span className="block text-xs text-ink-muted dark:text-dark-text-secondary mb-1">行</span>
            <input
              autoFocus
              type="number" min={1} max={20}
              value={tableRows}
              onChange={e => setTableRows(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-paper dark:bg-dark-bg border border-paper-border dark:border-dark-border rounded text-ink dark:text-dark-text outline-none focus:border-seal"
            />
          </label>
          <label className="flex-1">
            <span className="block text-xs text-ink-muted dark:text-dark-text-secondary mb-1">列</span>
            <input
              type="number" min={1} max={20}
              value={tableCols}
              onChange={e => setTableCols(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-paper dark:bg-dark-bg border border-paper-border dark:border-dark-border rounded text-ink dark:text-dark-text outline-none focus:border-seal"
            />
          </label>
        </div>
      </Modal>
    </div>
  )
}
