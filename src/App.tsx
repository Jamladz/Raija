/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Splash from './pages/Splash';
import Home from './pages/Home';
import Layout from './components/Layout';
import Restaurant from './pages/Restaurant';
import Cart from './pages/Cart';
import TrackOrder from './pages/TrackOrder';
import AdminDashboard from './pages/admin/AdminDashboard';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OffersPage from './pages/OffersPage';
import Profile from './pages/Profile';
import LoadingSplash from './components/LoadingSplash';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <LoadingSplash onComplete={() => setShowSplash(false)} />}
      <Routes>
        <Route path="/login" element={<Splash />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="/restaurant/:id" element={<Restaurant />} />
        <Route path="/track/:orderId" element={<TrackOrder />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/search" element={<div className="p-4 text-center mt-20" dir="rtl">قريباً</div>} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </>
  );
}
