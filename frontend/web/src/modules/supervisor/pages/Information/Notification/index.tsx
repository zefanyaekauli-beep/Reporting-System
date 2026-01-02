// frontend/web/src/modules/supervisor/pages/Information/Notification/index.tsx

import React, { useEffect, useState } from "react";
import api from "../../../../../api/client";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export function InformationNotificationPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [isRead, setIsRead] = useState<boolean | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [isRead, typeFilter]);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (isRead !== undefined) params.is_read = isRead;
      if (typeFilter) params.type = typeFilter;

      const response = await api.get("/information/notification", { params });
      setNotifications(response.data);
    } catch (err: any) {
      console.error("Failed to load notifications:", err);
      setError(err.response?.data?.detail || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await api.post(`/api/v1/information/notification/${notificationId}/read`);
      loadNotifications();
    } catch (err: any) {
      console.error("Failed to mark notification as read:", err);
      alert(err.response?.data?.detail || "Failed to mark as read");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "INFO":
        return "bg-blue-100 text-blue-800";
      case "WARNING":
        return "bg-yellow-100 text-yellow-800";
      case "ERROR":
        return "bg-red-100 text-red-800";
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-[#002B4B]">Notification Center</h1>

      {/* Filters */}
      <DashboardCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={isRead === undefined ? "" : isRead ? "read" : "unread"}
              onChange={(e) => setIsRead(e.target.value === "" ? undefined : e.target.value === "read")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter || ""}
              onChange={(e) => setTypeFilter(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Types</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="SUCCESS">Success</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <DashboardCard title="Notifications">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No notifications found</div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded ${notification.is_read ? "bg-gray-50" : "bg-blue-50"} border ${notification.is_read ? "border-gray-200" : "border-blue-200"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(notification.type)}`}>
                        {notification.type}
                      </span>
                      {!notification.is_read && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          New
                        </span>
                      )}
                    </div>
                    <div className="font-medium mb-1">{notification.title}</div>
                    <div className="text-sm text-gray-600 mb-2">{notification.message}</div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(notification.created_at), "MMM dd, yyyy HH:mm")}
                    </div>
                  </div>
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="ml-4 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>
    </div>
  );
}

