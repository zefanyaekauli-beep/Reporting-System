// frontend/web/src/icons/AppIcons.tsx

import { ReactNode } from "react";

// Temporary placeholders; you can replace with your own SVGs/Lucide later
const Placeholder = ({ label }: { label: string }) => (
  <span className="text-lg leading-none">{label}</span>
);

export type IconKey =
  | "security"
  | "cleaning"
  | "driver"
  | "attendance"
  | "qrAttendance"
  | "reports"
  | "dashboard"
  | "tasks"
  | "announcements"
  | "shifts"
  | "officers"
  | "patrol"
  | "panic"
  | "passdown"
  | "dar"
  | "checklist";

export const AppIcons: Record<IconKey, (props?: { className?: string }) => ReactNode> = {
  security: (props) => <Placeholder label="🛡️" />,
  cleaning: (props) => <Placeholder label="🧹" />,
  driver: (props) => <Placeholder label="🚚" />,
  attendance: (props) => <Placeholder label="⏱️" />,
  qrAttendance: (props) => {
    const className = props?.className || "w-5 h-5";
    return (
      <svg className={className} viewBox="0 0 841.89 595.28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle fill="#0a2c4b" cx="420.94" cy="297.64" r="219.12"/>
        <g>
          <circle fill="none" stroke="#fcd01a" strokeWidth="13" strokeMiterlimit="10" cx="416.48" cy="297.64" r="107.05"/>
          <rect fill="#0a2c4b" x="496.71" y="263.14" width="42.29" height="81.46"/>
        </g>
        <path fill="#fcd01a" d="M389.56,277.81v-11.52c0-6.25,2.43-12.12,6.85-16.54,4.42-4.42,10.29-6.85,16.54-6.85s12.12,2.43,16.54,6.85c4.42,4.42,6.85,10.29,6.85,16.54v11.52c0,6.25-2.43,12.12-6.85,16.54-4.42,4.42-10.29,6.85-16.54,6.85s-12.12-2.43-16.54-6.85c-4.42-4.42-6.85-10.29-6.85-16.54ZM457.97,343.32c-1.41,2.39-3.67,4.12-6.35,4.86-12.51,3.47-27.94,4.19-38.68,4.19s-26.17-.73-38.68-4.19c-2.68-.74-4.93-2.47-6.35-4.86-1.41-2.39-1.84-5.2-1.2-7.9l3.66-15.41c.87-3.65,3.28-6.74,6.61-8.47l20.62-10.7c4.5,3.01,9.79,4.63,15.33,4.63s10.83-1.62,15.33-4.63l20.62,10.7c3.33,1.73,5.74,4.82,6.61,8.47l3.66,15.41c.64,2.7.22,5.51-1.2,7.9Z"/>
        <path fill="#ee2e24" d="M539.27,297.06l-22.58-20.17c-3.64-3.25-10.09-1.34-10.39,5.23-.05,1.15.46,2.25,1.32,3.02l11.6,10.36h-35.41c-1.14,0-2.26.48-2.98,1.36-4.17,5.1-.63,10.84,4.26,10.84h34.13l-11.6,10.36c-.9.8-1.39,1.97-1.32,3.17.27,4.37,3.28,6.63,6.33,6.63,1.45,0,2.9-.51,4.06-1.55l22.58-20.17c1.3-1.16,2.04-2.81,2.04-4.55s-.74-3.39-2.04-4.55Z"/>
        <path fill="#fcd01a" stroke="#fcd01a" strokeWidth="2" strokeMiterlimit="10" d="M420.94,123.84c-95.98,0-173.79,77.81-173.79,173.79s77.81,173.79,173.79,173.79,173.79-77.81,173.79-173.79-77.81-173.79-173.79-173.79ZM420.94,468.7c-94.47,0-171.06-76.59-171.06-171.06s76.59-171.06,171.06-171.06,171.06,76.59,171.06,171.06-76.59,171.06-171.06,171.06Z"/>
      </svg>
    );
  },
  reports: (props) => <Placeholder label="📄" />,
  dashboard: (props) => <Placeholder label="📊" />,
  tasks: (props) => <Placeholder label="✅" />,
  announcements: (props) => <Placeholder label="📢" />,
  shifts: (props) => <Placeholder label="🗓️" />,
  officers: (props) => <Placeholder label="👤" />,
  patrol: (props) => {
    const className = props?.className || "w-6 h-6";
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    );
  },
  panic: (props) => {
    const className = props?.className || "w-6 h-6";
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  },
  passdown: (props) => {
    const className = props?.className || "w-6 h-6";
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    );
  },
  dar: (props) => {
    const className = props?.className || "w-6 h-6";
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  },
  checklist: (props) => {
    const className = props?.className || "w-6 h-6";
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    );
  },
};