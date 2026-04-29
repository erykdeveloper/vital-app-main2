import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { AppLayout } from "@/components/AppLayout";
import { PremiumRoute } from "@/components/PremiumRoute";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Terms from "@/pages/Terms";
import Home from "@/pages/Home";
import Workouts from "@/pages/Workouts";
import WorkoutForm from "@/pages/workouts/WorkoutForm";
import WorkoutHistory from "@/pages/workouts/WorkoutHistory";
import WorkoutDashboard from "@/pages/workouts/WorkoutDashboard";
import CardioRunning from "@/pages/workouts/CardioRunning";
import CardioCycling from "@/pages/workouts/CardioCycling";
import CardioOther from "@/pages/workouts/CardioOther";
import CardioHIIT from "@/pages/workouts/CardioHIIT";
import Injectables from "@/pages/Injectables";
import NewInjectable from "@/pages/injectables/NewInjectable";
import Premium from "@/pages/Premium";
import Appointments from "@/pages/Appointments";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import TrainerDashboard from "@/pages/TrainerDashboard";
import AdminAppointments from "@/pages/admin/AdminAppointments";

import BodyProgress from "@/pages/BodyProgress";
import Bioimpedancia from "@/pages/Bioimpedancia";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminFinance from "@/pages/admin/AdminFinance";
import AdminPaymentSettings from "@/pages/admin/AdminPaymentSettings";
import AdminBioimpedance from "@/pages/admin/AdminBioimpedance";
import AdminBioimpedanceEdit from "@/pages/admin/AdminBioimpedanceEdit";
import AdminUserHistory from "@/pages/admin/AdminUserHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  // Auth Routes
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/registro",
    element: <Register />,
  },
  {
    path: "/termos-de-uso",
    element: <Terms />,
  },
  {
    path: "/auth/login",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/auth/register",
    element: <Navigate to="/registro" replace />,
  },
  // Protected Routes with Bottom Nav
  {
    path: "/",
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Home /> },
      { path: "workouts", element: <PremiumRoute><Workouts /></PremiumRoute> },
      { path: "workouts/musculacao/:type", element: <PremiumRoute><WorkoutForm /></PremiumRoute> },
      { path: "workouts/cardio/corrida", element: <PremiumRoute><CardioRunning /></PremiumRoute> },
      { path: "workouts/cardio/ciclismo", element: <PremiumRoute><CardioCycling /></PremiumRoute> },
      { path: "workouts/cardio/outras", element: <PremiumRoute><CardioOther /></PremiumRoute> },
      { path: "workouts/cardio/hiit", element: <PremiumRoute><CardioHIIT /></PremiumRoute> },
      { path: "workouts/history", element: <PremiumRoute><WorkoutHistory /></PremiumRoute> },
      { path: "workouts/dashboard", element: <PremiumRoute><WorkoutDashboard /></PremiumRoute> },
      { path: "injectables", element: <Injectables /> },
      { path: "injectables/new", element: <NewInjectable /> },
      { path: "premium", element: <Premium /> },
      { path: "appointments", element: <Appointments /> },
      { path: "trainer", element: <TrainerDashboard /> },
      { path: "settings", element: <Settings /> },
      { path: "profile", element: <Profile /> },
      { path: "body-progress", element: <BodyProgress /> },
      { path: "bioimpedancia", element: <Bioimpedancia /> },
    ],
  },
  // Admin Routes
  {
    path: "/admin",
    element: <ProtectedRoute><AdminRoute /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "users", element: <AdminUsers /> },
      { path: "finance", element: <AdminFinance /> },
      { path: "payment-settings", element: <AdminPaymentSettings /> },
      { path: "users/:userId/history", element: <AdminUserHistory /> },
      { path: "bioimpedance", element: <AdminBioimpedance /> },
      { path: "bioimpedance/user/:userId", element: <AdminBioimpedance /> },
      { path: "bioimpedance/:id", element: <AdminBioimpedanceEdit /> },
      { path: "appointments", element: <AdminAppointments /> },
    ],
  },
  // 404
  {
    path: "*",
    element: <NotFound />,
  },
]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterProvider router={router} />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
