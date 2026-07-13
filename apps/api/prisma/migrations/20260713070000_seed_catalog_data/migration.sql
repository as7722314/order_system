INSERT INTO product_categories (id, name, sort_order, is_active, created_at, updated_at)
VALUES
  ('89afccc0-1e46-46d2-9568-8ae47e57e9a0', '預設商品', 0, true, now(), now()),
  ('00000000-0000-0000-0000-000000000101', '主餐', 1, true, now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO products (id, category_id, name, description, image_url, price, sort_order, is_active, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', '蔥油餅(整張)', '一張分成兩袋一袋一個口味哦！', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d', 90, 1, true, now(), now()),
  ('c8ec84b0-4309-4b7d-85fc-987f80b70399', '89afccc0-1e46-46d2-9568-8ae47e57e9a0', '蔥油餅(半張)', '選兩個口味是混在同一包哦！', null, 45, 2, true, now(), now())
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  price = EXCLUDED.price,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO flavors (id, name, extra_price, sort_order, is_active, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000301', '梅粉', 0, 1, true, now(), now()),
  ('00000000-0000-0000-0000-000000000302', '胡椒', 0, 2, true, now(), now()),
  ('425a8503-ce5b-4872-b484-616c131a1c42', '芥末', 0, 3, true, now(), now()),
  ('39012d5b-d685-430c-b765-eed5593f4faa', '海苔', 0, 4, true, now(), now()),
  ('57dddc76-1512-435f-b3f4-5677a3d0f271', '咖哩', 0, 5, true, now(), now()),
  ('d05f5508-9c7c-4eda-9527-b99967ddc070', '辣粉', 0, 6, true, now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  extra_price = EXCLUDED.extra_price,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

DELETE FROM product_flavors
WHERE product_id IN (
  '00000000-0000-0000-0000-000000000201',
  'c8ec84b0-4309-4b7d-85fc-987f80b70399'
);

INSERT INTO product_flavors (product_id, flavor_id)
VALUES
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000301'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000302'),
  ('00000000-0000-0000-0000-000000000201', '425a8503-ce5b-4872-b484-616c131a1c42'),
  ('00000000-0000-0000-0000-000000000201', '39012d5b-d685-430c-b765-eed5593f4faa'),
  ('00000000-0000-0000-0000-000000000201', '57dddc76-1512-435f-b3f4-5677a3d0f271'),
  ('00000000-0000-0000-0000-000000000201', 'd05f5508-9c7c-4eda-9527-b99967ddc070'),
  ('c8ec84b0-4309-4b7d-85fc-987f80b70399', '00000000-0000-0000-0000-000000000301'),
  ('c8ec84b0-4309-4b7d-85fc-987f80b70399', '00000000-0000-0000-0000-000000000302'),
  ('c8ec84b0-4309-4b7d-85fc-987f80b70399', '425a8503-ce5b-4872-b484-616c131a1c42'),
  ('c8ec84b0-4309-4b7d-85fc-987f80b70399', '39012d5b-d685-430c-b765-eed5593f4faa'),
  ('c8ec84b0-4309-4b7d-85fc-987f80b70399', '57dddc76-1512-435f-b3f4-5677a3d0f271'),
  ('c8ec84b0-4309-4b7d-85fc-987f80b70399', 'd05f5508-9c7c-4eda-9527-b99967ddc070')
ON CONFLICT DO NOTHING;
