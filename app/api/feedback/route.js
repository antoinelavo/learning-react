import { supabase } from '@/lib/supabase' // or wherever your supabase client is
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { selectedOptions, otherText } = body
    
    const { data, error } = await supabase
      .from('feedback_submissions')
      .insert([
        {
          selected_options: selectedOptions,
          other_feedback: otherText,
          user_agent: request.headers.get('user-agent'),
          page_url: request.headers.get('referer')
        }
      ])

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to submit feedback' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}