import React from 'react';
import { InvoicePembayaranView } from './InvoicePembayaranView';

interface PembayaranViewProps {
  preselectedInvoiceId?: string;
}

export const PembayaranView: React.FC<PembayaranViewProps> = ({ preselectedInvoiceId }) => {
  return <InvoicePembayaranView initialInvoiceId={preselectedInvoiceId} />;
};

export default PembayaranView;
