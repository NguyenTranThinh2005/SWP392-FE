/**
 * Client-side proposals store backed by localStorage.
 * Enforces BR-14 (Proposal Lifecycle), BR-19 (Single Active Proposal Limit).
 */

export type ProposalStatus = 'Draft' | 'Pending Review' | 'Under Review' | 'Approved' | 'Rejected'

export interface Proposal {
  id: string
  title: string
  genre: string
  publicationType: 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Quarterly' | 'One-Shot'
  synopsis: string
  samplePages: number
  mangakaId: string
  status: ProposalStatus
  createdAt: string
  submittedAt?: string
  coverImageUrl?: string
}

const STORAGE_KEY = 'mangaflow_proposals'

// Pre-seeded mock data matching PROPOSAL_DOCUMENTATION.md §7
const SEED_PROPOSALS: Proposal[] = [
  {
    id: 'PR01',
    title: 'Whispers of the Deep',
    genre: 'Fantasy, Horror',
    publicationType: 'Monthly',
    synopsis:
      'An ancient undersea civilization awakens after millennia of slumber. Haruto, a marine biologist, discovers a mysterious signal below the Mariana Trench — only to realize it is a distress call from beings that predate humanity. Together with a reluctant mermaid guide, they must navigate treacherous ocean depths, deciphering a forgotten language and bargaining with eldritch gods, all while a military faction races to weaponize the discovery.',
    samplePages: 12,
    mangakaId: 'U02',
    status: 'Approved',
    createdAt: '2026-04-01T09:00:00.000Z',
    submittedAt: '2026-04-02T10:00:00.000Z',
  },
  {
    id: 'PR02',
    title: 'Sakura Knights',
    genre: 'Action, Romance',
    publicationType: 'Weekly',
    synopsis:
      'In feudal Japan reimagined with magitech armor, five orphaned warriors bearing enchanted cherry-blossom insignia must unite to repel a demon warlord who can only be slain once all five blades resonate in unison. The catch: two of them are in love and two more have an unresolved blood-feud. As alliances fracture and blossoms fall, they discover the armor itself is alive — and hungers for something darker than victory.',
    samplePages: 8,
    mangakaId: 'U01',
    status: 'Under Review',
    createdAt: '2026-04-15T14:00:00.000Z',
    submittedAt: '2026-04-16T08:30:00.000Z',
  },
]

function loadFromStorage(): Proposal[] {
  if (typeof window === 'undefined') return SEED_PROPOSALS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // First visit — seed data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PROPOSALS))
      return SEED_PROPOSALS
    }
    return JSON.parse(raw) as Proposal[]
  } catch {
    return SEED_PROPOSALS
  }
}

function saveToStorage(proposals: Proposal[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals))
}

// ---------- Public API ----------

export function getProposals(): Proposal[] {
  return loadFromStorage()
}

export function getProposalsByMangaka(mangakaId: string): Proposal[] {
  return loadFromStorage().filter((p) => p.mangakaId === mangakaId)
}

export function getProposalById(id: string): Proposal | undefined {
  return loadFromStorage().find((p) => p.id === id)
}

/**
 * BR-19: Returns true if the mangaka already has a proposal in Pending Review or Under Review.
 */
export function hasPendingProposal(mangakaId: string): boolean {
  return loadFromStorage().some(
    (p) =>
      p.mangakaId === mangakaId &&
      (p.status === 'Pending Review' || p.status === 'Under Review'),
  )
}

/**
 * BR-17: Returns true if there is already an Active series with this exact title.
 * (We store active series titles separately; here we just check approved proposals.)
 */
export function isTitleDuplicate(title: string, excludeId?: string): boolean {
  const all = loadFromStorage()
  return all.some(
    (p) =>
      p.title.toLowerCase() === title.toLowerCase() &&
      p.status !== 'Rejected' &&
      p.id !== excludeId,
  )
}

/**
 * Save a new proposal as Draft — BR-19 only blocks Submit, not Draft save.
 */
export function saveDraft(
  data: Omit<Proposal, 'id' | 'status' | 'createdAt'>,
): Proposal {
  const proposals = loadFromStorage()
  const newProposal: Proposal = {
    ...data,
    id: `PR${String(proposals.length + 1).padStart(2, '0')}`,
    status: 'Draft',
    createdAt: new Date().toISOString(),
  }
  proposals.push(newProposal)
  saveToStorage(proposals)
  return newProposal
}

/**
 * Submit a proposal for review — sets status to Pending Review.
 * Caller must validate BR-15, BR-17, BR-19 before calling this.
 */
export function submitProposal(
  data: Omit<Proposal, 'id' | 'status' | 'createdAt' | 'submittedAt'>,
): Proposal {
  const proposals = loadFromStorage()
  const newProposal: Proposal = {
    ...data,
    id: `PR${String(proposals.length + 1).padStart(2, '0')}`,
    status: 'Pending Review',
    createdAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  }
  proposals.push(newProposal)
  saveToStorage(proposals)
  return newProposal
}

/**
 * Update an existing draft proposal (BR-16: only drafts can be edited).
 */
export function updateDraft(
  id: string,
  updates: Partial<Omit<Proposal, 'id' | 'mangakaId' | 'createdAt'>>,
): Proposal | null {
  const proposals = loadFromStorage()
  const idx = proposals.findIndex((p) => p.id === id)
  if (idx === -1) return null
  const existing = proposals[idx]
  if (existing.status !== 'Draft') return null // BR-16 guard
  const updated = { ...existing, ...updates }
  proposals[idx] = updated
  saveToStorage(proposals)
  return updated
}

/**
 * Delete a Draft proposal.
 */
export function deleteDraft(id: string): boolean {
  const proposals = loadFromStorage()
  const idx = proposals.findIndex((p) => p.id === id && p.status === 'Draft')
  if (idx === -1) return false
  proposals.splice(idx, 1)
  saveToStorage(proposals)
  return true
}

/**
 * Update the status of any proposal (e.g. approve or reject by Editorial Board).
 */
export function updateProposalStatus(id: string, status: ProposalStatus): boolean {
  const proposals = loadFromStorage()
  const idx = proposals.findIndex((p) => p.id === id)
  if (idx === -1) return false
  proposals[idx].status = status
  saveToStorage(proposals)
  return true
}

