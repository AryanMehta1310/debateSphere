import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

const Alert = ({ type = 'danger', message }) => {
  if (!message) return null;

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} />;
      case 'warning':
        return <AlertTriangle size={18} />;
      case 'danger':
      default:
        return <AlertCircle size={18} />;
    }
  };

  return (
    <div className={`alert alert-${type}`}>
      {renderIcon()}
      <span>{message}</span>
    </div>
  );
};

export default Alert;
