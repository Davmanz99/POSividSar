import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/login-page';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { UsersPage } from '@/features/dashboard/users-page';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { InventoryPage } from '@/features/inventory/inventory-page';
import { POSPage } from '@/features/pos/pos-page';
import { LocalesPage } from '@/features/dashboard/locales-page';
import { SalesHistoryPage } from '@/features/sales/sales-history-page';

// Placeholders for now
// const Dashboard = () => <div className="text-white">Dashboard Content</div>;

function App() {
    return (
        <HashRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<DashboardLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/inventory" element={<InventoryPage />} />
                    <Route path="/pos" element={<POSPage />} />
                    <Route path="/locales" element={<LocalesPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/history" element={<SalesHistoryPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </HashRouter>
    );
}

export default App;
