// frontend/web/src/modules/supervisor/pages/Reporting/DAR/DARDetailPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDAR, submitDAR, approveDAR, rejectDAR, exportDARPDF, DailyActivityReport } from "../../../../../services/darService";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

// Photo Gallery Modal Component
function PhotoGalleryModal({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: {
  photos: { url: string; caption: string }[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const currentPhoto = photos[currentIndex];

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, photos.length, onClose, onNavigate]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10"
      >
        ✕
      </button>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300 p-2"
        >
          ←
        </button>
      )}
      {currentIndex < photos.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300 p-2"
        >
          →
        </button>
      )}

      {/* Image container */}
      <div 
        className="max-w-4xl max-h-[80vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentPhoto.url}
          alt={currentPhoto.caption}
          className="max-w-full max-h-[70vh] object-contain rounded-lg"
        />
        <div className="mt-4 text-white text-center">
          <div className="text-lg font-medium">{currentPhoto.caption}</div>
          <div className="text-sm text-gray-400 mt-1">
            {currentIndex + 1} of {photos.length}
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-lg">
          {photos.map((photo, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); onNavigate(idx); }}
              className={`w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                idx === currentIndex ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DARDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [dar, setDar] = useState<DailyActivityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Photo gallery state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadDAR();
    }
  }, [id]);

  const loadDAR = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getDAR(parseInt(id));
      setDar(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load DAR");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    try {
      await submitDAR(parseInt(id));
      await loadDAR();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to submit DAR");
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      await approveDAR(parseInt(id));
      await loadDAR();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to approve DAR");
    }
  };

  const handleReject = async () => {
    if (!id) return;
    const reason = window.prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      await rejectDAR(parseInt(id), reason);
      await loadDAR();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to reject DAR");
    }
  };

  const handleExportPDF = async () => {
    if (!id) return;
    try {
      const blob = await exportDARPDF(parseInt(id));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DAR-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to export PDF");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Collect all photos from activities for gallery
  const allPhotos = dar?.activities
    .filter(a => a.photo_url)
    .map(a => ({
      url: a.photo_url!,
      caption: `${a.activity_time} - ${a.activity_type}: ${a.description.substring(0, 50)}${a.description.length > 50 ? '...' : ''}`
    })) || [];

  const openGallery = (photoUrl: string) => {
    const index = allPhotos.findIndex(p => p.url === photoUrl);
    if (index >= 0) {
      setGalleryIndex(index);
      setGalleryOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !dar) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error || "DAR not found"}
        </div>
        <button
          onClick={() => navigate("/supervisor/reporting/dar")}
          className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-5xl mx-auto">
      {/* Photo Gallery Modal */}
      {galleryOpen && allPhotos.length > 0 && (
        <PhotoGalleryModal
          photos={allPhotos}
          currentIndex={galleryIndex}
          onClose={() => setGalleryOpen(false)}
          onNavigate={setGalleryIndex}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-[#002B4B]">DAR Detail</h1>
        <div className="flex gap-2 flex-wrap">
          {dar.status === "DRAFT" && (
            <>
              <button
                onClick={() => navigate(`/supervisor/reporting/dar/${dar.id}/edit`)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Submit
              </button>
            </>
          )}
          {dar.status === "SUBMITTED" && (
            <>
              <button
                onClick={handleApprove}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            </>
          )}
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export PDF
          </button>
          <button
            onClick={() => navigate("/supervisor/reporting/dar")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      {/* Header Info */}
      <DashboardCard title="DAR Information">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-600">Site</div>
            <div className="text-sm font-medium">{dar.site_name || `Site ${dar.site_id}`}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Date</div>
            <div className="text-sm font-medium">{format(new Date(dar.report_date), "MMM dd, yyyy")}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Shift</div>
            <div className="text-sm font-medium">{dar.shift}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Status</div>
            <div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(dar.status)}`}>
                {dar.status}
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Weather</div>
            <div className="text-sm font-medium">{dar.weather || "N/A"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Created By</div>
            <div className="text-sm font-medium">{dar.created_by_name || `User ${dar.created_by}`}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Created At</div>
            <div className="text-sm font-medium">{format(new Date(dar.created_at), "MMM dd, yyyy HH:mm")}</div>
          </div>
          {dar.approved_at && (
            <div>
              <div className="text-xs text-gray-600">Approved At</div>
              <div className="text-sm font-medium">{format(new Date(dar.approved_at), "MMM dd, yyyy HH:mm")}</div>
            </div>
          )}
        </div>
        {dar.rejection_reason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <div className="text-xs font-medium text-red-800">Rejection Reason:</div>
            <div className="text-sm text-red-700 mt-1">{dar.rejection_reason}</div>
          </div>
        )}
      </DashboardCard>

      {/* Summary */}
      {dar.summary && (
        <DashboardCard title="Summary">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{dar.summary}</p>
        </DashboardCard>
      )}

      {/* Personnel */}
      <DashboardCard title={`Personnel on Duty (${dar.personnel.length})`}>
        {dar.personnel.length === 0 ? (
          <div className="text-sm text-gray-500">No personnel assigned</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dar.personnel.map((person, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-sm font-bold">
                    {String(person.user_id).charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">User {person.user_id}</div>
                  <div className="text-xs text-gray-600">
                    {person.role || "No role assigned"}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    ⏰ {person.check_in_time || "N/A"}
                    {person.check_out_time && ` → ${person.check_out_time}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>

      {/* Activities with Photo Gallery */}
      <DashboardCard title={`Activities (${dar.activities.length})`}>
        {dar.activities.length === 0 ? (
          <div className="text-sm text-gray-500">No activities recorded</div>
        ) : (
          <div className="space-y-4">
            {/* Photo Gallery Summary */}
            {allPhotos.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-blue-900">
                    📷 Photo Attachments ({allPhotos.length})
                  </h4>
                  <button
                    onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All →
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {allPhotos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => openGallery(photo.url)}
                      className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-white shadow-md hover:shadow-lg hover:scale-105 transition-all"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Timeline */}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-4">
                {dar.activities.map((activity, index) => (
                  <div key={index} className="relative pl-10">
                    {/* Timeline dot */}
                    <div className="absolute left-2.5 top-4 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow"></div>
                    
                    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {activity.activity_time}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                              {activity.activity_type}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700">{activity.description}</div>
                          {activity.location && (
                            <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                              <span>📍</span> {activity.location}
                            </div>
                          )}
                        </div>
                        
                        {/* Photo thumbnail */}
                        {activity.photo_url && (
                          <button
                            onClick={() => openGallery(activity.photo_url!)}
                            className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group"
                          >
                            <div className="relative w-full h-full">
                              <img
                                src={activity.photo_url}
                                alt="Activity evidence"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                                <span className="text-white opacity-0 group-hover:opacity-100 text-xl">🔍</span>
                              </div>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Handover Notes */}
      {dar.handover_notes && (
        <DashboardCard title="Handover Notes">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{dar.handover_notes}</p>
          </div>
        </DashboardCard>
      )}
    </div>
  );
}
