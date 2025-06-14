
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { videoUrl, bucketName, fileName } = await req.json()

    if (!videoUrl || !bucketName || !fileName) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Generating thumbnail for:', videoUrl)

    // Download the video file
    const videoResponse = await fetch(videoUrl)
    if (!videoResponse.ok) {
      throw new Error('Failed to download video')
    }

    const videoBuffer = await videoResponse.arrayBuffer()
    const videoFile = new Uint8Array(videoBuffer)

    // Create a temporary file for the video
    const tempVideoPath = `/tmp/video_${Date.now()}.mp4`
    const tempThumbnailPath = `/tmp/thumbnail_${Date.now()}.jpg`

    await Deno.writeFile(tempVideoPath, videoFile)

    // Use FFmpeg to extract thumbnail at 1 second mark
    const ffmpegCommand = new Deno.Command('ffmpeg', {
      args: [
        '-i', tempVideoPath,
        '-ss', '00:00:01.000',
        '-vframes', '1',
        '-q:v', '2',
        '-vf', 'scale=1200:630:force_original_aspect_ratio=decrease,pad=1200:630:(ow-iw)/2:(oh-ih)/2:black',
        '-y',
        tempThumbnailPath
      ],
      stdout: 'piped',
      stderr: 'piped',
    })

    const ffmpegProcess = await ffmpegCommand.output()

    if (ffmpegProcess.code !== 0) {
      console.error('FFmpeg error:', new TextDecoder().decode(ffmpegProcess.stderr))
      throw new Error('Failed to generate thumbnail')
    }

    // Read the generated thumbnail
    const thumbnailData = await Deno.readFile(tempThumbnailPath)

    // Upload thumbnail to Supabase storage
    const thumbnailFileName = fileName.replace(/\.[^/.]+$/, '_thumbnail.jpg')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(thumbnailFileName, thumbnailData, {
        contentType: 'image/jpeg',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error('Failed to upload thumbnail')
    }

    // Get public URL for the thumbnail
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(thumbnailFileName)

    // Clean up temporary files
    try {
      await Deno.remove(tempVideoPath)
      await Deno.remove(tempThumbnailPath)
    } catch (cleanupError) {
      console.warn('Cleanup error:', cleanupError)
    }

    console.log('Thumbnail generated successfully:', urlData.publicUrl)

    return new Response(
      JSON.stringify({ 
        success: true, 
        thumbnailUrl: urlData.publicUrl,
        thumbnailPath: thumbnailFileName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating thumbnail:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate thumbnail', 
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
