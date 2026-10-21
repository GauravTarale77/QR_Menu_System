export type Category = {
  id: string;
  name: string;
  sort_order: number;
};

export type CustomizationOption = {
  id: string;
  name: string;
  kind: "remove" | "addon";
  price: number;
};

export type MenuItem = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_veg: boolean;
  is_available: boolean;
  is_special: boolean;
  special_price: number | null;
  customization_options: CustomizationOption[];
};

export type Combo = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  combo_items: { quantity: number; menu_items: { name: string } | null }[];
};

export type OrderView = {
  id: string;
  order_no: number;
  status: "new" | "preparing" | "served" | "cancelled";
  total: number;
  created_at: string;
  order_items: {
    name: string;
    quantity: number;
    unit_price: number;
    customizations: { name: string; kind: string; price: number }[];
    note: string | null;
  }[];
  reviewed: boolean;
};