'use client'
// import { SDKProvider } from '@contentful/react-apps-toolkit'
import Field from './components/Field'
import { ContentfulProvider } from './context/context-sdk'

export default function Home() {
  return (
    <ContentfulProvider>
      <Field />
    </ContentfulProvider>
  )
}
