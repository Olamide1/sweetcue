import supabase from '../lib/supabase';
// Removed import type { Database } from '../lib/supabase';

type Partner = any;
type PartnerInsert = any;
type PartnerUpdate = any;

export interface PartnerProfileData {
  name: string;
  birthday?: string;
  anniversary?: string;
  loveLanguage: string;
  dislikes: string;
}

export interface PartnerResponse {
  data: Partner | null;
  error: string | null;
}

class PartnerService {
  async createPartner(profile: PartnerProfileData): Promise<PartnerResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: 'User not authenticated' };
      const insertData: PartnerInsert = {
        user_id: user.id,
        name: profile.name,
        birthday: profile.birthday || null,
        anniversary: profile.anniversary || null,
        love_language: profile.loveLanguage,
        dislikes: profile.dislikes,
      };
      const { data, error } = await supabase
        .from('partners')
        .insert(insertData)
        .select()
        .single();
      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (error) {
      return { data: null, error: 'Unexpected error' };
    }
  }

  async getPartner(): Promise<PartnerResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: 'User not authenticated' };
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (error) {
      return { data: null, error: 'Unexpected error' };
    }
  }

  async updatePartner(partnerId: string, profile: Partial<PartnerProfileData>): Promise<PartnerResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: 'User not authenticated' };
      const updateData: PartnerUpdate = {
        ...profile,
      };
      const { data, error } = await supabase
        .from('partners')
        .update(updateData)
        .eq('id', partnerId)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (error) {
      return { data: null, error: 'Unexpected error' };
    }
  }
}

export const partnerService = new PartnerService(); 