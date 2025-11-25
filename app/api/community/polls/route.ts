import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { UserRole } from '@/lib/supabase/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get compound_id filter
    const compoundId = searchParams.get('compound_id');
    
    // Check user permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, compound_id, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const isResident = userRoles?.some((role: UserRole) => 
      ['resident_owner', 'resident_tenant'].includes(role.role)
    );

    // Get user's compound access if resident
    const { data: userResident } = isResident ? await supabase
      .from('compound_residents')
      .select('id, compound_id:community_units(compound_id)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single() : { data: null };

    if (!compoundId && !hasAdminAccess) {
      // For residents, default to their compound
      if (isResident && userResident?.compound_id) {
        // Use resident's compound
      } else {
        return NextResponse.json({ 
          error: 'compound_id is required' 
        }, { status: 400 });
      }
    }

    // Verify access to compound
    if (compoundId) {
      const { data: compound } = await supabase
        .from('compounds')
        .select('developer_id, compound_manager_user_id')
        .eq('id', compoundId)
        .single();

      if (!compound) {
        return NextResponse.json({ error: 'Compound not found' }, { status: 404 });
      }

      if (!hasAdminAccess) {
        const canAccess = userRoles?.some((role: UserRole) => 
          (role.role === 'developer' && role.developer_id === compound.developer_id) ||
          (role.role === 'compound_manager' && compound.compound_manager_user_id === user.id) ||
          (['resident_owner', 'resident_tenant'].includes(role.role) && role.compound_id === compoundId)
        );

        if (!canAccess) {
          return NextResponse.json({ 
            error: 'Access denied to this compound' 
          }, { status: 403 });
        }
      }
    }

    let query = supabase
      .from('community_polls')
      .select(`
        id,
        compound_id,
        title,
        description,
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
        created_by_user_id,
        created_at,
        updated_at,
        compounds (
          id,
          name,
          address
        ),
        user_profiles!community_polls_created_by_user_id_fkey (
          id,
          full_name,
          profile_photo_url
        )
      `, { count: 'exact' });

    // Apply compound filter
    if (compoundId) {
      query = query.eq('compound_id', compoundId);
    } else if (isResident && userResident?.compound_id) {
      query = query.eq('compound_id', userResident.compound_id);
    }

    // For residents, only show active polls they're eligible for
    if (isResident && !hasAdminAccess) {
      const now = new Date().toISOString();
      query = query
        .eq('poll_status', 'active')
        .lte('start_datetime', now)
        .gte('end_datetime', now);
    }

    // Apply filters
    const pollType = searchParams.get('poll_type');
    const pollStatus = searchParams.get('poll_status');
    const votingMethod = searchParams.get('voting_method');
    const active = searchParams.get('active'); // true/false for active polls only

    if (pollType) {
      query = query.eq('poll_type', pollType);
    }

    if (pollStatus && !isResident) {
      query = query.eq('poll_status', pollStatus);
    }

    if (votingMethod) {
      query = query.eq('voting_method', votingMethod);
    }

    if (active === 'true') {
      const now = new Date().toISOString();
      query = query
        .eq('poll_status', 'active')
        .lte('start_datetime', now)
        .gte('end_datetime', now);
    }

    // Apply sorting
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? { ascending: true } : { ascending: false };

    switch (sortBy) {
      case 'start_datetime':
        query = query.order('start_datetime', sortOrder);
        break;
      case 'end_datetime':
        query = query.order('end_datetime', sortOrder);
        break;
      case 'title':
        query = query.order('title', sortOrder);
        break;
      case 'poll_type':
        query = query.order('poll_type', sortOrder);
        break;
      case 'created_at':
        query = query.order('created_at', sortOrder);
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    // Execute query
    const { data: polls, error, count } = await query;

    if (error) {
      console.error('Polls fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
    }

    // Get voting statistics and user vote status for each poll
    const pollsWithStats = await Promise.all(
      (polls || []).map(async (poll: any) => {
        // Get total vote count
        const { count: totalVotes } = await supabase
          .from('poll_responses')
          .select('id', { count: 'exact' })
          .eq('poll_id', poll.id);

        // Get vote distribution by option
        const { data: voteDistribution } = await supabase
          .from('poll_responses')
          .select('selected_options')
          .eq('poll_id', poll.id);

        // Calculate option vote counts
        const optionCounts: Record<string, number> = {};
        if (voteDistribution && poll.options) {
          voteDistribution.forEach((response: any) => {
            const options = Array.isArray(response.selected_options) 
              ? response.selected_options 
              : [response.selected_options];
            
            options.forEach((option: string) => {
              optionCounts[option] = (optionCounts[option] || 0) + 1;
            });
          });
        }

        // Check if current user has voted (if resident)
        let userVoted = false;
        let userVoteOptions = null;
        if (isResident && userResident) {
          const { data: userVote } = await supabase
            .from('poll_responses')
            .select('selected_options, justification')
            .eq('poll_id', poll.id)
            .eq('resident_id', userResident.id)
            .single();

          if (userVote) {
            userVoted = true;
            userVoteOptions = userVote.selected_options;
          }
        }

        // Check if poll is eligible for current user
        const isEligible = !poll.eligible_voters || 
          poll.eligible_voters.includes('all') ||
          (isResident && userResident && 
           (poll.eligible_voters.includes('residents') ||
            poll.eligible_voters.includes('owners') ||
            poll.eligible_voters.includes('tenants')));

        return {
          ...poll,
          vote_stats: {
            total_votes: totalVotes,
            option_counts: optionCounts,
            participation_rate: poll.eligible_voters === 'all' ? '0%' : '0%' // Would need compound resident count to calculate
          },
          user_status: {
            has_voted: userVoted,
            user_vote_options: userVoteOptions,
            is_eligible: isEligible
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      polls: pollsWithStats,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      compound_id,
      title,
      description,
      poll_type,
      voting_method,
      start_datetime,
      end_datetime,
      options,
      allow_multiple_choices,
      require_justification,
      anonymous_voting,
      eligible_voters
    } = body;

    // Validate required fields
    if (!compound_id || !title || !options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ 
        error: 'compound_id, title, and at least 2 options are required' 
      }, { status: 400 });
    }

    // Check user permissions
    const { data: compound } = await supabase
      .from('compounds')
      .select('developer_id, compound_manager_user_id')
      .eq('id', compound_id)
      .single();

    if (!compound) {
      return NextResponse.json({ error: 'Compound not found' }, { status: 404 });
    }

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, compound_id, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const canCreatePoll = hasAdminAccess ||
      userRoles?.some((role: UserRole) => 
        (role.role === 'developer' && role.developer_id === compound.developer_id) ||
        (role.role === 'compound_manager' && compound.compound_manager_user_id === user.id)
      );

    if (!canCreatePoll) {
      return NextResponse.json({ 
        error: 'Only compound managers and developers can create polls' 
      }, { status: 403 });
    }

    // Validate poll type
    const validPollTypes = ['feedback', 'decision', 'election', 'survey', 'other'];
    
    if (poll_type && !validPollTypes.includes(poll_type)) {
      return NextResponse.json({ 
        error: `Invalid poll type. Must be one of: ${validPollTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Validate voting method
    const validVotingMethods = ['simple', 'weighted', 'ranked'];
    
    if (voting_method && !validVotingMethods.includes(voting_method)) {
      return NextResponse.json({ 
        error: `Invalid voting method. Must be one of: ${validVotingMethods.join(', ')}` 
      }, { status: 400 });
    }

    // Validate datetime
    let startDate = start_datetime ? new Date(start_datetime) : new Date();
    let endDate = end_datetime ? new Date(end_datetime) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid datetime format' 
      }, { status: 400 });
    }

    if (endDate <= startDate) {
      return NextResponse.json({ 
        error: 'End time must be after start time' 
      }, { status: 400 });
    }

    // Validate options
    if (options.length > 10) {
      return NextResponse.json({ 
        error: 'Maximum 10 options allowed' 
      }, { status: 400 });
    }

    // Validate eligible voters
    const validEligibleVoters = ['all', 'residents', 'owners', 'tenants'];
    const eligibleVotersList = Array.isArray(eligible_voters) ? eligible_voters : ['residents'];
    
    const invalidVoters = eligibleVotersList.filter((voter: string) => !validEligibleVoters.includes(voter));
    if (invalidVoters.length > 0) {
      return NextResponse.json({ 
        error: `Invalid eligible voters: ${invalidVoters.join(', ')}. Must be one of: ${validEligibleVoters.join(', ')}` 
      }, { status: 400 });
    }

    // Create poll
    const { data: poll, error: pollError } = await supabase
      .from('community_polls')
      .insert({
        compound_id,
        title,
        description,
        poll_type: poll_type || 'feedback',
        voting_method: voting_method || 'simple',
        poll_status: 'active',
        start_datetime: startDate.toISOString(),
        end_datetime: endDate.toISOString(),
        options,
        allow_multiple_choices: allow_multiple_choices || false,
        require_justification: require_justification || false,
        anonymous_voting: anonymous_voting !== false, // Default to true
        eligible_voters: eligibleVotersList,
        created_by_user_id: user.id
      })
      .select(`
        id,
        compound_id,
        title,
        description,
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
        created_by_user_id,
        created_at,
        updated_at,
        compounds (
          id,
          name
        ),
        user_profiles!community_polls_created_by_user_id_fkey (
          full_name
        )
      `)
      .single();

    if (pollError) {
      console.error('Poll creation error:', pollError);
      return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
    }

    // TODO: Send notifications to eligible voters
    // TODO: Schedule poll closure notification

    return NextResponse.json({
      success: true,
      poll,
      message: 'Poll created and is now active for voting'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}