export type AdminOrderEvent = {
  type: "new-order";
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  createdAt: string;
};

type Client = {
  id: number;
  send: (event: string, data: unknown) => void;
};

const clients = new Map<number, Client>();
let nextClientId = 1;

export function addAdminOrderEventClient(send: Client["send"]): () => void {
  const id = nextClientId;
  nextClientId += 1;
  clients.set(id, { id, send });
  return () => {
    clients.delete(id);
  };
}

export function broadcastNewOrderEvent(event: Omit<AdminOrderEvent, "type">): void {
  const payload: AdminOrderEvent = { type: "new-order", ...event };
  for (const client of clients.values()) {
    client.send("new-order", payload);
  }
}
