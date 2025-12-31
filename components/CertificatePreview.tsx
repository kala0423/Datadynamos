
import React from 'react';
import { CertificateData } from '../types';
import { ShieldCheck } from 'lucide-react';

interface CertificatePreviewProps {
  data: CertificateData | null;
}

const CertificatePreview: React.FC<CertificatePreviewProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="w-full min-h-[600px] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-gray-400 p-8 text-center transition-all duration-500">
        <div className="bg-white p-6 rounded-full shadow-inner mb-4">
          <ShieldCheck className="w-16 h-16 opacity-20" />
        </div>
        <p className="text-xl font-semibold text-gray-600">Document Verification Pending</p>
        <p className="text-sm max-w-xs mt-2">The official sanitization certificate will be generated here upon successful completion of the secure wipe protocol.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-0 border-gray-200 border w-full max-w-[850px] mx-auto overflow-hidden animate-in fade-in zoom-in duration-700">
      {/* External Wrapper for A4 Feel */}
      <div className="p-4 sm:p-8 bg-white">
        {/* Outer Blue Border */}
        <div className="border-[8px] border-[#0d47a1] p-2">
          {/* Inner Gold Border */}
          <div className="border-2 border-[#c9a44c] p-6 sm:p-10 flex flex-col bg-white min-h-[800px]">
            
            {/* Header Section */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                {/* SVG Logo inspired by high-security emblems */}
                <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-md">
                  <path d="M50 5 L10 25 V50 C10 75 50 95 50 95 C50 95 90 75 90 50 V25 L50 5 Z" fill="#0d47a1" />
                  <path d="M50 15 L20 30 V50 C20 70 50 85 50 85 C50 85 80 70 80 50 V30 L50 15 Z" fill="none" stroke="#c9a44c" strokeWidth="2" />
                  <path d="M35 50 L45 60 L65 40" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="text-[#0d47a1] text-3xl sm:text-4xl font-bold tracking-widest uppercase mb-2 font-serif">
                SECURE DATA ERASURE CERTIFICATE
              </h1>
              <h2 className="text-gray-600 text-lg uppercase tracking-[0.2em] font-sans font-medium">
                Certificate of Compliance
              </h2>
            </div>

            {/* Introductory Text */}
            <div className="text-center mb-10 px-8 font-serif text-gray-700 italic text-base sm:text-lg leading-relaxed">
              This certificate confirms that the following file has been securely erased
              in accordance with <strong className="text-black not-italic font-sans">{data.standardCompliance}</strong>
              <br className="hidden sm:block" /> using <strong className="text-black not-italic font-sans">{data.toolVersion}</strong>.
            </div>

            {/* Data Table */}
            <div className="flex-grow">
              <table className="w-full border-collapse text-sm sm:text-base mb-10 font-sans shadow-sm">
                <tbody>
                  {[
                    ['Certificate ID', data.certificateId],
                    ['File Name', data.fileName],
                    ['File Path', data.filePath, true],
                    ['File Size', `${data.fileSize.toLocaleString()} bytes`],
                    ['Number of Passes', data.passes],
                    ['Original Hash', data.originalHash, true],
                    ['Final Hash', data.finalHash, true],
                    ['Status', '✅ SUCCESS'],
                    ['Date', data.wipeDate],
                    ['Compliance', data.standardCompliance]
                  ].map(([label, value, isMono]) => (
                    <tr key={label as string}>
                      <th className="bg-gray-50 border border-gray-200 px-5 py-3 text-left font-bold text-gray-700 w-1/3 whitespace-nowrap uppercase text-[11px] tracking-wider">
                        {label}
                      </th>
                      <td className={`border border-gray-200 px-5 py-3 text-gray-800 break-all ${isMono ? 'font-mono text-[10px] leading-tight text-blue-900 bg-blue-50/30' : 'font-medium'}`}>
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Section: Side-by-Side Verification */}
            <div className="grid grid-cols-2 gap-8 items-end mt-12 pb-6 border-t border-gray-100 pt-10">
              {/* Signature Area */}
              <div className="flex flex-col items-center">
                <div className="relative h-24 w-full flex flex-col items-center justify-center">
                  {/* Digital Signature Overlay Effect */}
                  <div className="font-['Playfair_Display'] italic text-4xl text-gray-800 tracking-tighter select-none mb-1 opacity-90">
                    SecureWiper Auth
                  </div>
                  <div className="w-48 h-[1px] bg-gray-400"></div>
                </div>
                <div className="mt-2 text-center">
                  <span className="font-bold font-sans text-gray-900 text-sm uppercase tracking-widest">Head of Security</span>
                </div>
              </div>

              {/* QR Verification Area */}
              <div className="flex flex-col items-center border-l border-gray-100 pl-8">
                <div className="bg-white p-2 border border-gray-200 shadow-sm">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(data.qrUrl)}`} 
                    alt="Verification QR Code"
                    className="w-24 h-24 sm:w-28 sm:w-28"
                  />
                </div>
                <div className="mt-3 text-center">
                  <span className="font-sans text-gray-500 text-[10px] uppercase tracking-[0.2em] font-bold">Scan to Verify Authenticity</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-[11px] text-gray-400 font-sans border-t border-gray-50 pt-6">
              Authorized by <span className="text-gray-600 font-bold">SecureWiper Systems Pvt Ltd</span><br />
              <div className="mt-1 tracking-widest">
                SUPPORT@SECUREWIPER.IO | +91-99999-99999
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
