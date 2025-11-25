import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const pollId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      selected_options,
      justification,
      ranking // For ranked voting
    } = body;

    // Get poll details
    const { data: poll, error: fetchError } = await supabase
      .from('community_polls')
      .select(`
        id,
        compound_id,
        title,
        poll_type,
        voting_method,
        poll_status,
        start_datetime,
        end_datetime,
        options,
        allow_multiple_choices,
        require_justification,
        anonymous_voting,
        eligible_voters,
        compounds (
          id,
          name
        )
      `)
      .eq('id', pollId)
      .single();

    if (fetchError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Check if poll is active and within voting period
    if (poll.poll_status !== 'active') {
      return NextResponse.json({ 
        error: 'This poll is not active' 
      }, { status: 400 });
    }

    const now = new Date();
    const startTime = new Date(poll.start_datetime);
    const endTime = new Date(poll.end_datetime);

    if (now < startTime) {
      return NextResponse.json({ 
        error: 'Voting has not started yet' 
      }, { status: 400 });
    }

    if (now > endTime) {
      return NextResponse.json({ 
        error: 'Voting period has ended' 
      }, { status: 400 });
    }

    // Get user's resident record and check eligibility
    const { data: resident } = await supabase
      .from('compound_residents')
      .select(`
        id,
        user_id,
        resident_type,
        community_units (
          compound_id
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('community_units.compound_id', poll.compound_id)
      .single();

    if (!resident) {
      return NextResponse.json({ 
        error: 'You must be a resident of this compound to vote' 
      }, { status: 403 });
    }

    // Check voter eligibility
    const isEligible = poll.eligible_voters.includes('all') ||
      poll.eligible_voters.includes('residents') ||
      (poll.eligible_voters.includes('owners') && resident.resident_type === 'owner') ||
      (poll.eligible_voters.includes('tenants') && resident.resident_type === 'tenant');

    if (!isEligible) {
      return NextResponse.json({ 
        error: 'You are not eligible to vote in this poll' 
      }, { status: 403 });
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('poll_responses')
      .select('id')
      .eq('poll_id', pollId)
      .eq('resident_id', resident.id)
      .single();

    if (existingVote) {
      return NextResponse.json({ 
        error: 'You have already voted in this poll' 
      }, { status: 409 });
    }

    // Validate selected options
    if (!selected_options || (!Array.isArray(selected_options) && typeof selected_options !== 'string')) {
      return NextResponse.json({ 
        error: 'selected_options is required' 
      }, { status: 400 });
    }

    const optionsArray = Array.isArray(selected_options) ? selected_options : [selected_options];

    // Check if multiple choices are allowed
    if (!poll.allow_multiple_choices && optionsArray.length > 1) {
      return NextResponse.json({ 
        error: 'This poll allows only one choice' 
      }, { status: 400 });
    }

    // Validate that selected options exist in poll
    const invalidOptions = optionsArray.filter((option: string) => !poll.options.includes(option));
    if (invalidOptions.length > 0) {
      return NextResponse.json({ 
        error: `Invalid options: ${invalidOptions.join(', ')}` 
      }, { status: 400 });
    }

    // Check if justification is required
    if (poll.require_justification && !justification) {
      return NextResponse.json({ 
        error: 'Justification is required for this poll' 
      }, { status: 400 });
    }

    // Validate ranking for ranked voting
    let voteWeight = 1;
    let processedOptions = optionsArray;
    
    if (poll.voting_method === 'ranked') {
      if (!ranking || !Array.isArray(ranking)) {
        return NextResponse.json({ 
          error: 'Ranking is required for ranked voting' 
        }, { status: 400 });
      }

      // Validate ranking contains all selected options
      const rankingOptions = ranking.map((item: any) => item.option);
      const missingOptions = optionsArray.filter((option: string) => !rankingOptions.includes(option));
      
      if (missingOptions.length > 0) {
        return NextResponse.json({ 
          error: 'Ranking must include all selected options' 
        }, { status: 400 });
      }

      processedOptions = ranking;
    } else if (poll.voting_method === 'weighted') {
      // For weighted voting, could implement different logic
      // For now, treat as simple voting
      voteWeight = 1;
    }

    // Create vote record
    const { data: vote, error: voteError }: { data: any, error: any } = await supabase
      .from('poll_responses')
      .insert({
        poll_id: pollId,
        resident_id: resident.id,
        selected_options: processedOptions,
        justification,
        vote_weight: voteWeight,
        is_anonymous: poll.anonymous_voting,
        voted_at: new Date().toISOString()
      })
      .select(`
        id,
        poll_id,
        resident_id,
        selected_options,
        justification,
        vote_weight,
        is_anonymous,
        voted_at,
        created_at,
        community_polls (
          title,
          voting_method
        )
      `)
      .single();

    if (voteError) {
      console.error('Vote creation error:', voteError);
      return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 });
    }

    // TODO: Send confirmation to voter (if not anonymous)
    // TODO: Update poll statistics
    // TODO: Check if poll should be auto-closed (e.g., if all residents voted)

    const responseData: any = {
      success: true,
      vote: {
        id: vote.id,
        poll_title: vote.community_polls.title,
        selected_options: poll.anonymous_voting ? null : vote.selected_options,
        voted_at: vote.voted_at,
        voting_method: vote.community_polls.voting_method
      },
      message: `Your vote has been recorded for "${poll.title}"`
    };

    // Hide sensitive data for anonymous voting
    if (poll.anonymous_voting) {
      delete responseData.vote.selected_options;
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const pollId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get poll details and user's vote if it exists
    const { data: poll } = await supabase
      .from('community_polls')
      .select(`
        id,
        title,
        poll_status,
        anonymous_voting,
        end_datetime,
        compounds (
          id,
          name
        )
      `)
      .eq('id', pollId)
      .single();

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Get user's resident record
    const { data: resident } = await supabase
      .from('compound_residents')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!resident) {
      return NextResponse.json({ 
        error: 'Resident record not found' 
      }, { status: 403 });
    }

    // Get user's vote
    const { data: userVote } = await supabase
      .from('poll_responses')
      .select(`
        id,
        selected_options,
        justification,
        vote_weight,
        voted_at
      `)
      .eq('poll_id', pollId)
      .eq('resident_id', resident.id)
      .single();

    if (!userVote) {
      return NextResponse.json({ 
        error: 'You have not voted in this poll' 
      }, { status: 404 });
    }

    // Prepare response data
    const responseData = {
      success: true,
      poll: {
        id: poll.id,
        title: poll.title,
        compound_name: poll.compounds.name,
        poll_status: poll.poll_status,
        end_datetime: poll.end_datetime
      },
      vote: {
        id: userVote.id,
        voted_at: userVote.voted_at,
        vote_weight: userVote.vote_weight
      }
    };

    // Include vote details only if not anonymous or if poll is closed
    const pollEnded = new Date() > new Date(poll.end_datetime);
    const showVoteDetails = !poll.anonymous_voting || pollEnded;

    if (showVoteDetails) {
      (responseData.vote as any) = {
        ...responseData.vote,
        selected_options: userVote.selected_options,
        justification: userVote.justification
      };
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}