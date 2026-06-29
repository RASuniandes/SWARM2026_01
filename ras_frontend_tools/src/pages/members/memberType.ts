export interface Member {
  id: string
  name: string
  role?: string
  contributions?: string[]
  project?: string
  uCode?: string
  email: string
  joinDate: string
  goals?: string[]
  major: string
  doubleMajor?: string
  isInCouncil: boolean
  skills?: string[]
  photo?: string
  phoneNumber?: string
}

export interface MemberCardProps {
  member: Member
}
