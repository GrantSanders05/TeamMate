export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          font_family: string
          join_code: string
          timezone: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          font_family?: string
          join_code: string
          timezone?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          slug?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          font_family?: string
          join_code?: string
          timezone?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: "manager" | "employee"
          display_name: string
          is_active: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: "manager" | "employee"
          display_name: string
          is_active?: boolean
          joined_at?: string
        }
        Update: {
          role?: "manager" | "employee"
          display_name?: string
          is_active?: boolean
        }
      }
      shift_types: {
        Row: {
          id: string
          organization_id: string
          name: string
          start_time: string
          end_time: string
          color: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          start_time: string
          end_time: string
          color?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          start_time?: string
          end_time?: string
          color?: string
          is_active?: boolean
        }
      }
      scheduling_periods: {
        Row: {
          id: string
          organization_id: string
          name: string
          start_date: string
          end_date: string
          period_type: "weekly" | "monthly"
          status: "draft" | "collecting" | "scheduling" | "published" | "archived"
          availability_link_token: string
          created_by: string | null
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          start_date: string
          end_date: string
          period_type: "weekly" | "monthly"
          status?: "draft" | "collecting" | "scheduling" | "published" | "archived"
          availability_link_token?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          name?: string
          start_date?: string
          end_date?: string
          period_type?: "weekly" | "monthly"
          status?: "draft" | "collecting" | "scheduling" | "published" | "archived"
          availability_link_token?: string
          published_at?: string | null
          updated_at?: string
        }
      }
      shifts: {
        Row: {
          id: string
          scheduling_period_id: string
          shift_type_id: string | null
          date: string
          start_time: string
          end_time: string
          label: string
          required_workers: number
          notes: string | null
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          scheduling_period_id: string
          shift_type_id?: string | null
          date: string
          start_time: string
          end_time: string
          label: string
          required_workers?: number
          notes?: string | null
          color?: string
          created_at?: string
        }
        Update: {
          shift_type_id?: string | null
          date?: string
          start_time?: string
          end_time?: string
          label?: string
          required_workers?: number
          notes?: string | null
          color?: string
        }
      }
      availability_responses: {
        Row: {
          id: string
          shift_id: string
          employee_id: string
          status: "available" | "unavailable" | "all_day"
          notes: string | null
          submitted_at: string
        }
        Insert: {
          id?: string
          shift_id: string
          employee_id: string
          status?: "available" | "unavailable" | "all_day"
          notes?: string | null
          submitted_at?: string
        }
        Update: {
          status?: "available" | "unavailable" | "all_day"
          notes?: string | null
          submitted_at?: string
        }
      }
      shift_assignments: {
        Row: {
          id: string
          shift_id: string
          employee_id: string | null
          manual_name: string | null
          assigned_by: string
          status: "assigned" | "dropped" | "open"
          assigned_at: string
        }
        Insert: {
          id?: string
          shift_id: string
          employee_id?: string | null
          manual_name?: string | null
          assigned_by: string
          status?: "assigned" | "dropped" | "open"
          assigned_at?: string
        }
        Update: {
          employee_id?: string | null
          manual_name?: string | null
          status?: "assigned" | "dropped" | "open"
        }
      }
      drop_requests: {
        Row: {
          id: string
          assignment_id: string
          requested_by: string
          reason: string | null
          status: "pending" | "approved" | "denied"
          reviewed_by: string | null
          created_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          assignment_id: string
          requested_by: string
          reason?: string | null
          status?: "pending" | "approved" | "denied"
          reviewed_by?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Update: {
          status?: "pending" | "approved" | "denied"
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
      }
      schedule_archives: {
        Row: {
          id: string
          scheduling_period_id: string
          organization_id: string
          snapshot_data: Json
          archived_at: string
          archived_by: string | null
        }
        Insert: {
          id?: string
          scheduling_period_id: string
          organization_id: string
          snapshot_data: Json
          archived_at?: string
          archived_by?: string | null
        }
        Update: {
          snapshot_data?: Json
          archived_by?: string | null
        }
      }
    }
  }
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Organization = Database["public"]["Tables"]["organizations"]["Row"]
export type OrganizationMember = Database["public"]["Tables"]["organization_members"]["Row"]
export type ShiftType = Database["public"]["Tables"]["shift_types"]["Row"]
export type SchedulingPeriod = Database["public"]["Tables"]["scheduling_periods"]["Row"]
export type Shift = Database["public"]["Tables"]["shifts"]["Row"]
export type AvailabilityResponse = Database["public"]["Tables"]["availability_responses"]["Row"]
export type ShiftAssignment = Database["public"]["Tables"]["shift_assignments"]["Row"]
export type DropRequest = Database["public"]["Tables"]["drop_requests"]["Row"]
export type ScheduleArchive = Database["public"]["Tables"]["schedule_archives"]["Row"]

export type UserRole = "manager" | "employee"
export type PeriodStatus = SchedulingPeriod["status"]

export interface OrganizationMembership {
  org: Organization
  member: OrganizationMember
}

export interface OrgContextValue {
  organization: Organization | null
  member: OrganizationMember | null
  memberships: OrganizationMembership[]
  role: UserRole | null
  isManager: boolean
  isLoading: boolean
  refresh: () => Promise<void>
  setActiveOrg: (organizationId: string) => void
}

export interface MemberWithProfile extends OrganizationMember {
  profile?: Profile | null
}

export interface ShiftWithRelations extends Shift {
  shift_type?: ShiftType | null
  availability_responses?: AvailabilityResponse[]
  shift_assignments?: ShiftAssignment[]
}

export interface SchedulingPeriodWithRelations extends SchedulingPeriod {
  shifts?: ShiftWithRelations[]
}

export interface DropRequestWithRelations extends DropRequest {
  assignment?: ShiftAssignment | null
  requested_by_profile?: Profile | null
  reviewed_by_profile?: Profile | null
}
