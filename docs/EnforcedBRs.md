# Enforced Business Rules (BRs) in Frontend

This document catalogs all the **Business Rules (BRs)** that have been programmatically implemented in the Next.js frontend codebase, mapping each rule to its corresponding enforcement layer (Zod Schemas, Store State, Business Logic, and UI Pages).

---

## 📂 Business Rules Mapping Table

| Domain / Phase | Rule ID | Business Rule Name | File & Path | Frontend Enforcement Details |
| :--- | :--- | :--- | :--- | :--- |
| **XC - Auth & RBAC** | **BR-01** | Internal Account Provisioning | [admin/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/admin/page.tsx#L607-L743) | Restricts internal account creation (roles & editors) to Administrators only using `authService.register`. |
| | **BR-03 / 04** | Permission Gate & Guards | [dashboard/*/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/) | Verifies active role and blocks page rendering/interaction dynamically using `useRole()` context. |
| | **BR-12** | Assistant Workload Limit | [chapters/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/chapters/page.tsx#L268-L284) | Counts active tasks per assistant and disables assignment if the assistant exceeds the 20-task limit. |
| **P1 - Series Proposal** | **BR-15** | Proposal Validation | [validation.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/validation.ts#L4-L23) | Uses `seriesProposalSchema` (Zod) to validate title length ($\le 100$) and synopsis length ($200$–$2000$). |
| | **BR-16** | Proposal Edit Restriction | [series/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/series/page.tsx#L189-L201) | Hides edit/delete UI controls for series proposals that are not in `Draft` status. |
| | **BR-17** | Unique Active Series Title | [proposals-store.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/proposals-store.ts#L94-L100) | Uses `isTitleDuplicate` during submission to reject titles matching existing active series. |
| | **BR-19** | Single Active Proposal Limit | [proposals-store.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/proposals-store.ts#L82-L89) | Restricts creation via `hasPendingProposal` if the creator already has a proposal pending or under review. |
| **P2 - Board Voting & Veto**| **BR-27 / 28**| Conflict of Interest Guard | [reviews/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/reviews/page.tsx#L735-L768) | Automatically disables voting actions and displays warning if voter is the series author, assigned editor, or creator. |
| | **BR-29** | Quorum Requirement | [business-logic.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/business-logic.ts#L112-L115) | Verifies quorum requirements ($\ge 3$ votes) via `hasVotingQuorum` helper. |
| | **BR-31** | Voting Window | [reviews/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/reviews/page.tsx#L379-L383) | Flags versions as overdue if voting exceeds the 7 calendar days deadline since board assignment. |
| | **BR-33** | Voting Majority Rule | [business-logic.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/business-logic.ts#L127-L143) | Computes final series status (Active/Rejected/Deferred) using `determineSeriesStatus`. |
| | **BR-35** | Reject Reason Requirement | [reviews/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/reviews/page.tsx#L830-L833) | Enforces a minimum 50-character comment constraint before allowing rejection votes. |
| **P3 & P4 - Chapter & Tasks**| **BR-40** | Chapter Creation Eligibility | [chapters/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/chapters/page.tsx#L321-L324) | Checks `canCreateChapter` to restrict chapter creation to the owner of an active series. |
| | **BR-41** | Chapter Numbering Policy | [chapters-store.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/chapters-store.ts) | Increments chapter numbers sequentially in the proposals store. |
| | **BR-42** | Publication Date Validation | [business-logic.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/business-logic.ts#L7-L12) | Validates publication dates (submission deadline is publication date − 14 days; must have $\ge 3$ working days). |
| | **BR-54** | Task Due Date Validation | [validation.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/validation.ts#L27-L33) | Ensures task due date is in the future and conforms to chapter deadline rules. |
| | **BR-59** | Mandatory Task Fields | [validation.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/validation.ts#L59-L65) | Validates that required fields like page number, status, and assistant are present. |
| | **BR-60 / 69**| Task Status Restrictions | [chapters/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/chapters/page.tsx#L581-L600) | Restricts assistant actions to `Submitted` and reserves `Approved` marks to Mangakas. |
| | **BR-61** | Chapter Completion Formula | [business-logic.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/business-logic.ts#L72-L75) | Calculates progress percentage: $\text{Approved Pages} / \text{Total Pages} \times 100\%$. |
| | **BR-67** | Submission Prerequisite | [manuscripts/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/manuscripts/page.tsx) | Disables submit actions for manuscripts if drawing progress is less than 100%. |
| **P5 & P6 - Manuscript Review**| **BR-74** | Editor Access Restriction | [tantou-editor/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/tantou-editor/page.tsx#L448-L454) | Filters manuscript dashboard to show only works of creators supervised by the active editor. |
| | **BR-78** | Annotation Version Binding | [manuscripts-store.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/manuscripts-store.ts#L44-L47) | Binds notes, annotations, and coordinates to a specific version draft (v1, v2, etc.). |
| | **BR-80** | Manuscript Approval Lock | [manuscripts-store.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/manuscripts-store.ts#L49-L73) | Freezes approved manuscripts to prevent any direct modifications. |
| | **BR-84** | Completion Before Approval | [tantou-editor/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/tantou-editor/page.tsx#L535-L541) | Blocks approval by editors if the underlying drawings progress is under 100%. |
| **P7 & P8 - Popularity & Ranks**| **BR-87** | Vote Data Entry Authority | [ranking/page.tsx](file:///d:/FPTU/SWP392/FE-nextjs/my-app/app/dashboard/ranking/page.tsx#L283-L290) | Controls reader/vote statistics import fields based on active role credentials (Editorial Board). |
| | **BR-88** | VoteRecord Uniqueness | [ranking-store.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/ranking-store.ts#L65-L69) | Prevents duplicating vote entry records for a single period under the same series. |
| | **BR-89** | VoteRecord Validation | [validation.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/validation.ts#L45-L55) | Checks that `voteCount <= readerCount` before accepting statistics input. |
| | **BR-90** | Ranking Formula | [business-logic.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/business-logic.ts#L18-L21) | Computes $\text{score} = (\text{voteCount} / \text{readerCount}) \times 100\%$ with zero-check precautions. |
| | **BR-94** | Bottom 20% Review Flag | [ranking-store.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/ranking-store.ts#L121-L128) | Identifies and highlights series scoring in the bottom 20% if total series count is $\ge 5$. |
| **XC - Assistant Earnings** | **BR-124**| Earnings Formula | [business-logic.ts](file:///d:/FPTU/SWP392/FE-nextjs/my-app/lib/business-logic.ts#L102-L107) | Calculates earnings dynamically: $\text{Approved Pages} \times \text{Rate Per Page}$. |
