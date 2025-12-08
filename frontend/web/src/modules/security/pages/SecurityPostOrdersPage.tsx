// frontend/web/src/modules/security/pages/SecurityPostOrdersPage.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { Card } from "../../shared/components/Card";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { useTranslation } from "../../../i18n/useTranslation";
import { useSite } from "../../shared/contexts/SiteContext";
import { useToast } from "../../shared/components/Toast";
import {
  listPostOrders,
  getPostOrder,
  acknowledgePostOrder,
  getMyAcknowledgments,
  type PostOrder,
} from "../../../api/securityApi";
import { theme } from "../../shared/components/theme";

export function SecurityPostOrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedSite } = useSite();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<PostOrder[]>([]);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PostOrder | null>(null);

  useEffect(() => {
    loadOrders();
    loadAcknowledgments();
  }, [selectedSite]);

  async function loadOrders() {
    try {
      setLoading(true);
      const { data } = await listPostOrders({
        site_id: selectedSite?.id,
        is_active: true,
      });
      setOrders(data);
    } catch (error: any) {
      showToast("Error loading post orders", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadAcknowledgments() {
    try {
      const { data } = await getMyAcknowledgments();
      setAcknowledgedIds(new Set(data.map((a) => a.post_order_id)));
    } catch (error: any) {
      // Ignore errors
    }
  }

  async function handleAcknowledge(orderId: number) {
    try {
      await acknowledgePostOrder(orderId);
      setAcknowledgedIds((prev) => new Set([...prev, orderId]));
      showToast(t("security.acknowledged"), "success");
    } catch (error: any) {
      showToast(t("common.error"), "error");
    }
  }

  async function handleViewDetail(orderId: number) {
    try {
      const { data } = await getPostOrder(orderId);
      setSelectedOrder(data);
    } catch (error: any) {
      showToast(t("common.error"), "error");
    }
  }

  const priorityColors: Record<string, string> = {
    critical: "#dc2626",
    high: "#ea580c",
    normal: "#3b82f6",
    low: "#6b7280",
  };

  return (
    <MobileLayout
      title={t("security.postOrders")}
      showBack
      onBackClick={() => navigate("/security")}
    >
      <div style={{ padding: "16px", paddingBottom: "80px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ color: theme.colors.textSecondary }}>{t("common.loading")}</div>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ color: theme.colors.textSecondary }}>
                {t("security.noPostOrders")}
              </div>
            </div>
          </Card>
        ) : (
          <>
            {orders.map((order) => {
              const isAcknowledged = acknowledgedIds.has(order.id);
              return (
                <Card key={order.id} style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, color: theme.colors.text }}>
                        {order.title}
                      </h3>
                      {order.category && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: theme.colors.textSecondary,
                            marginTop: "4px",
                          }}
                        >
                          {order.category}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <div
                        style={{
                          padding: "4px 8px",
                          background: priorityColors[order.priority] || "#6b7280",
                          color: "white",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        {order.priority.toUpperCase()}
                      </div>
                      {isAcknowledged && (
                        <StatusBadge status="completed" />
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      color: theme.colors.textSecondary,
                      marginBottom: "12px",
                      maxHeight: "100px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {order.content.substring(0, 150)}
                    {order.content.length > 150 && "..."}
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleViewDetail(order.id)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        background: theme.colors.backgroundSecondary,
                        color: theme.colors.text,
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      {t("security.viewDetails")}
                    </button>
                    {!isAcknowledged && (
                      <button
                        onClick={() => handleAcknowledge(order.id)}
                        style={{
                          flex: 1,
                          padding: "10px",
                          background: theme.colors.primary,
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "14px",
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        {t("security.acknowledge")}
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </>
        )}

        {selectedOrder && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 1000,
            }}
            onClick={() => setSelectedOrder(null)}
          >
            <Card
              style={{
                maxWidth: "500px",
                maxHeight: "80vh",
                overflow: "auto",
                background: "white",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginTop: 0 }}>{selectedOrder.title}</h2>
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  color: theme.colors.text,
                  lineHeight: "1.6",
                }}
              >
                {selectedOrder.content}
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  width: "100%",
                  marginTop: "16px",
                  padding: "10px",
                  background: theme.colors.primary,
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {t("common.close")}
              </button>
            </Card>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

