import { useCallback, useRef } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { uploadImageToContentful } from '../utils/media'
import { useContentful } from '../context/context-sdk'
const locale = 'en-US'
const spaceId = ''

const contentfulEditUrl = (assetId) =>
  `https://app.contentful.com/spaces/${spaceId}/assets/${assetId}`

const shrinkHeight = '300px'
const fullHeight = '600px'
const excerptHeight = '300px'

// TODO export this to css file
const contentStyle = `
    body { font-family:Helvetica,Arial,sans-serif; font-size:14px }
    h3 {
      font-size: 2rem;
    }
    h4 {
      font-size: 1.75rem;
    }
    h5 {
      font-size: 1.5rem;
    }
    h6 {
      font-size: 1.25rem;
    }
    #article-nav .nav-title {
      text-align: center;
      font-weight: bold;
    }
    #article-nav ul {
      margin-left: 0;
      padding-left: 0;
    }
    #article-nav li {
      background-color: #fafafa;
      list-style: none;
      padding: 1rem .25rem;
      margin-bottom: 0.5rem;
    }
    #article-nav li a {
      text-decoration: none;
      color: #737373;
    }
    .alignleft {
      float: left;
      margin-right: 10px;
    }
    .aligncenter {
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
    .alignright {
      float: right;
      margin-left: 10px;
    }
    .button-primary {
      background-color: #9a3324;
      color: white;
      font-weight: bold;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
    }
    .caption {
      margin-bottom: 0;
    }
    .caption + span {
      display: inline-block;
      font-weight: bold;
      text-align: center;
      width: 100%;
    }
    .headshot {
      margin: 10px 0 20px 20px;
      max-width: 150px;
      height: auto;
    }
    .headshot-rounded {
      float: right;
      margin: 10px 0 20px 20px;
      max-width: 150px;
      height: auto;
      border-radius: 50%;
    }
    .img-sm {
      max-width: 350px;
      height: auto;
    }
    .img-md {
      max-width: 450px;
      height: auto;
    }  
    .img-lg {
      max-width: 750px;
      height: auto;
    }
    .section-header {
      color: white;
      background-color: #9d9d9d;
      padding: 0.5rem 1rem;
      font-size: 15px;
      letter-spacing: .1rem;
      text-transform: uppercase;
      font-style: sans-serif;
      @apply text-white py-2 pl-3 uppercase font-bold text-[15px] tracking-widest font-sans 
    }
    .view-larger {
      width: 100%;
      text-align: center;
      margin-top: -1rem;
      font-style: bold;
      margin-bottom: 1rem;
    }
    .w-full {
      width: 100%;
      height: auto;
    }
  `

