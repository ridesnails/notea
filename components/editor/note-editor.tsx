import MarkdownEditor from 'rich-markdown-editor'
import { NoteModel, NoteState } from 'containers/note'
import { KeyboardEvent, useCallback, useRef, useState } from 'react'
import { TextareaAutosize } from '@material-ui/core'
import router from 'next/router'
import styled from 'styled-components'
import { has } from 'lodash'
import { darkTheme, lightTheme } from './theme'
import { useDarkMode } from 'next-dark-mode'
import useFetch from 'use-http'
import { useDebouncedCallback } from 'use-debounce'

const StyledMarkdownEditor = styled(MarkdownEditor)`
  .ProseMirror {
    min-height: calc(100vh - 14rem);
    padding-bottom: 10rem;
  }
`

const NoteEditor = () => {
  const { darkModeActive } = useDarkMode()
  const { saveNote, note } = NoteState.useContainer()
  const [title, setTitle] = useState()
  const editorEl = useRef<MarkdownEditor>(null)

  const onNoteChange = useDebouncedCallback(
    async (data: Partial<NoteModel>) => {
      const isNew = has(router.query, 'new')
      if (isNew) {
        data.pid = (router.query.pid as string) || 'root'
      }
      if (!data.title && title) {
        data.title = title
      }
      const item = await saveNote(data, isNew)
      const noteUrl = `/note/${item.id}`

      if (router.asPath !== noteUrl) {
        await router.replace(noteUrl, undefined, { shallow: true })
      }
    },
    500
  )

  const onInputTitle = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key.toLowerCase() === 'enter') {
        event.stopPropagation()
        event.preventDefault()
        editorEl.current?.focusAtEnd()
      }
    },
    []
  )

  const upload = useFetch('/api/file/upload')
  const onUploadImage = useCallback(
    async (file) => {
      const data = new FormData()
      data.append('file', file)
      const result = await upload.post(data)
      return result.url
    },
    [upload]
  )

  const onTitleChange = useCallback(
    (event) => {
      const title = event.target.value
      onNoteChange.callback({ title })
      setTitle(title)
    },
    [onNoteChange]
  )

  const onEditorChange = useCallback(
    (value: () => string): void => {
      onNoteChange.callback({ content: value() })
    },
    [onNoteChange]
  )

  return (
    <article className="pt-40 px-6 m-auto prose">
      <h1>
        <TextareaAutosize
          className="outline-none w-full resize-none block bg-transparent"
          placeholder="新页面"
          defaultValue={note.title}
          key={note.id}
          onKeyDown={onInputTitle}
          onChange={onTitleChange}
          maxLength={128}
          autoFocus
        />
      </h1>
      <StyledMarkdownEditor
        id={note.id}
        ref={editorEl}
        value={note.content}
        onChange={onEditorChange}
        theme={darkModeActive ? darkTheme : lightTheme}
        uploadImage={onUploadImage}
        onCreateLink={async () => {
          return '1'
        }}
      />
    </article>
  )
}

export default NoteEditor
