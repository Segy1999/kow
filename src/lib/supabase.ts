import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || "";

// In SSR mode, we use the service role key on the server for full access (bypassing RLS),
// and the anon key on the client side.
const isServer = import.meta.env.SSR;
const supabaseKey = isServer
  ? supabaseServiceKey || supabaseAnonKey
  : supabaseAnonKey;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  if (isServer) {
    console.warn(
      "⚠️ Supabase environment variables are not set. Please ensure PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) are defined.",
    );
  }
}

// Create client with SSR-compatible configuration
export const supabase: SupabaseClient =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: !isServer,
          autoRefreshToken: !isServer,
          detectSessionInUrl: !isServer,
        },
      })
    : createClient("https://placeholder.supabase.co", "placeholder-key");

// ============================================
// Type Definitions
// ============================================

export type BookingStatus = "pending" | "accepted" | "denied";

export interface Booking {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  tattoo_idea: string;
  tattoo_placement: string;
  tattoo_size: string;
  is_custom: boolean;
  reference_photos: string[];
  status: BookingStatus;
  admin_notes?: string;
  client_access_token?: string;
  agreed_price?: number;
  scheduled_date?: string;
}

export type ImageCategory = "featured" | "portfolio" | "flash";

export interface ContentImage {
  id: string;
  created_at: string;
  url: string;
  category: ImageCategory;
  title: string;
  description?: string;
  price?: number;
  size?: string;
  is_featured: boolean;
  display_order?: number;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  created_at: string;
}

export type MessageSenderRole = "admin" | "client";

export interface Message {
  id: string;
  created_at: string;
  booking_id: string;
  sender_role: MessageSenderRole;
  content: string;
}

// ============================================
// Content Images Helpers
// ============================================

export async function getContentImages(category?: ImageCategory) {
  let query = supabase
    .from("content_images")
    .select("*")
    .order("display_order", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ContentImage[];
}

export async function getFeaturedImages() {
  const { data, error } = await supabase
    .from("content_images")
    .select("*")
    .eq("is_featured", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data as ContentImage[];
}

export async function getPortfolioImages() {
  return getContentImages("portfolio");
}

export async function getFlashDesigns() {
  return getContentImages("flash");
}

export async function createContentImage(
  image: Omit<ContentImage, "id" | "created_at">,
) {
  const { data, error } = await supabase
    .from("content_images")
    .insert(image)
    .select()
    .single();

  if (error) throw error;
  return data as ContentImage;
}

export async function updateContentImage(
  id: string,
  updates: Partial<ContentImage>,
) {
  const { data, error } = await supabase
    .from("content_images")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as ContentImage;
}

export async function deleteContentImage(id: string) {
  const { error } = await supabase.from("content_images").delete().eq("id", id);

  if (error) throw error;
}

// ============================================
// Site Settings Helpers
// ============================================

export async function getSiteSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }
  return data?.value ?? null;
}

export async function setSiteSetting(key: string, value: string) {
  const { data, error } = await supabase
    .from("site_settings")
    .upsert(
      { key, value, created_at: new Date().toISOString() },
      { onConflict: "key" },
    )
    .select()
    .single();

  if (error) throw error;
  return data as SiteSetting;
}

export async function getContactInfo() {
  return getSiteSetting("contact_info");
}

export async function getPolicyText() {
  return getSiteSetting("policy_text");
}

// ============================================
// Bookings Helpers
// ============================================

export async function getBookings(status?: BookingStatus) {
  let query = supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Booking[];
}

export async function getBookingById(id: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Booking;
}

export async function getBookingByToken(token: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("client_access_token", token)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }
  return data as Booking;
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  adminNotes?: string,
) {
  const updates: Partial<Booking> = { status };
  if (adminNotes !== undefined) {
    updates.admin_notes = adminNotes;
  }

  const { data, error } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}

export async function updateBooking(id: string, updates: Partial<Booking>) {
  const { data, error } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}

export function generateClientToken(): string {
  return crypto.randomUUID();
}

// ============================================
// Messages Helpers
// ============================================

export async function getMessages(bookingId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Message[];
}

export async function sendMessage(
  bookingId: string,
  senderRole: MessageSenderRole,
  content: string,
) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      booking_id: bookingId,
      sender_role: senderRole,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Message;
}

export function subscribeToMessages(
  bookingId: string,
  callback: (message: Message) => void,
) {
  const channel = supabase
    .channel(`messages:${bookingId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `booking_id=eq.${bookingId}`,
      },
      (payload) => {
        callback(payload.new as Message);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================
// Auth Helpers
// ============================================

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// ============================================
// Storage Helpers
// ============================================

export async function uploadImage(bucket: string, file: File, path?: string) {
  const fileName =
    path || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(fileName);

  return { path: data.path, publicUrl };
}

export async function deleteImage(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) throw error;
}
