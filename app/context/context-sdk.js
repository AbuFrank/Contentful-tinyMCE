// Context for the Contentful app SDK
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useEffect,
  useState,
} from 'react'
import { init } from '@contentful/app-sdk'

import { createClient as createCmaClient } from 'contentful-management'

const initialState = {
  sdk: null,
  cma: null,
  isLoading: true,
  error: null,
}

const ContentfulContext = createContext(initialState)

export const ContentfulProvider = ({ children }) => {
  const [sdk, setSdk] = useState(null)
  // const [cma, setCma] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const initializeSdk = useCallback(async () => {
    try {
      await init((sdkInstance) => {
        if (!sdkInstance) {
          throw new Error('Failed to initialize Contentful SDK')
        }
        // Automatically resize the app to fit the content
        sdkInstance.window.startAutoResizer()
        setSdk(sdkInstance)
      })
    } catch (err) {
      console.error('Error initializing Contentful SDK:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    console.log('Initializing Contentful SDK...')
    initializeSdk()
  }, [initializeSdk])

  // Build CMA client once sdk is ready
  const cma = useMemo(() => {
    if (!sdk) return null
    return createCmaClient(
      { apiAdapter: sdk.cmaAdapter },
      {
        type: 'plain',
        defaults: {
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
        },
      }
    )
  }, [sdk])

  return (
    <ContentfulContext.Provider value={{ sdk, cma, isLoading, error }}>
      {children}
    </ContentfulContext.Provider>
  )
}

export const useContentful = () => {
  const context = useContext(ContentfulContext)
  if (context === undefined) {
    throw new Error('useContentful must be used within a ContentfulProvider')
  }
  return context
}
