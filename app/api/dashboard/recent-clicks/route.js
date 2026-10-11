import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

// Public on purpose: the EduSphere partner dashboard (app/hagwon-dashboard)
// calls this without a Supabase login. It returns only aggregate click and
// impression data for that one hagwon.

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const hagwonName = '에듀스피어 (Edusphere)'
    
    // Get recent click events for this hagwon, ordered by timestamp (newest first)
    const { data: clicks, error } = await supabase
      .from('page_events')
      .select('id, details, device_type, timestamp')
      .eq('event_type', 'cta_click')
      .contains('details', { action: 'contact_click' })
      .contains('details', { hagwon_name: hagwonName })
      .order('timestamp', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    console.log(`Found ${clicks.length} recent clicks for ${hagwonName}`) // Debug log

    // Transform the data to match your dashboard component format
    const recentClicks = clicks.map(click => {
      const details = click.details
      
      // Map contact_type to the format your dashboard expects
      let type
      if (details.contact_type === 'Website') {
        type = 'homepage'
      } else if (details.contact_type === 'KakaoTalk') {
        type = 'click'
      } else {
        type = 'unknown'
      }
      
      return {
        id: click.id,
        type: type,
        timestamp: click.timestamp,
        device: click.device_type
      }
    })

    console.log('Transformed recent clicks:', recentClicks.slice(0, 3)) // Debug log (first 3)
    return NextResponse.json(recentClicks)

  } catch (error) {
    console.error('Error fetching recent clicks:', error)
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error.message 
      }, 
      { status: 500 }
    )
  }
}