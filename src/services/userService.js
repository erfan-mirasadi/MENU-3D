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
    const { data: staff, error } = await supabase
      .from('profiles')
      .select('id, push_token, role')
      .in('role', roles)
      .eq('restaurant_id', restaurantId)
      .not('push_token', 'is', null);

    if (error) {
      console.error("Error fetching staff push tokens:", error);
      return [];
    }
    return staff || [];
  } catch (error) {
    console.error("Unexpected error fetching staff push tokens:", error);
    return [];
  }
}

export async function updateUserPushToken(supabase, userId, token) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating user push token:", error);
    return false;
  }
}
