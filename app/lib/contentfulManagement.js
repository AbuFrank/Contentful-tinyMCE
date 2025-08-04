import { createClient } from 'contentful-management'

const SPACEID = 'your space id'

// const { REACT_APP_CMA_PAT } = process.env
// if (!REACT_APP_CMA_PAT) {
//   throw new Error(
//     'Please define the REACT_APP_CMA_PAT environment variable inside .env.local'
//   )
// }
const cma = createClient({
  accessToken: '',
})

export const getContentfulMaster = async () => {
  try {
    const space = await cma.getSpace(SPACEID)
    const environment = await space.getEnvironment('master')
    return environment
  } catch (error) {
    console.error('Error fetching Contentful environment:', error)
    throw error
  }
}
