import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  try {
    const hagwonName = '에듀스피어 (Edusphere)'
    
    // Get all click events for this hagwon using JSONB operators
    const { data: clicks, error: clicksError } = await supabase
      .from('page_events')
      .select('details, device_type, timestamp')
      .eq('event_type', 'cta_click')
      .contains('details', { action: 'contact_click' })
      .contains('details', { hagwon_name: hagwonName })

    if (clicksError) {
      console.error('Supabase error:', clicksError)
      throw clicksError
    }

    console.log(`Found ${clicks.length} clicks for ${hagwonName}`) // Debug log

    // Initialize counters
    let websiteClicks = 0
    let kakaoClicks = 0
    let mobileClicks = 0
    let desktopClicks = 0

    // Process each click event
    clicks.forEach(click => {
      try {
        // The details should already be parsed as an object in Supabase
        const details = click.details
        
        console.log('Processing click:', details) // Debug log
        
        // Count by contact type
        if (details.contact_type === 'Website') {
          websiteClicks++
        } else if (details.contact_type === 'KakaoTalk') {
          kakaoClicks++
        }

        // Count by device type
        if (click.device_type === 'mobile') {
          mobileClicks++
        } else if (click.device_type === 'desktop') {
          desktopClicks++
        }
      } catch (parseError) {
        console.error('Error processing click details:', parseError, click)
      }
    })

    // Get all impression events for this hagwon
    const { data: impressions, error: impressionsError } = await supabase
      .from('page_events')
      .select('details, timestamp')
      .eq('event_type', 'hagwon_impression')
      .contains('details', { action: 'card_impression' })
      .contains('details', { hagwon_name: hagwonName });

    if (impressionsError) {
      console.error('Supabase error (impressions):', impressionsError);
      throw impressionsError;
    }

    console.log(`Found ${impressions.length} impressions for ${hagwonName}`);




    const profileViews = impressions.length;
    
    // Calculate CTR (clicks/views * 100)
    const totalClicks = websiteClicks + kakaoClicks
    const ctr = profileViews > 0 ? ((totalClicks / profileViews) * 100).toFixed(2) : '0.00'

    // Format response to match dashboard expectations
    const stats = {
      profileViews,
      buttonClicks: {
        homepage: websiteClicks,    // Website clicks = homepage clicks
        click: kakaoClicks          // KakaoTalk clicks = click
      },
      ctr,
      deviceStats: {
        mobile: mobileClicks,
        desktop: desktopClicks
      }
    }

    console.log('Stats calculated:', stats) // For debugging
    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error.message 
      }, 
      { status: 500 }
    )
  }
}