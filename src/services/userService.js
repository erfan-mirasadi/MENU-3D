export async function getUserProfile(supabase, userId) {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error("Unexpected error fetching user profile:", error);
    return null;
  }
}

export async function getRestaurantStaffPushTokens(supabase, restaurantId, roles) {
  try {
    // Separate owner from regular staff roles, since owners are identified
    // via the restaurants table (owner_id), not the restaurant_id on their profile.
    const staffRoles = roles.filter(r => r !== 'owner');
    const includeOwner = roles.includes('owner');

    const queries = [];

    // 1. Fetch regular staff (waiter, chef, cashier) filtered by restaurant_id on profile.
    if (staffRoles.length > 0) {
      queries.push(
        supabase
          .from('profiles')
          .select('id, push_token, role')
          .in('role', staffRoles)
          .eq('restaurant_id', restaurantId)
          .not('push_token', 'is', null)
      );
    }

    // 2. Fetch owners: look up the restaurant's owner_id, then fetch their profile.
    if (includeOwner) {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('owner_id')
        .eq('id', restaurantId)
        .single();

      if (restaurant?.owner_id) {
        queries.push(
          supabase
            .from('profiles')
            .select('id, push_token, role')
            .eq('id', restaurant.owner_id)
            .not('push_token', 'is', null)
            .maybeSingle()
        );
      }
    }

    const results = await Promise.all(queries);

    let staff = [];

    // Collect regular staff results
    if (staffRoles.length > 0) {
      const { data, error } = results[0];
      if (error) console.error("Error fetching staff push tokens:", error);
      if (data) staff.push(...data);
    }

    // Collect owner profile from restaurant join
    if (includeOwner) {
      const ownerResult = results[staffRoles.length > 0 ? 1 : 0];
      const { data, error } = ownerResult;
      if (error) console.error("Error fetching owner push token:", error);
      if (data) staff.push(data); 
    }

    // Filter out any profiles with empty push_token arrays (no active subscriptions).
    const validStaff = staff.filter(u => {
      if (Array.isArray(u.push_token)) return u.push_token.length > 0;
      return !!u.push_token;
    });

    return validStaff;
  } catch (error) {
    console.error("Unexpected error fetching staff push tokens:", error);
    return [];
  }
}


export async function updateUserPushToken(supabase, userId, newSubscription) {
  try {
    // Fetch the user's current array of subscriptions
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!profile) return false;

    const existingTokens = Array.isArray(profile?.push_token) ? profile.push_token : [];

    // Deduplicate: only append if an identical endpoint doesn't already exist.
    const alreadyRegistered = existingTokens.some(
      (sub) => sub.endpoint === newSubscription.endpoint
    );

    if (alreadyRegistered) return true;

    const updatedTokens = [...existingTokens, newSubscription];

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ push_token: updatedTokens })
      .eq('id', userId);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error("Error updating user push token:", error);
    return false;
  }
}


export async function removeUserPushToken(supabase, userId, revokedEndpoint) {
  try {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
        console.error("fetchError in removeUserPushToken:", fetchError);
        throw fetchError;
    }
    
    if (!profile) {
        return true;
    }

    const existingTokens = Array.isArray(profile?.push_token) ? profile.push_token : [];
    const filteredTokens = existingTokens.filter((sub) => sub.endpoint !== revokedEndpoint);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ push_token: filteredTokens.length > 0 ? filteredTokens : null })
      .eq('id', userId);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error("Error removing revoked push token:", error);
    return false;
  }
}
