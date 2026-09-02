export type AccountStatus = 'pending_approval' | 'approved' | 'active' | 'rejected' | 'suspended'

export type AdminLevel = 'none' | 'admin' | 'super_admin'

export type MemberRole =
  | 'member'
  | 'president'
  | 'vice_president'
  | 'secretary'
  | 'joint_secretary'
  | 'treasurer'
  | 'joint_treasurer'
  | 'coordinator'
  | 'mentor'
  | 'deputy_chairman'
  | 'chairman'
  | 'vice_chairman'
  | 'working_president'
  | 'joint_working_president'
  | 'public_relation_officer'
  | 'legal_advisor'
  | 'media_spoke_person'
  | 'executive_member'

export type Gender = 'male' | 'female' | 'other'

export type FamilyRelation =
  | 'father'
  | 'mother'
  | 'spouse'
  | 'son'
  | 'daughter'
  | 'brother'
  | 'sister'
  | 'grandfather'
  | 'grandmother'
  | 'other'

export const ADMIN_ROLES: MemberRole[] = [
  'president',
  'vice_president',
  'secretary',
  'joint_secretary',
  'treasurer',
  'joint_treasurer',
  'chairman',
  'vice_chairman',
  'coordinator',
]

export const ALL_ROLES: { value: MemberRole; label_en: string; label_hi: string }[] = [
  { value: 'president', label_en: 'President', label_hi: 'अध्यक्ष' },
  { value: 'vice_president', label_en: 'Vice President', label_hi: 'उपाध्यक्ष' },
  { value: 'chairman', label_en: 'Chairman', label_hi: 'सभापति' },
  { value: 'vice_chairman', label_en: 'Vice Chairman', label_hi: 'उप सभापति' },
  { value: 'working_president', label_en: 'Working President', label_hi: 'कार्यकारी अध्यक्ष' },
  { value: 'joint_working_president', label_en: 'Joint Working President', label_hi: 'संयुक्त कार्यकारी अध्यक्ष' },
  { value: 'secretary', label_en: 'Secretary', label_hi: 'सचिव' },
  { value: 'joint_secretary', label_en: 'Joint Secretary', label_hi: 'संयुक्त सचिव' },
  { value: 'treasurer', label_en: 'Treasurer', label_hi: 'कोषाध्यक्ष' },
  { value: 'joint_treasurer', label_en: 'Joint Treasurer', label_hi: 'संयुक्त कोषाध्यक्ष' },
  { value: 'deputy_chairman', label_en: 'Deputy Chairman', label_hi: 'उप सभापति' },
  { value: 'coordinator', label_en: 'Coordinator', label_hi: 'समन्वयक' },
  { value: 'mentor', label_en: 'Mentor', label_hi: 'मार्गदर्शक' },
  { value: 'public_relation_officer', label_en: 'Public Relation Officer', label_hi: 'जनसंपर्क अधिकारी' },
  { value: 'legal_advisor', label_en: 'Legal Advisor', label_hi: 'विधि सलाहकार' },
  { value: 'media_spoke_person', label_en: 'Media & Spoke Person', label_hi: 'मीडिया प्रवक्ता' },
  { value: 'executive_member', label_en: 'Executive Member', label_hi: 'कार्यकारी सदस्य' },
  { value: 'member', label_en: 'Member', label_hi: 'सदस्य' },
]

export const FAMILY_RELATIONS: { value: FamilyRelation; label_en: string; label_hi: string }[] = [
  { value: 'father', label_en: 'Father', label_hi: 'पिता' },
  { value: 'mother', label_en: 'Mother', label_hi: 'माता' },
  { value: 'spouse', label_en: 'Spouse', label_hi: 'पति/पत्नी' },
  { value: 'son', label_en: 'Son', label_hi: 'पुत्र' },
  { value: 'daughter', label_en: 'Daughter', label_hi: 'पुत्री' },
  { value: 'brother', label_en: 'Brother', label_hi: 'भाई' },
  { value: 'sister', label_en: 'Sister', label_hi: 'बहन' },
  { value: 'grandfather', label_en: 'Grandfather', label_hi: 'दादा/नाना' },
  { value: 'grandmother', label_en: 'Grandmother', label_hi: 'दादी/नानी' },
  { value: 'other', label_en: 'Other', label_hi: 'अन्य' },
]

export interface Profile {
  id: string
  member_id: string | null
  email: string
  phone: string | null
  full_name: string
  full_name_hi: string | null
  role: MemberRole
  admin_level: AdminLevel
  account_status: AccountStatus
  is_executive_member: boolean
  gender: Gender | null
  date_of_birth: string | null
  gotra: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  profile_photo_url: string | null
  language_preference: string
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface FamilyMember {
  id: string
  user_id: string
  name: string
  name_hi: string | null
  relation: FamilyRelation
  date_of_birth: string | null
  gender: Gender | null
  occupation: string | null
  photo_url: string | null
  created_at: string
  updated_at: string
}

export interface BusinessBranch {
  id: string
  name: string
  address: string
  city: string
  phone: string
}

export interface BusinessDetail {
  id: string
  user_id: string
  business_name: string | null
  sector: string | null
  designation: string | null
  location: string | null
  description: string | null
  website: string | null
  has_website: boolean
  phone: string | null
  is_employed: boolean
  employer_name: string | null
  gst_number: string | null
  branches: BusinessBranch[]
  created_at: string
  updated_at: string
}

export interface BusinessListing {
  id: string
  user_id: string
  business_name: string
  category: string
  description_en: string | null
  description_hi: string | null
  address: string | null
  city: string | null
  state: string | null
  phone: string | null
  email: string | null
  website: string | null
  logo_url: string | null
  is_approved: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title_en: string
  title_hi: string | null
  description_en: string | null
  description_hi: string | null
  event_date: string
  end_date: string | null
  location: string | null
  image_url: string | null
  is_published: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Donation {
  id: string
  user_id: string
  amount: number
  donation_date: string
  purpose: string | null
  receipt_url: string | null
  payment_method: string | null
  transaction_id: string | null
  notes: string | null
  recorded_by: string | null
  created_at: string
}

export interface MatrimonialProfile {
  id: string
  user_id: string
  height: string | null
  education: string | null
  occupation: string | null
  income_range: string | null
  about_en: string | null
  about_hi: string | null
  preferences_en: string | null
  preferences_hi: string | null
  marital_status: string
  is_active: boolean
  is_approved: boolean
  created_at: string
  updated_at: string
  profile?: Profile
  photos?: MatrimonialPhoto[]
}

export interface MatrimonialPhoto {
  id: string
  matrimonial_id: string
  photo_url: string
  is_primary: boolean
  created_at: string
}
