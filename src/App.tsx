import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ScrollToTop } from './components/shared/ScrollToTop'
import { PublicLayout } from './components/layout/PublicLayout'
import { ProfileLayout } from './components/layout/ProfileLayout'
import { AdminLayout } from './components/layout/AdminLayout'
import { AuthGuard } from './auth/AuthGuard'
import { ApprovalGuard } from './auth/ApprovalGuard'
import { RoleGuard } from './auth/RoleGuard'

// Public pages — lazy loaded
const Homepage = lazy(() => import('./pages/Homepage').then((m) => ({ default: m.Homepage })))
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })))
const Events = lazy(() => import('./pages/Events').then((m) => ({ default: m.Events })))
const EventDetail = lazy(() => import('./pages/EventDetail').then((m) => ({ default: m.EventDetail })))
const BusinessDirectory = lazy(() => import('./pages/BusinessDirectory').then((m) => ({ default: m.BusinessDirectory })))
const Matrimonial = lazy(() => import('./pages/Matrimonial').then((m) => ({ default: m.Matrimonial })))
const MatrimonialDetail = lazy(() => import('./pages/MatrimonialDetail').then((m) => ({ default: m.MatrimonialDetail })))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })))
const TermsOfService = lazy(() => import('./pages/TermsOfService').then((m) => ({ default: m.TermsOfService })))
const CookiePolicy = lazy(() => import('./pages/CookiePolicy').then((m) => ({ default: m.CookiePolicy })))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))
const VerifyMember = lazy(() => import('./pages/VerifyMember').then((m) => ({ default: m.VerifyMember })))
const PendingApproval = lazy(() => import('./pages/PendingApproval').then((m) => ({ default: m.PendingApproval })))
const Members = lazy(() => import('./pages/Members').then((m) => ({ default: m.Members })))
const Gallery = lazy(() => import('./pages/Gallery').then((m) => ({ default: m.Gallery })))
const GalleryAlbum = lazy(() => import('./pages/GalleryAlbum').then((m) => ({ default: m.GalleryAlbum })))
const Souvenirs = lazy(() => import('./pages/Souvenirs').then((m) => ({ default: m.Souvenirs })))
const Donate = lazy(() => import('./pages/Donate').then((m) => ({ default: m.Donate })))
const Contact = lazy(() => import('./pages/Contact').then((m) => ({ default: m.Contact })))
const Unsubscribe = lazy(() => import('./pages/Unsubscribe').then((m) => ({ default: m.Unsubscribe })))

// Auth pages — lazy loaded
const Login = lazy(() => import('./auth/Login').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('./auth/Register').then((m) => ({ default: m.Register })))
const ForgotPassword = lazy(() => import('./auth/ForgotPassword').then((m) => ({ default: m.ForgotPassword })))
const ResetPassword = lazy(() => import('./auth/ResetPassword').then((m) => ({ default: m.ResetPassword })))

// Profile pages — lazy loaded
const MyProfile = lazy(() => import('./profile/MyProfile').then((m) => ({ default: m.MyProfile })))
const EditProfile = lazy(() => import('./profile/EditProfile').then((m) => ({ default: m.EditProfile })))
const FamilyMembers = lazy(() => import('./profile/FamilyMembers').then((m) => ({ default: m.FamilyMembers })))
const BusinessDetails = lazy(() => import('./profile/BusinessDetails').then((m) => ({ default: m.BusinessDetails })))
const MyDonations = lazy(() => import('./profile/MyDonations').then((m) => ({ default: m.MyDonations })))
const Membership = lazy(() => import('./profile/Membership').then((m) => ({ default: m.Membership })))
const MyMatrimonial = lazy(() => import('./profile/MyMatrimonial').then((m) => ({ default: m.MyMatrimonial })))

