import supabase from '../lib/supabase';
// Removed import for Database since it does not exist

// TODO: Replace 'any' with the actual type definition for gestures table if available
type Gesture = any;
type GestureInsert = any;
type GestureUpdate = any;

export interface GestureResponse {
  data: Gesture | null;
  error: string | null;
}

export interface GesturesResponse {
  data: Gesture[] | null;
  error: string | null;
}

class GestureService {
  async getTemplates(): Promise<GesturesResponse> {
    try {
      console.log('[GestureService] Fetching gesture templates...');
      const { data, error } = await supabase
        .from('gestures')
        .select('*')
        .eq('is_template', true)
        .order('title', { ascending: true });
      
      if (error) {
        console.error('[GestureService] Error fetching templates:', error.message);
        return { data: null, error: error.message };
      }
      
      console.log('[GestureService] Fetched templates:', data?.length || 0);
      return { data: data || [], error: null };
    } catch (error) {
      console.error('[GestureService] Unexpected error fetching templates:', error);
      return { data: null, error: 'Unexpected error' };
    }
  }

  async getUserGestures(): Promise<GesturesResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: 'User not authenticated' };
      const { data, error } = await supabase
        .from('gestures')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) return { data: null, error: error.message };
      return { data: data || [], error: null };
    } catch (error) {
      return { data: null, error: 'Unexpected error' };
    }
  }

  async createGesture(gesture: Omit<GestureInsert, 'user_id'>): Promise<GestureResponse> {
    try {
      console.log('[GestureService] Creating gesture...', gesture);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[GestureService] User not authenticated');
        return { data: null, error: 'User not authenticated' };
      }
      
      // Validate that partner_id is provided
      if (!gesture.partner_id) {
        console.error('[GestureService] partner_id is required but not provided');
        return { data: null, error: 'Partner ID is required' };
      }

      // Verify that the partner exists and belongs to the user
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id')
        .eq('id', gesture.partner_id)
        .eq('user_id', user.id)
        .single();

      if (partnerError || !partner) {
        console.error('[GestureService] Partner not found or access denied:', partnerError);
        return { data: null, error: 'Partner not found or access denied' };
      }
      
      const insertData = { ...gesture, user_id: user.id };
      console.log('[GestureService] Inserting gesture data:', insertData);
      
      const { data, error } = await supabase
        .from('gestures')
        .insert(insertData)
        .select()
        .single();
        
      if (error) {
        console.error('[GestureService] Error creating gesture:', error.message, error);
        return { data: null, error: error.message };
      }
      
      console.log('[GestureService] Gesture created successfully:', data?.title);
      return { data, error: null };
    } catch (error) {
      console.error('[GestureService] Unexpected error creating gesture:', error);
      return { data: null, error: 'Unexpected error' };
    }
  }

  async updateGesture(id: string, gesture: Partial<GestureUpdate>): Promise<GestureResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: 'User not authenticated' };
      const { data, error } = await supabase
        .from('gestures')
        .update(gesture)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (error) {
      return { data: null, error: 'Unexpected error' };
    }
  }

  async deleteGesture(id: string): Promise<{ error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'User not authenticated' };
      const { error } = await supabase
        .from('gestures')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) return { error: error.message };
      return { error: null };
    } catch (error) {
      return { error: 'Unexpected error' };
    }
  }

  async searchGestures({ effort, cost, category, query }: { effort?: string; cost?: string; category?: string; query?: string }): Promise<GesturesResponse> {
    try {
      let supa = supabase.from('gestures').select('*');
      if (effort) supa = supa.eq('effort_level', effort);
      if (cost) supa = supa.eq('cost_level', cost);
      if (category) supa = supa.eq('category', category);
      if (query) supa = supa.ilike('title', `%${query}%`);
      const { data, error } = await supa.order('title', { ascending: true });
      if (error) return { data: null, error: error.message };
      return { data: data || [], error: null };
    } catch (error) {
      return { data: null, error: 'Unexpected error' };
    }
  }
}

export const gestureService = new GestureService(); 