const Field = (props) => {
  const editorRef = useRef(null)

  const { sdk, isLoading, cma, error } = useContentful()

  const handleUpload = useCallback(async (blobInfo, progress) => {
    try {
      const uploadUrl = await uploadImageToContentful(blobInfo, progress)
      if (!uploadUrl) {
        return
      }
      progress(100, 'Uploaded successfully')
      return uploadUrl
    } catch (err) {
      console.error('Error uploading image: ', err)
    }
  }, [])

  const filePicker = useCallback(
    (callback, _value, meta) => {
      if (meta.filetype !== 'image') return

      // Pagination state
      let page = 1
      const limit = 50
      let total = 0
      let loading = false

      // Helper to fetch & render a page
      const renderPage = async (pageNum, dialogApi) => {
        if (loading) return
        loading = true
        const headerEl = document.getElementById('cf-header')
        const container = document.getElementById('cf-assets')
        if (!container) return

        if (headerEl) headerEl.innerText = `Page ${pageNum}`
        container.innerHTML = 'Loading…'

        try {
          const res = await cma.asset.getMany({
            query: {
              mimetype_group: 'image',
              skip: (pageNum - 1) * limit,
              limit,
              order: '-sys.createdAt',
            },
          })

          total = res.total
          container.innerHTML = `Page ${pageNum} (${total} total)`

          res.items.forEach((asset) => {
            const fileField = asset.fields.file[locale]
            const broken = !fileField?.url
            if (broken) {
              // links missing url
              const link = document.createElement('a')
              link.href = contentfulEditUrl(asset.sys.id)
              link.target = '_blank'
              link.innerText = 'Edit asset'
              link.style.color = 'red'
              container.appendChild(link)
            } else {
              const src = 'https:' + fileField.url
              const img = document.createElement('img')
              img.src = `${src}?w=80&h=80&fit=thumb`
              img.title = asset.fields.title || ''
              img.style.cursor = 'pointer'
              img.onclick = () => {
                callback(src, { alt: asset.fields.title })
                dialogApi.close()
              }
              container.appendChild(img)
            }
          })

          // Update buttons and title
          const maxPage = Math.ceil(total / limit)
          dialogApi.setEnabled('prev', pageNum > 1)
          dialogApi.setEnabled('next', pageNum < maxPage)
        } catch (err) {
          console.error('Error loading assets', err)
          const container = document.getElementById('cf-assets')
          if (container)
            container.innerHTML =
              '<p style="color:red">Failed to load images.</p>'
        } finally {
          loading = false
        }
      }

      // Open dialog with onAction handler
      const dialogApi = editorRef.current.windowManager.open({
        title: 'Select an image',
        size: 'large',
        body: {
          type: 'panel',
          items: [
            {
              type: 'htmlpanel',
              html: '<div id="cf-assets" style="display:grid;grid-template-columns:repeat(auto-fill,80px);gap:8px;max-height:400px;overflow:auto;padding:8px">Loading…</div>',
            },
          ],
        },
        buttons: [
          { type: 'custom', name: 'prev', text: 'Previous', enabled: false },
          { type: 'custom', name: 'next', text: 'Next', enabled: false },
          { type: 'cancel', text: 'Close' },
        ],
        onAction: async (api, details) => {
          if (details.name === 'next') {
            page += 1
            await renderPage(page, api)
          }
          if (details.name === 'prev') {
            page -= 1
            await renderPage(page, api)
          }
        },
      })

      // Initial render
      renderPage(page, dialogApi)
    },
    [cma]
  )

  /* NO HOOKS BELOW THIS LINE */

  if (isLoading || !sdk || !cma) {
    return <div>Loading.....</div>
  }

  if (error) {
    console.error('Error loading SDK or CMA:', error)
    return (
      <div>
        Error loading editor, see console for details. Error message:{' '}
        {error.message}
      </div>
    )
  }

  return (
    <Editor
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
      init={{
        images_upload_handler: handleUpload,
        file_picker_types: 'image',
        file_picker_callback: filePicker,

        // actions triggered by custom buttons
        formats: {
          alignleft: { selector: 'img', classes: 'alignleft' },
          aligncenter: { selector: 'img', classes: 'aligncenter' },
          alignright: { selector: 'img', classes: 'alignright' },
          alignjustify: { selector: 'img', classes: 'w-full' },
          headshot: { selector: 'img', classes: 'headshot' },
          'headshot-rounded': { selector: 'img', classes: 'headshot-rounded' },
          'section-header': { selector: 'h6', classes: 'section-header' },
          'view-larger': { selector: 'img', classes: 'caption' },
        },
        // image_list: images,
        height:
          sdk?.field?.id === 'content' || sdk?.field?.getValue()?.length > 0
            ? fullHeight
            : sdk?.field?.id === 'excerpt'
            ? excerptHeight
            : shrinkHeight,
        menubar: 'file edit view',
        plugins: [
          'advlist',
          'autolink',
          'lists',
          'link',
          'image',
          'charmap',
          'preview',
          'anchor',
          'searchreplace',
          'visualblocks',
          'code',
          'fullscreen',
          'insertdatetime',
          'media',
          'table',
          'code',
          'help',
          'wordcount',
        ],
        toolbar:
          'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify toggleHeadshot toggleHeadshotRounded | image imageSizer | link addAnchor | code | bullist numlist outdent indent | ' +
          'removeformat | help | myCustomToolbarButton | custom-class-toggle toggleEditorCollapse',
        toolbar_sticky: true,
        toolbar_sticky_offset: 0,
        toolbar_location: 'top',
        toolbar_items_size: 'small',
        toolbar_persist: true,
        toolbar_persist_state: true,
        toolbar_mode: 'wrap',
        content_style: contentStyle,
        // Dark Mode >>>>>>
        // skin: window.matchMedia('(prefers-color-scheme: dark)').matches
        //   ? 'oxide-dark'
        //   : 'oxide',
        // content_css: window.matchMedia('(prefers-color-scheme: dark)').matches
        //   ? 'dark'
        //   : 'default',
        // Dark Mode <<<<<
        setup: (editor) => {
          // Button for collapsing/expanding the editor
          editor.ui.registry.addButton('toggleEditorCollapse', {
            text: 'Collapse Editor',
            tooltip: 'Collapse / Expand editor',

            onAction: () => {
              // grab the root container
              const root = editor.getContainer()
              // content + status bar live under these selectors
              const main = root.querySelector('.tox-edit-area__iframe')
              if (!main) return
              // determine current state
              const isCollapsed = main.style.height === shrinkHeight
              // toggle collapse
              root.style.height = isCollapsed ? fullHeight : shrinkHeight
              main.style.height = isCollapsed ? fullHeight : shrinkHeight
            },
          })

          editor.ui.registry.addMenuItem('addAnchor', {
            text: 'Add anchor tag',
            icon: 'anchor',
            onAction: () => {
              // Open a tiny prompt dialog
              editor.windowManager.open({
                title: 'Add Anchor ID',
                body: {
                  type: 'panel',
                  items: [
                    {
                      type: 'input',
                      name: 'anchorId',
                      label: 'Anchor ID',
                    },
                  ],
                },
                buttons: [
                  { type: 'cancel', text: 'Cancel' },
                  { type: 'submit', text: 'Apply', primary: true },
                ],
                onSubmit: (api) => {
                  const data = api.getData()
                  const id = data.anchorId && data.anchorId.trim()
                  if (id) {
                    // Get the node you want to anchor — here the block parent of the cursor
                    const node = editor.selection.getNode()
                    // Apply the id attribute
                    editor.dom.setAttrib(node, 'id', id)
                  }
                  api.close()
                },
              })
            },
          })

          editor.ui.registry.addToggleButton('toggleHeadshot', {
            icon: 'user',
            tooltip: 'Add ".headshot" to image',
            onAction: () =>
              editor.execCommand('mceToggleFormat', false, 'headshot'),
          })

          editor.ui.registry.addToggleButton('toggleHeadshotRounded', {
            icon: 'emoji',
            tooltip: 'Add a _rounded_ ".headshot" to image',
            onAction: () =>
              editor.execCommand('mceToggleFormat', false, 'headshot-rounded'),
          })

          // Change the selected image to a specific width
          editor.ui.registry.addSplitButton('imageSizer', {
            text: 'Image Size',
            tooltip: 'Set image size class',
            fetch: function (callback) {
              const items = [
                {
                  type: 'choiceitem',
                  text: 'Small (350px)',
                  value: 'img-sm',
                },
                {
                  type: 'choiceitem',
                  text: 'Medium (450px)',
                  value: 'img-md',
                },
                {
                  type: 'choiceitem',
                  text: 'Large (750px)',
                  value: 'img-lg',
                },
              ]
              callback(items)
            },
            onAction: function (_api) {
              // Default action (optional)
            },
            onItemAction: function (_api, value) {
              // Remove previous size classes before adding the new one
              const selectedNode = editor.selection.getNode()

              if (selectedNode && selectedNode.nodeName === 'IMG') {
                editor.dom.removeClass(selectedNode, 'img-sm')
                editor.dom.removeClass(selectedNode, 'img-md')
                editor.dom.removeClass(selectedNode, 'img-lg')
                editor.dom.removeClass(selectedNode, 'w-full')

                editor.dom.addClass(selectedNode, value)
              } else {
                editor.notificationManager.open({
                  text: 'Please select an image to apply size.',
                  type: 'error',
                  timeout: 3000,
                })
              }
            },
          })

          /* example, adding a toolbar menu button */
          // https://www.tiny.cloud/docs/tinymce/latest/custom-menu-toolbar-button/#menu-button-example-and-explanation
          editor.ui.registry.addMenuButton('custom-class-toggle', {
            text: 'Custom',
            fetch: (callback) => {
              const items = [
                {
                  type: 'menuitem',
                  text: '"View larger image" styles',
                  onAction: () =>
                    editor.execCommand('mceToggleFormat', false, 'view-larger'),
                },
                {
                  type: 'menuitem',
                  text: 'Add ".section-header" class',
                  onAction: () =>
                    editor.execCommand(
                      'mceToggleFormat',
                      false,
                      'section-header'
                    ),
                },
              ]
              callback(items)
            },
          })
        },
      }}
      initialValue={sdk?.field?.getValue() || ''}
      onInit={(_evt, editor) => (editorRef.current = editor)}
      onEditorChange={(value, editor) => {
        sdk.field.setValue(value)
      }}
    />
  )
}

export default Field
