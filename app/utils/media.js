const spaceId = 'yourSpaceId' // replace with contentful space ID
const accessToken = process.env.NEXT_PUBLIC_CONTENTFUL_PAT // Replace with your Contentful access token

const uploadImage = (buffer) =>
  fetch(`https://upload.contentful.com/spaces/${spaceId}/uploads`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
    },
    body: buffer,
  })

const createAsset = (type, id, fileName) =>
  fetch(
    `https://api.contentful.com/spaces/${spaceId}/environments/master/assets`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.contentful.management.v1+json',
      },
      body: JSON.stringify({
        fields: {
          title: {
            'en-US': fileName,
          },
          file: {
            'en-US': {
              fileName: fileName,
              contentType: type,
              uploadFrom: {
                sys: {
                  type: 'Link',
                  linkType: 'Upload',
                  id: id,
                },
              },
            },
          },
        },
      }),
    }
  )

const processAsset = (assetId) =>
  fetch(
    `https://api.contentful.com/spaces/${spaceId}/environments/master/assets/${assetId}/files/en-US/process`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

const checkAssetProcessed = async (
  assetId,
  locale = 'en-US',
  maxRetries = 10,
  delay = 1000
) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(
      `https://api.contentful.com/spaces/${spaceId}/environments/master/assets/${assetId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
      }
    )
    if (!res.ok) {
      throw new Error(`Failed to fetch asset status: ${res.status}`)
    }
    const asset = await res.json()
    const file = asset.fields?.file?.[locale]
    // Check if it's processed (i.e. has a URL)
    if (file?.url) {
      return asset
    }
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
  throw new Error('Asset processing timed out.')
}

const publishAsset = (assetId, version) =>
  fetch(
    `https://api.contentful.com/spaces/${spaceId}/environments/master/assets/${assetId}/published`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Contentful-Version': version.toString(),
      },
    }
  )

export async function uploadImageToContentful(blobInfo, progress) {
  const blob = blobInfo.blob()
  const fileName = blobInfo.filename()
  const contentType = blob.type
  const arrayBuffer = await blob.arrayBuffer()

  try {
    const uploadResponse = await uploadImage(arrayBuffer)
    if (!uploadResponse.ok) {
      throw new Error('Failed to upload image to Contentful')
    }

    const uploadData = await uploadResponse.json()
    const uploadId = uploadData.sys.id

    // Step 2: Create asset linked to the upload
    progress(20, 'Creating asset in Contentful...')
    const assetResponse = await createAsset(contentType, uploadId, fileName)
    if (!assetResponse.ok) {
      throw new Error('Failed to create asset in Contentful')
    }
    const assetData = await assetResponse.json()
    const assetId = assetData.sys.id

    // Step 3: Wait for processing to complete (polling)
    progress(40, 'Processing asset in Contentful...')
    const processAssetResponse = await processAsset(assetId)
    if (!processAssetResponse.ok) {
      throw new Error('Failed to process asset in Contentful')
    }

    // Step 4: Check if the asset is processed
    progress(60, 'Checking if asset is processed...')
    const processedAsset = await checkAssetProcessed(assetId)
    if (!processedAsset) {
      throw new Error('Failed to process asset in Contentful')
    }

    const version = processedAsset.sys.version

    // Step 5: Publish the asset
    progress(80, 'Publishing asset in Contentful...')
    const publishedAssetResponse = await publishAsset(assetId, version)
    if (!publishedAssetResponse.ok) {
      throw new Error('Failed to publish asset in Contentful')
    }
    const publishedAsset = await publishedAssetResponse.json()

    // Step 6: Return the CDN URL to TinyMCE
    const url = publishedAsset.fields.file['en-US'].url
    return url.startsWith('//') ? `https:${url}` : url
  } catch (error) {
    console.error('ERROR in media.js: ', error)
    throw error
  }
}
