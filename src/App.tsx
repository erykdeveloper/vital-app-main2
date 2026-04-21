import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { AppLayout } from "@/components/AppLayout";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
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
import AdminAppointments from "@/pages/admin/AdminAppointments";

import BodyProgress from "@/pages/BodyProgress";
import Bioimpedancia from "@/pages/Bioimpedancia";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
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
      { path: "workouts", element: <Workouts /> },
      { path: "workouts/musculacao/:type", element: <WorkoutForm /> },
      { path: "workouts/cardio/corrida", element: <CardioRunning /> },
      { path: "workouts/cardio/ciclismo", element: <CardioCycling /> },
      { path: "workouts/cardio/outras", element: <CardioOther /> },
      { path: "workouts/cardio/hiit", element: <CardioHIIT /> },
      { path: "workouts/history", element: <WorkoutHistory /> },
      { path: "workouts/dashboard", element: <WorkoutDashboard /> },
      { path: "injectables", element: <Injectables /> },
      { path: "injectables/new", element: <NewInjectable /> },
      { path: "premium", element: <Premium /> },
      { path: "appointments", element: <Appointments /> },
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