// Admin pages — lazy loaded
const AdminDashboard = lazy(() => import('./admin/Dashboard').then((m) => ({ default: m.AdminDashboard })))
const PendingApprovals = lazy(() => import('./admin/members/PendingApprovals').then((m) => ({ default: m.PendingApprovals })))
const PaymentHistory = lazy(() => import('./admin/members/PaymentHistory').then((m) => ({ default: m.PaymentHistory })))
const AddPayment = lazy(() => import('./admin/members/AddPayment').then((m) => ({ default: m.AddPayment })))
const AddExpense = lazy(() => import('./admin/members/AddExpense').then((m) => ({ default: m.AddExpense })))
const ExpenseHistory = lazy(() => import('./admin/members/ExpenseHistory').then((m) => ({ default: m.ExpenseHistory })))
const BulkPayment = lazy(() => import('./admin/members/BulkPayment').then((m) => ({ default: m.BulkPayment })))
const Reports = lazy(() => import('./admin/reports/Reports').then((m) => ({ default: m.Reports })))
const AdminLogs = lazy(() => import('./admin/logs/AdminLogs').then((m) => ({ default: m.AdminLogs })))
const AllMembers = lazy(() => import('./admin/members/AllMembers').then((m) => ({ default: m.AllMembers })))
const AddMember = lazy(() => import('./admin/members/AddMember').then((m) => ({ default: m.AddMember })))
const MemberDetail = lazy(() => import('./admin/members/MemberDetail').then((m) => ({ default: m.MemberDetail })))
const AddEvent = lazy(() => import('./admin/yearly-planner/AddEvent').then((m) => ({ default: m.AddEvent })))
const EditEvent = lazy(() => import('./admin/yearly-planner/EditEvent').then((m) => ({ default: m.EditEvent })))
const ManageDirectory = lazy(() => import('./admin/directory/ManageDirectory').then((m) => ({ default: m.ManageDirectory })))
const AddBusiness = lazy(() => import('./admin/directory/AddBusiness').then((m) => ({ default: m.AddBusiness })))
const EditBusiness = lazy(() => import('./admin/directory/EditBusiness').then((m) => ({ default: m.EditBusiness })))
const ManageMatrimonial = lazy(() => import('./admin/matrimonial/ManageMatrimonial').then((m) => ({ default: m.ManageMatrimonial })))
const AddMatrimonial = lazy(() => import('./admin/matrimonial/AddMatrimonial').then((m) => ({ default: m.AddMatrimonial })))
const EditMatrimonial = lazy(() => import('./admin/matrimonial/EditMatrimonial').then((m) => ({ default: m.EditMatrimonial })))
const SubAdmins = lazy(() => import('./admin/sub-admins/SubAdmins').then((m) => ({ default: m.SubAdmins })))
const AddSubAdmin = lazy(() => import('./admin/sub-admins/AddSubAdmin').then((m) => ({ default: m.AddSubAdmin })))
const Designations = lazy(() => import('./admin/designations/Designations').then((m) => ({ default: m.Designations })))
const YearlyPlanner = lazy(() => import('./admin/yearly-planner/YearlyPlanner').then((m) => ({ default: m.YearlyPlanner })))
const Souvenir = lazy(() => import('./admin/souvenir/Souvenir').then((m) => ({ default: m.Souvenir })))
const ManageGallery = lazy(() => import('./admin/gallery/ManageGallery').then((m) => ({ default: m.ManageGallery })))
const PromoPopups = lazy(() => import('./admin/promo-popups/PromoPopups').then((m) => ({ default: m.PromoPopups })))
const FormSubmissions = lazy(() => import('./admin/forms/FormSubmissions').then((m) => ({ default: m.FormSubmissions })))
const Subscribers = lazy(() => import('./admin/subscribers/Subscribers').then((m) => ({ default: m.Subscribers })))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Homepage />} />
            <Route path="about" element={<About />} />
            <Route path="members" element={<Members />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="gallery/:id" element={<GalleryAlbum />} />
            <Route path="souvenirs" element={<Souvenirs />} />
            <Route path="donate" element={<Donate />} />
            <Route path="contact" element={<Contact />} />
            <Route path="unsubscribe" element={<Unsubscribe />} />
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
          <Route path="/login" element={<PublicLayout />}>
            <Route index element={<Login />} />
          </Route>
          <Route path="/register" element={<PublicLayout />}>
            <Route index element={<Register />} />
          </Route>
          <Route path="/forgot-password" element={<PublicLayout />}>
            <Route index element={<ForgotPassword />} />
          </Route>
          <Route path="/reset-password" element={<PublicLayout />}>
            <Route index element={<ResetPassword />} />
          </Route>

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

            {/* Expenses */}
            <Route path="expenses" element={<ExpenseHistory />} />
            <Route path="expenses/add" element={<AddExpense />} />
            <Route path="expenses/edit/:id" element={<AddExpense />} />
            <Route path="payments/bulk" element={<BulkPayment />} />
            <Route path="reports" element={<Reports />} />
            <Route path="logs" element={<AdminLogs />} />
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
            <Route path="yearly-planner/edit/:id" element={<EditEvent />} />

            {/* Finance & Promotions */}
            <Route path="souvenir" element={<Souvenir />} />
            <Route path="gallery" element={<ManageGallery />} />
            <Route path="promo-popups" element={<PromoPopups />} />
            <Route path="forms" element={<FormSubmissions />} />
            <Route path="subscribers" element={<Subscribers />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<PublicLayout />}>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
