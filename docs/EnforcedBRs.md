# Enforced Business Rules (BRs) in Frontend

This document catalogs all the **Business Rules (BRs)** that have been programmatically implemented or validated, mapping each rule to its corresponding enforcement layer (Zod Schemas, Store State, Business Logic, and UI Pages) in the Next.js frontend codebase.

---

## 📂 Business Rules Mapping Table

| Domain / Phase | Rule ID | Business Rule Name | File & Path | Frontend Enforcement Details |
| :--- | :--- | :--- | :--- | :--- |
| **XC — Auth/RBAC** | **BR-01** | Permission Enforcement | [dashboard/*/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/) | Verifies active role and blocks page rendering/interaction dynamically using `useRole()` context. |
| | **BR-02** | Object-Level Authorization | [dashboard/](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/) | Enforced via active user checks (e.g. Mangaka owner checking, editor assignment filtering). |
| | **BR-03** | Immediate Permission Revocation | [authService.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/services/authService.ts) | Session and tokens validated on every transition/API call. |
| | **BR-04** | Mangaka–Assistant Conflict Rule | Backend & UI Gates | Prevents assigning user who is the Mangaka owner to be an assistant on the same series. |
| | **BR-05** | User Deactivation Handling | UI & Backend State | Ensures deactivated users are restricted from performing active workflow items. |
| **P1 — Series Proposal** | **BR-06** | Proposal Validation Requirements | [validation.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/validation.ts#L4-L23) | Uses `seriesProposalSchema` (Zod): Title $\le 100$ chars, Synopsis $100$–$2000$ chars, valid Genre/Type, $\ge 5$ sample pages. |
| | **BR-07** | Activation Preconditions | [series/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/series/page.tsx) | Ensures series can only be Activated after a BoardDecision with quorum has been finalized. |
| | **BR-08** | Proposal Lifecycle | [series/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/series/page.tsx#L189-L201) | Enforces Draft $\rightarrow$ Under Review $\rightarrow$ Board voting state machine; restricts editing to Draft state. |
| | **BR-09** | Unique Series Title | [proposals-store.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/proposals-store.ts#L94-L100) | Validates title uniqueness (`isTitleDuplicate`) against active series list during submission. |
| | **BR-10** | Publication Type Governance | [series/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/series/page.tsx) | Restricts changing publication type without BoardDecision once a series is active. |
| | **BR-11** | Single Active Proposal Limit | [proposals-store.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/proposals-store.ts#L82-L89) | Limits Mangaka to at most 1 proposal in Pending/Under Review status. |
| | **BR-12** | Series Lifecycle Policy | [series/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/series/page.tsx) | Implements transitions Approved $\rightarrow$ Active $\rightarrow$ On-Hold/Cancelled; blocks UI reactivation for Cancelled series. |
| **P2 — Editorial Board Voting** | **BR-13** | Voting Eligibility | [reviews/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/reviews/page.tsx) | Permits only active Editorial Board members to vote. |
| | **BR-14** | Conflict of Interest Definition | [reviews/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/reviews/page.tsx#L735-L768) | Disables voting UI if voter is the series' Mangaka, assigned Editor, or creator of the proposal. |
| | **BR-15** | Quorum Requirement | [business-logic.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/business-logic.ts#L112-L115) | Verifies quorum requirement ($\ge 3$ conflict-free votes) using `hasVotingQuorum`. |
| | **BR-16** | Invalid Vote Exclusion | [reviews/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/reviews/page.tsx) | Filters out votes of members with conflicts from majority calculations. |
| | **BR-17** | Majority Rule | [business-logic.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/business-logic.ts#L127-L143) | Auto-approves if Approve votes $> 50\%$; escalates ties to Editor-in-Chief. |
| | **BR-18** | Finalization Rule | [reviews/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/reviews/page.tsx) | Finalizes voting once window expires or result is mathematically irreversible. |
| | **BR-19** | Voting Window | [reviews/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/reviews/page.tsx#L379-L383) | Tracks 7 calendar days deadline since proposal assignment. |
| | **BR-20** | Reject Reason Requirement | [reviews/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/reviews/page.tsx#L830-L833) | Requires minimum 50-character comment before submitting a Reject vote. |
| | **BR-21** | Deferred & Expired Handling | [reviews/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/reviews/page.tsx) | Handles expired votes and sends notification escalations to Editor-in-Chief. |
| **P3 — Chapter & Task Assignment** | **BR-22** | Chapter Creation Eligibility | [chapters/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/chapters/page.tsx#L321-L324) | Validates `canCreateChapter` so only Mangaka owner of Active series can add chapters. |
| | **BR-23** | Publication Date Validation | [business-logic.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/business-logic.ts#L7-L12) | Deadline = Pub Date - 14 days; must be $\ge 3$ days after chapter creation. |
| | **BR-24** | Ready-for-Submission Condition | [chapters/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/chapters/page.tsx) | Chapter advances to Submitted only when all required PageTasks are Approved. |
| | **BR-25** | Page Range Non-Overlap | [chapters/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/chapters/page.tsx) | Validates that active tasks' page ranges within the same chapter do not overlap. |
| | **BR-26** | Due Date Validation | [validation.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/validation.ts#L27-L33) | Task due date must be in future, $\le$ chapter deadline, and $\ge 3$ days before chapter submission. |
| | **BR-27** | Assistant-Only Assignment | [chapters/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/chapters/page.tsx) | Blocks task assignment to users without an active Assistant role. |
| | **BR-28** | Chapter Numbering Policy | [chapters-store.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/chapters-store.ts) | Enforces unique chapter numbers within a series that increase monotonically. |
| | **BR-29** | Deadline Escalation | [chapters/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/chapters/page.tsx) | Alerts Tantou Editor within 1 hour when chapter becomes overdue. |
| | **BR-30** | Assignment Authority | [chapters/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/chapters/page.tsx) | Only Mangaka owner may assign PageTasks; assistants cannot self-assign. |
| | **BR-31** | Mandatory Task Fields | [validation.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/validation.ts#L59-L65) | Requires pageRange, taskType, dueDate, and assistantId. |
| **P4 — Page Progress Tracking** | **BR-32** | Task Completion Rule | [chapters/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/chapters/page.tsx#L581-L600) | A PageTask is considered complete only when the Mangaka marks it as Approved. |
| | **BR-33** | Manuscript Submission Requirement | [manuscripts/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/manuscripts/page.tsx) | Restricts Mangaka from submitting a manuscript unless all PageTasks are Approved. |
| | **BR-34** | Assistant Status Transition Restriction | [chapters/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/chapters/page.tsx) | Assistants can only transition Pending $\rightarrow$ In-Progress $\rightarrow$ Submitted; cannot approve work. |
| | **BR-35** | Chapter Completion Formula | [business-logic.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/business-logic.ts#L72-L75) | Chapter completion % = Approved Tasks / Total Required Tasks $\times 100\%$. |
| | **BR-36** | Automatic Progress Recalculation | [chapters/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/chapters/page.tsx) | Automatically triggers progress percent recalculation when task statuses update. |
| | **BR-37** | Review SLA | [chapters/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/chapters/page.tsx) | Reminds Mangaka to review within 48h; escalates to Tantou Editor after 72h. |
| **P5 & P6 — Manuscript Review** | **BR-38** | Manuscript Submission Authority | [manuscripts/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/manuscripts/page.tsx) | Limits manuscript submission exclusively to the Mangaka owner. |
| | **BR-39** | Editor Access Restriction | [tantou-editor/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/tantou-editor/page.tsx#L448-L454) | Restricts access to manuscript reviews to the assigned Tantou Editor only. |
| | **BR-40** | Manuscript Approval Lock | [manuscriptService.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/services/manuscriptService.ts#L29-L54) | Freezes approved manuscripts. Any subsequent updates require a new version. |
| | **BR-41** | Completion Requirement Before Approval | [tantou-editor/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/tantou-editor/page.tsx#L533-L538) | Blocks manuscript approval by the Editor if chapter completion progress is $< 100\%$. |
| | **BR-42** | Versioning Policy | [manuscriptService.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/services/manuscriptService.ts) | Every resubmission creates a new version (v1, v2...) without deleting history. |
| | **BR-43** | Manuscript Lifecycle | [tantou-editor/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/tantou-editor/page.tsx) | Draft $\rightarrow$ Submitted $\rightarrow$ Under Review $\rightarrow$ Revision Required / Approved. |
| | **BR-44** | Maximum Revision Limit | [tantou-editor/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/tantou-editor/page.tsx) | Cap of 3 consecutive revision rounds before escalating the case to the Board. |
| **P7 & P8 — Popularity & Ranks** | **BR-45** | Vote Data Entry Authority | [ranking/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/ranking/page.tsx#L283-L290) | Editorial Board members only can submit VoteRecords. |
| | **BR-46** | VoteRecord Uniqueness | [ranking-store.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/ranking-store.ts#L65-L69) | Restricts to exactly one VoteRecord per period for each series. |
| | **BR-47** | VoteRecord Validation | [validation.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/validation.ts#L45-L55) | Enforces readerCount $\ge$ voteCount $\ge 0$ upon statistics input. |
| | **BR-48** | Ranking Formula | [business-logic.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/business-logic.ts#L18-L21) | Score = $(\text{voteCount} / \text{readerCount}) \times 100\%$; if readerCount = 0, score = 0. |
| | **BR-49** | Automatic Ranking Recalculation | [ranking/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/ranking/page.tsx) | Automatically triggers ranking calculations upon confirmation of a VoteRecord. |
| | **BR-50** | Bottom 20% Review Flag | [ranking-store.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/ranking-store.ts#L121-L128) | Flagged for cancellation review if series is in the bottom 20% (requires series count $\ge 5$). |
| | **BR-51** | Mandatory Cancellation Review | [ranking/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/ranking/page.tsx) | Mandatory review if a series is in the bottom 20% for 3 consecutive periods. |
| **P9 — Cancel / Change Publication** | **BR-52** | Cancellation Decision Quorum | [reviews/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/reviews/page.tsx) | Requires $\ge 3$ conflict-free Board votes to finalize a cancellation decision. |
| | **BR-53** | Cancellation Workflow Effect | [series/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/series/page.tsx) | Suspends all active chapters and tasks and archives series data upon cancellation. |
| | **BR-54** | Transaction Consistency | Backend Transaction | Finalization and status transitions run atomically within a DB transaction. |
| | **BR-55** | Irreversible Cancellation Rule | [series/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/series/page.tsx) | UI blocks standard reactivation for Cancelled series (requires Admin override log). |
| | **BR-56** | Cancellation Majority Rule | [business-logic.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/business-logic.ts) | Cancellation requires $> 50\%$ approval; otherwise, results in a "Continue" state. |
