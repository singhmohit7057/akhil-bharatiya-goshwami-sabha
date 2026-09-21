# Akhil Bharatiya Goswami Sabha — Paschim Bangal

Official community website for Akhil Bharatiya Goswami Sabha, Paschim Bangal. A full-featured community platform built with React 19, Vite, TypeScript, Tailwind CSS v4, and Supabase.

**Live:** [akhilbharatiyagoswami.com](https://akhilbharatiyagoswami.com)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS v4 |
| Backend / Database | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Routing | React Router v7 |
| i18n | i18next (English + Hindi) |
| PDF | jsPDF (receipts, member profile, souvenir) |
| Excel | XLSX + ExcelJS (reports, bulk upload) |
| QR Code | qrcode.react |
| Icons | Lucide React |
| Notifications | react-hot-toast |

---

## Project Structure

```
src/
├── App.tsx                          # Route definitions
├── main.tsx                         # Entry point
│
├── admin/                           # Admin panel (super_admin / admin / viewer)
│   ├── Dashboard.tsx                # Stats, quick actions, pending approvals
│   ├── designations/
│   │   └── Designations.tsx         # Manage member roles/designations
│   ├── directory/
│   │   ├── AddBusiness.tsx
│   │   ├── EditBusiness.tsx         # Logo, visiting cards, branches
│   │   └── ManageDirectory.tsx      # Business listing management
│   ├── forms/
│   │   └── FormSubmissions.tsx      # Contact & donation form submissions
│   ├── gallery/
│   │   └── ManageGallery.tsx        # Albums, photo upload
│   ├── logs/
│   │   └── AdminLogs.tsx            # Full activity log
│   ├── matrimonial/
│   │   ├── AddMatrimonial.tsx       # Add profile for member or family
│   │   ├── EditMatrimonial.tsx
│   │   └── ManageMatrimonial.tsx    # List, hide/show, delete
│   ├── members/
│   │   ├── AllMembers.tsx           # List, search, block/unblock, export Excel
│   │   ├── AddMember.tsx
│   │   ├── MemberDetail.tsx         # Edit, photo, family, business, payments, PDF
│   │   ├── PendingApprovals.tsx
│   │   ├── PaymentHistory.tsx       # Donations, memberships, souvenir receipts
│   │   ├── AddPayment.tsx
│   │   ├── ExpenseHistory.tsx
│   │   ├── AddExpense.tsx
│   │   └── BulkPayment.tsx          # Excel bulk upload for payments/expenses
│   ├── promo-popups/
│   │   └── PromoPopups.tsx
│   ├── reports/
│   │   └── Reports.tsx              # Financial report: online/offline breakdown, Excel export
│   ├── souvenir/
│   │   └── Souvenir.tsx             # Upload PDFs, manage sponsors, receipts
│   ├── sub-admins/
│   │   ├── SubAdmins.tsx
│   │   └── AddSubAdmin.tsx          # Assign admin level & permissions
│   ├── subscribers/
│   │   └── Subscribers.tsx
│   └── yearly-planner/
│       ├── YearlyPlanner.tsx
│       ├── AddEvent.tsx
│       └── EditEvent.tsx
│
├── auth/                            # Auth pages (all noindex)
│   ├── Login.tsx                    # Inline errors, blocked account detection
│   ├── Register.tsx
│   ├── ForgotPassword.tsx
│   ├── ResetPassword.tsx
│   ├── ApprovalGuard.tsx            # Redirect pending/suspended users
│   ├── AuthGuard.tsx                # Redirect unauthenticated users
│   └── RoleGuard.tsx                # Restrict admin routes by role
│
├── components/
│   ├── layout/
│   │   ├── AdminLayout.tsx          # Sidebar, section colours, viewer filter
│   │   ├── ProfileLayout.tsx        # Profile sidebar nav
│   │   └── PublicLayout.tsx         # Navbar + Footer wrapper
│   ├── shared/
│   │   ├── Navbar.tsx               # Responsive, language toggle, user menu
│   │   ├── Footer.tsx
│   │   ├── LanguageToggle.tsx       # EN / HI switcher
│   │   ├── PromoPopup.tsx           # Dismissible modal popup
│   │   └── ScrollToTop.tsx
│   ├── ui/
│   │   ├── Spinner.tsx
│   │   ├── DateInput.tsx            # Day/Month/Year dropdowns
│   │   ├── DateMaskInput.tsx
│   │   ├── MemberSelect.tsx         # Searchable member dropdown
│   │   └── TimeMaskInput.tsx
│   └── SEO.tsx                      # React 19 native head management (OG, Twitter, canonical)
│
├── hooks/
│   ├── useAuth.ts                   # Auth state, roles, permissions, block/unblock
│   └── useDesignations.ts
│
├── i18n/
│   └── index.ts                     # i18next config + locale files (en/hi)
│
├── lib/
│   ├── supabase.ts                  # Supabase client + admin client (service role)
│   ├── receiptPdf.ts                # PDF: donation, membership, souvenir, member profile
│   ├── adminLog.ts                  # Log admin actions to DB
│   ├── transliterate.ts             # English → Hindi transliteration
│   └── utils.ts                     # formatDate, calculateAge, localized, getRoleLabel
│
├── pages/                           # 20 public-facing pages
│   ├── Homepage.tsx                 # Hero video, stats, governing body, members
│   ├── About.tsx
│   ├── Events.tsx / EventDetail.tsx
│   ├── Members.tsx
│   ├── BusinessDirectory.tsx
│   ├── Matrimonial.tsx / MatrimonialDetail.tsx
│   ├── Gallery.tsx / GalleryAlbum.tsx
│   ├── Souvenirs.tsx
│   ├── Donate.tsx                   # UPI QR code popup
│   ├── Contact.tsx
│   ├── VerifyMember.tsx
│   ├── PendingApproval.tsx
│   ├── Unsubscribe.tsx
│   ├── NotFound.tsx
│   ├── PrivacyPolicy.tsx
│   ├── TermsOfService.tsx
│   └── CookiePolicy.tsx
│
├── profile/                         # Member profile section (auth-gated)
│   ├── MyProfile.tsx                # Overview + PVC ID card download
│   ├── EditProfile.tsx
│   ├── FamilyMembers.tsx
│   ├── MyDonations.tsx              # With PDF receipt download
│   ├── Membership.tsx
│   ├── BusinessDetails.tsx          # Logo, visiting card upload/delete/reupload
│   └── MyMatrimonial.tsx            # Self or family profiles, duplicate prevention
│
└── types/
    └── index.ts                     # All TypeScript interfaces & enums
```

---

## Features

### Public Website
- **Homepage** — hero video, member stats, governing body cards
- **Events** — event listings with detail pages
- **Members Directory** — paginated member list with verification
- **Business Directory** — searchable business listings
- **Matrimonial** — auth-gated (executive members only), card-based profiles with photo gallery
- **Gallery** — albums with lightbox
- **Souvenirs** — downloadable event magazines
- **Donate** — UPI QR code, bank transfer details
- **Verify Member** — scan/enter member ID to verify authenticity
- **Bilingual** — full English + Hindi support via i18next

### Member Profile
- Edit profile (father/mother name, caste, gotra, marital status, etc.)
- Upload/manage profile photo
- Family members management (with photos)
- My Donations — list with PDF receipt download
- Membership — executive membership status & history
- Business Details — employed/self-employed, logo, visiting card (front/back) with delete/reupload
- Matrimonial — create profiles for self or family members, with duplicate prevention

### Admin Panel
- **3-tier roles**: `super_admin` / `admin` (configurable permissions) / `viewer` (read-only)
- **Members**: list, add, edit, approve, block/unblock toggle, export Excel
- **Payments**: record payments/memberships, bulk Excel upload, expense tracking
- **Financial Reports**: year-wise income/expense breakdown by online/offline mode, Excel export
- **Matrimonial**: add with photo/caste/manglik fields, delete, hide/show
- **Gallery**: create albums, upload photos
- **Souvenir**: upload PDFs, manage sponsors with receipts
- **Admin Logs**: full activity tracking

### PDF Generation
- Donation receipt (A5, branded)
- Membership receipt with validity period
- Souvenir sponsor receipt
- Member profile PDF (4 pages: personal, family, business/job, transactions)

### SEO
- Per-page title, description, canonical URL
- Open Graph + Twitter Card tags on all 20+ public pages
- Dynamic SEO for event detail, gallery album, matrimonial profiles
- `noindex` on all auth/private pages
- SEO score: **100/100** (Google PageSpeed)

---

## All Pages

### Public Pages
| Route | Page Title |
|-------|-----------|
| `/` | Akhil Bharatiya Goswami Sabha Paschim Bangal \| Official Website |
| `/about` | About Us \| Akhil Bharatiya Goswami Sabha Paschim Bangal |
| `/events` | Events \| Akhil Bharatiya Goswami Sabha Paschim Bangal |
| `/events/:id` | `<Event Title>` \| ABGSPB *(dynamic)* |
| `/members` | Members \| Akhil Bharatiya Goswami Sabha Paschim Bangal |
| `/businesses` | Business Directory \| Akhil Bharatiya Goswami Sabha Paschim Bangal |
| `/matrimonial` | Matrimonial \| Akhil Bharatiya Goswami Sabha Paschim Bangal |
| `/matrimonial/:id` | `<Candidate Name>` \| Matrimonial \| ABGSPB *(dynamic)* |
| `/gallery` | Gallery \| Akhil Bharatiya Goswami Sabha Paschim Bangal |
| `/gallery/:id` | `<Album Title>` \| Gallery \| Akhil Bharatiya Goswami Sabha Paschim Bangal *(dynamic)* |
| `/souvenirs` | Souvenirs \| Akhil Bharatiya Goswami Sabha Paschim Bangal |
| `/donate` | Donate \| Akhil Bharatiya Goswami Sabha Paschim Bangal |
| `/contact` | Contact Us \| Akhil Bharatiya Goswami Sabha Paschim Bangal |
| `/verify` | Verify Member \| Akhil Bharatiya Goswami Sabha Paschim Bangal |
| `/privacy-policy` | Privacy Policy \| Akhil Bharatiya Goswami Sabha Paschim Bangal |
| `/terms-of-service` | Terms of Service \| Akhil Bharatiya Goswami Sabha Paschim Bangal |
| `/cookie-policy` | Cookie Policy \| Akhil Bharatiya Goswami Sabha Paschim Bangal |
| `/unsubscribe` | Unsubscribe \| ABGSPB *(noindex)* |
| `*` | Page Not Found \| ABGSPB *(404, noindex)* |

### Auth Pages *(noindex)*
| Route | Page Title |
|-------|-----------|
| `/login` | Login \| ABGSPB |
| `/register` | Register \| ABGSPB |
| `/forgot-password` | Forgot Password \| ABGSPB |
| `/reset-password` | Reset Password \| ABGSPB |
| `/pending-approval` | Pending Approval \| ABGSPB |
| `/unauthorized` | Unauthorized \| ABGSPB |

### Member Profile Pages *(auth-gated)*
| Route | Description |
|-------|-------------|
| `/profile` | My Profile — ID card, overview |
| `/profile/edit` | Edit Profile |
| `/profile/family` | Family Members |
| `/profile/donations` | My Donations + PDF receipts |
| `/profile/membership` | Membership status & history |
| `/profile/business` | Job / Business Details |
| `/profile/matrimonial` | My Matrimonial Profiles |

### Admin Panel Pages *(admin-gated)*
| Route | Description |
|-------|-------------|
| `/admin` | Dashboard |
| `/admin/members` | All Members |
| `/admin/members/add` | Add Member |
| `/admin/members/:id` | Edit Member |
| `/admin/members/pending` | Pending Approvals |
| `/admin/payments` | Payment History |
| `/admin/payments/add` | Add Payment |
| `/admin/expenses` | Expense History |
| `/admin/expenses/add` | Add Expense |
| `/admin/payments/bulk` | Bulk Payment Upload |
| `/admin/reports` | Financial Reports |
| `/admin/matrimonial` | All Matrimonial Profiles |
| `/admin/matrimonial/add` | Add Matrimonial Profile |
| `/admin/matrimonial/edit/:id` | Edit Matrimonial Profile |
| `/admin/business` | Business Directory |
| `/admin/business/add` | Add Business |
| `/admin/business/edit/:id` | Edit Business |
| `/admin/gallery` | Manage Gallery |
| `/admin/souvenir` | Souvenir Manager |
| `/admin/yearly-planner` | Yearly Planner |
| `/admin/sub-admins` | Sub-Admin Management |
| `/admin/designations` | Designations |
| `/admin/promo-popups` | Promo Popups |
| `/admin/forms` | Form Submissions |
| `/admin/subscribers` | Subscribers |
| `/admin/logs` | Admin Activity Logs |

---

## Stats

- **88 source files** (`.tsx` / `.ts`)
- **~18,350 lines of code**
- **20 public pages** + **29 admin pages** + **7 profile pages** + **7 auth pages** + **2 utility pages** (404, Unsubscribe)
- **100/100 SEO** · **94/100 Desktop Performance** · **96/100 Best Practices** *(Google PageSpeed)*

---

## License

**Copyright © 2024–2026 Akhil Bharatiya Goswami Sabha, Paschim Bangal. All rights reserved.**

This software and its source code are the exclusive property of Akhil Bharatiya Goswami Sabha, Paschim Bangal. No part of this codebase may be copied, reproduced, distributed, modified, reverse-engineered, or used — in whole or in part — for any purpose without the express written permission of the owner.

Unauthorized use, reproduction, or distribution of this code is strictly prohibited and may result in legal action.
