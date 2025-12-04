import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/login-page';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { UsersPage } from '@/features/dashboard/users-page';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { InventoryPage } from '@/features/inventory/inventory-page';
import { POSPage } from '@/features/pos/pos-page';
import { LocalesPage } from '@/features/dashboard/locales-page';
import { SalesHistoryPage } from '@/features/sales/sales-history-page';
import { TasksPage } from '@/features/tasks/TasksPage';
import { ProfilePage } from '@/features/profile/profile-page';

// Placeholders for now
// const Dashboard = () => <div className="text-white">Dashboard Content</div>;

import { useEffect } from 'react';
import { useStore } from '@/store/store';

function App() {
    const initializeListeners = useStore(state => state.initializeListeners);

    useEffect(() => {
        const unsubscribe = initializeListeners();
        return () => unsubscribe();
    }, [initializeListeners]);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<DashboardLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/inventory" element={<InventoryPage />} />
                    <Route path="/pos" element={<POSPage />} />
                    <Route path="/locales" element={<LocalesPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/history" element={<SalesHistoryPage />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Route>

                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
