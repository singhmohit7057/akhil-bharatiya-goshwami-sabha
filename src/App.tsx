import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ScrollToTop } from './components/shared/ScrollToTop'
import { PublicLayout } from './components/layout/PublicLayout'
import { ProfileLayout } from './components/layout/ProfileLayout'
import { AdminLayout } from './components/layout/AdminLayout'
import { AuthGuard } from './auth/AuthGuard'
import { ApprovalGuard } from './auth/ApprovalGuard'
import { RoleGuard } from './auth/RoleGuard'

import { Homepage } from './pages/Homepage'
import { About } from './pages/About'
import { Events } from './pages/Events'
import { EventDetail } from './pages/EventDetail'
import { BusinessDirectory } from './pages/BusinessDirectory'
import { Matrimonial } from './pages/Matrimonial'
import { MatrimonialDetail } from './pages/MatrimonialDetail'
import { PrivacyPolicy } from './pages/PrivacyPolicy'
import { TermsOfService } from './pages/TermsOfService'
import { CookiePolicy } from './pages/CookiePolicy'
import { NotFound } from './pages/NotFound'
import { VerifyMember } from './pages/VerifyMember'
import { PendingApproval } from './pages/PendingApproval'
import { Members } from './pages/Members'
import { Gallery } from './pages/Gallery'
import { GalleryAlbum } from './pages/GalleryAlbum'
import { Souvenirs } from './pages/Souvenirs'

import { Login } from './auth/Login'
import { Register } from './auth/Register'
import { ForgotPassword } from './auth/ForgotPassword'

import { MyProfile } from './profile/MyProfile'
import { EditProfile } from './profile/EditProfile'
import { FamilyMembers } from './profile/FamilyMembers'
import { BusinessDetails } from './profile/BusinessDetails'
import { MyDonations } from './profile/MyDonations'
import { Membership } from './profile/Membership'
import { MyMatrimonial } from './profile/MyMatrimonial'

import { AdminDashboard } from './admin/Dashboard'
import { PendingApprovals } from './admin/members/PendingApprovals'
import { PaymentHistory } from './admin/members/PaymentHistory'
import { AddPayment } from './admin/members/AddPayment'
import { AllMembers } from './admin/members/AllMembers'
import { AddMember } from './admin/members/AddMember'
import { MemberDetail } from './admin/members/MemberDetail'
import { AddEvent } from './admin/yearly-planner/AddEvent'
import { EditEvent } from './admin/yearly-planner/EditEvent'
import { ManageDirectory } from './admin/directory/ManageDirectory'
import { AddBusiness } from './admin/directory/AddBusiness'
import { EditBusiness } from './admin/directory/EditBusiness'
import { ManageMatrimonial } from './admin/matrimonial/ManageMatrimonial'
import { AddMatrimonial } from './admin/matrimonial/AddMatrimonial'
import { EditMatrimonial } from './admin/matrimonial/EditMatrimonial'
import { SubAdmins } from './admin/sub-admins/SubAdmins'
import { AddSubAdmin } from './admin/sub-admins/AddSubAdmin'
import { Designations } from './admin/designations/Designations'
import { YearlyPlanner } from './admin/yearly-planner/YearlyPlanner'
import { Souvenir } from './admin/souvenir/Souvenir'
import { ManageGallery } from './admin/gallery/ManageGallery'
import { PromoPopups } from './admin/promo-popups/PromoPopups'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <Routes>
        {/* Public pages */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Homepage />} />
          <Route path="about" element={<About />} />
          <Route path="members" element={<Members />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="gallery/:id" element={<GalleryAlbum />} />
          <Route path="souvenirs" element={<Souvenirs />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:id" element={<EventDetail />} />
          <Route path="businesses" element={<BusinessDirectory />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms-of-service" element={<TermsOfService />} />
          <Route path="cookie-policy" element={<CookiePolicy />} />
          <Route path="pending-approval" element={<PendingApproval />} />
          <Route path="verify" element={<VerifyMember />} />
          <Route path="verify/:memberId" element={<VerifyMember />} />
        </Route>

        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Matrimonial — public page, visible to everyone */}
        <Route
          path="/matrimonial"
          element={<PublicLayout />}
        >
          <Route index element={<Matrimonial />} />
          <Route path=":id" element={<MatrimonialDetail />} />
        </Route>

        {/* Profile (authenticated + approved) */}
        <Route
          path="/profile"
          element={
            <AuthGuard>
              <ApprovalGuard>
                <ProfileLayout />
              </ApprovalGuard>
            </AuthGuard>
          }
        >
          <Route index element={<MyProfile />} />
          <Route path="edit" element={<EditProfile />} />
          <Route path="family" element={<FamilyMembers />} />
          <Route path="business" element={<BusinessDetails />} />
          <Route path="donations" element={<MyDonations />} />
          <Route path="membership" element={<Membership />} />
          <Route path="matrimonial" element={<MyMatrimonial />} />
        </Route>

        {/* Admin (authenticated + admin roles) */}
        <Route
          path="/admin"
          element={
            <AuthGuard>
              <ApprovalGuard>
                <RoleGuard requireAdmin>
                  <AdminLayout />
                </RoleGuard>
              </ApprovalGuard>
            </AuthGuard>
          }
        >
          <Route index element={<AdminDashboard />} />

          {/* Sub-Admins */}
          <Route path="sub-admins" element={<SubAdmins />} />
          <Route path="sub-admins/add" element={<AddSubAdmin />} />

          {/* Members */}
          <Route path="members" element={<AllMembers />} />
          <Route path="members/add" element={<AddMember />} />
          <Route path="members/pending" element={<PendingApprovals />} />

          {/* Payments */}
          <Route path="payments" element={<PaymentHistory />} />
          <Route path="payments/add" element={<AddPayment />} />
          <Route path="payments/edit/:id" element={<AddPayment />} />
          <Route path="members/:id" element={<MemberDetail />} />

          {/* Designations */}
          <Route path="designations" element={<Designations />} />

          {/* Matrimonial */}
          <Route path="matrimonial" element={<ManageMatrimonial />} />
          <Route path="matrimonial/add" element={<AddMatrimonial />} />
          <Route path="matrimonial/edit/:id" element={<EditMatrimonial />} />

          {/* Business / Directory */}
          <Route path="business" element={<ManageDirectory />} />
          <Route path="business/add" element={<AddBusiness />} />
          <Route path="business/edit/:id" element={<EditBusiness />} />

          {/* Yearly Planner */}
          <Route path="yearly-planner" element={<YearlyPlanner />} />
          <Route path="yearly-planner/add" element={<AddEvent />} />

          {/* Events */}
          <Route path="events/:id/edit" element={<EditEvent />} />

          {/* Finance & Promotions */}
          <Route path="souvenir" element={<Souvenir />} />
          <Route path="gallery" element={<ManageGallery />} />
          <Route path="promo-popups" element={<PromoPopups />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<PublicLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
