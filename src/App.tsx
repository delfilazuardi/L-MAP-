/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ActiveNavTab } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/views/DashboardView';
import { LaporanBulananView } from './components/views/LaporanBulananView';
import { InvoicePembayaranView } from './components/views/InvoicePembayaranView';
import { EventTrackerView } from './components/views/EventTrackerView';
import { PermintaanMitraView } from './components/views/PermintaanMitraView';
import { DataMitraView } from './components/views/DataMitraView';
import { StaffActivityView } from './components/views/StaffActivityView';
import { TemplateDokumenView } from './components/views/TemplateDokumenView';
import { PerformanceMendakiView } from './components/views/PerformanceMendakiView';
import { SheetSyncView } from './components/views/SheetSyncView';

function MainApp() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | undefined>(undefined);

  // If user is not authenticated, display login view
  if (!currentUser) {
    return <LoginView />;
  }

  const getTabTitle = (tab: ActiveNavTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard Eksekutif L-MAP';
      case 'laporan-bulanan':
        return 'Laporan Bulanan Sekolah Mitra';
      case 'invoice':
      case 'pembayaran':
        return 'Invoice & Pembayaran Mitra';
      case 'event-tracker':
        return 'Event Tracker & Kalender Agenda';
      case 'permintaan-mitra':
        return 'Permintaan Logistik Mitra';
      case 'data-mitra':
        return 'Direktori Data Sekolah Mitra';
      case 'staff-activity':
        return 'Staff Activity & Google Calendar';
      case 'template':
        return 'Template & Berkas Dokumen Resmi';
      case 'performance-mendaki':
        return 'Evaluasi Mutu MenDAKI Lazuardi';
      case 'sheet-sync':
        return 'Sinkronisasi Google Sheets & Firebase';
      default:
        return 'L-MAP Platform';
    }
  };

  const handleNavigateToPayment = (invoiceId?: string) => {
    setSelectedInvoiceId(invoiceId);
    setActiveTab('pembayaran');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'pembayaran') {
            setSelectedInvoiceId(undefined);
          }
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area (offset by sidebar width on lg screens) */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSyncModal={() => setActiveTab('sheet-sync')}
          activeTitle={getTabTitle(activeTab)}
        />

        {/* View Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {activeTab === 'dashboard' && (
            <DashboardView onNavigate={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === 'laporan-bulanan' && (
            <LaporanBulananView />
          )}

          {(activeTab === 'invoice' || activeTab === 'pembayaran') && (
            <InvoicePembayaranView 
              initialInvoiceId={selectedInvoiceId}
              onNavigateToPayment={handleNavigateToPayment}
            />
          )}

          {activeTab === 'event-tracker' && (
            <EventTrackerView />
          )}

          {activeTab === 'permintaan-mitra' && (
            <PermintaanMitraView />
          )}

          {activeTab === 'data-mitra' && (
            <DataMitraView />
          )}

          {activeTab === 'staff-activity' && (
            <StaffActivityView />
          )}

          {activeTab === 'template' && (
            <TemplateDokumenView />
          )}

          {activeTab === 'performance-mendaki' && (
            <PerformanceMendakiView />
          )}

          {activeTab === 'sheet-sync' && (
            <SheetSyncView />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}

