import React from 'react';
import { InvoicePembayaranView } from './InvoicePembayaranView';

interface InvoiceViewProps {
  onNavigateToPayment?: (invoiceId?: string) => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ onNavigateToPayment }) => {
  return <InvoicePembayaranView onNavigateToPayment={onNavigateToPayment} />;
};

export default InvoiceView;
