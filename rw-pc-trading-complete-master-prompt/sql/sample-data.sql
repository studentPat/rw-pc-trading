-- RW PC Trading richer sample data
-- Optional: run this after sql/schema.sql.
-- For review samples, create at least one account first so reviews can stay linked to a real profile.

insert into public.categories (name, slug, description)
values
  ('CPU', 'cpu', 'Processors for productivity, gaming, and workstation builds.'),
  ('Motherboard', 'motherboard', 'Boards for Intel and AMD platforms.'),
  ('RAM', 'ram', 'Desktop and laptop memory kits.'),
  ('GPU', 'gpu', 'Graphics cards for gaming, editing, and rendering.'),
  ('PSU', 'psu', 'Power supplies for reliable PC builds.'),
  ('Storage', 'storage', 'SSD, NVMe, and hard drive storage.'),
  ('Case', 'case', 'Desktop cases with airflow and style.'),
  ('CPU Cooler', 'cpu-cooler', 'Air and liquid coolers.'),
  ('Accessories', 'accessories', 'Keyboards, mice, monitors, fans, and peripherals.')
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    is_active = true;

with sample_products (
  category_slug,
  name,
  brand,
  model,
  description,
  price,
  warranty_months,
  stock_quantity,
  part_type,
  power_draw_watts,
  compatibility
) as (
  values
    ('cpu', 'AMD Ryzen 5 5500', 'AMD', 'Ryzen 5 5500', '6-core AM4 processor for budget gaming and office builds.', 4995.00, 12, 9, 'CPU', 65, '{"cpu_socket":"AM4"}'::jsonb),
    ('cpu', 'AMD Ryzen 7 7800X3D', 'AMD', 'Ryzen 7 7800X3D', 'High-performance AM5 gaming CPU with 3D V-Cache.', 23995.00, 12, 3, 'CPU', 120, '{"cpu_socket":"AM5"}'::jsonb),
    ('cpu', 'Intel Core i5-12400F', 'Intel', 'Core i5-12400F', 'Efficient 6-core LGA1700 processor for gaming and productivity.', 7995.00, 12, 7, 'CPU', 65, '{"cpu_socket":"LGA1700"}'::jsonb),
    ('cpu', 'Intel Core i7-13700K', 'Intel', 'Core i7-13700K', 'Unlocked LGA1700 processor for gaming, streaming, and creative work.', 22995.00, 12, 2, 'CPU', 125, '{"cpu_socket":"LGA1700"}'::jsonb),

    ('motherboard', 'Gigabyte B650M DS3H', 'Gigabyte', 'B650M DS3H', 'AM5 Micro-ATX motherboard with DDR5 memory support.', 8995.00, 12, 4, 'Motherboard', 38, '{"cpu_socket":"AM5","ram_type":"DDR5","form_factor":"mATX"}'::jsonb),
    ('motherboard', 'ASUS Prime B760M-A WiFi D4', 'ASUS', 'Prime B760M-A WiFi D4', 'LGA1700 Micro-ATX motherboard with DDR4 and WiFi.', 8395.00, 12, 5, 'Motherboard', 35, '{"cpu_socket":"LGA1700","ram_type":"DDR4","form_factor":"mATX"}'::jsonb),
    ('motherboard', 'MSI PRO B650-P WiFi', 'MSI', 'PRO B650-P WiFi', 'AM5 ATX motherboard for DDR5 gaming and workstation builds.', 11995.00, 12, 2, 'Motherboard', 42, '{"cpu_socket":"AM5","ram_type":"DDR5","form_factor":"ATX"}'::jsonb),
    ('motherboard', 'ASRock B550M Steel Legend', 'ASRock', 'B550M Steel Legend', 'AM4 Micro-ATX motherboard with strong VRM and RGB accents.', 7295.00, 12, 3, 'Motherboard', 36, '{"cpu_socket":"AM4","ram_type":"DDR4","form_factor":"mATX"}'::jsonb),

    ('ram', 'G.Skill Ripjaws V 16GB DDR4 3200', 'G.Skill', 'Ripjaws V 16GB', '16GB DDR4 kit for reliable gaming and productivity performance.', 2395.00, 12, 14, 'RAM', 8, '{"ram_type":"DDR4","capacity_gb":16}'::jsonb),
    ('ram', 'Kingston Fury Beast 32GB DDR4 3600', 'Kingston', 'Fury Beast 32GB DDR4', '32GB DDR4 memory kit for heavier multitasking and gaming.', 4395.00, 12, 8, 'RAM', 10, '{"ram_type":"DDR4","capacity_gb":32}'::jsonb),
    ('ram', 'Corsair Vengeance 32GB DDR5 6000', 'Corsair', 'Vengeance DDR5 32GB', 'Fast 32GB DDR5 kit for AM5 and current Intel builds.', 6995.00, 12, 5, 'RAM', 12, '{"ram_type":"DDR5","capacity_gb":32}'::jsonb),
    ('ram', 'TeamGroup T-Force Delta RGB 16GB DDR5', 'TeamGroup', 'T-Force Delta RGB 16GB', 'RGB DDR5 memory kit for modern gaming PCs.', 3995.00, 12, 6, 'RAM', 10, '{"ram_type":"DDR5","capacity_gb":16}'::jsonb),

    ('gpu', 'MSI GeForce RTX 3050 Ventus 2X 6GB', 'MSI', 'RTX 3050 Ventus 2X 6GB', 'Entry gaming graphics card for esports and light creative work.', 10995.00, 24, 5, 'GPU', 70, '{"gpu_length_mm":189}'::jsonb),
    ('gpu', 'Sapphire Pulse Radeon RX 7600 8GB', 'Sapphire', 'Pulse RX 7600', 'Efficient 1080p gaming GPU with 8GB memory.', 15995.00, 24, 4, 'GPU', 165, '{"gpu_length_mm":240}'::jsonb),
    ('gpu', 'ASUS Dual GeForce RTX 4070 SUPER 12GB', 'ASUS', 'Dual RTX 4070 SUPER', 'High-performance 1440p graphics card with DLSS support.', 38995.00, 24, 2, 'GPU', 220, '{"gpu_length_mm":267}'::jsonb),
    ('gpu', 'Gigabyte GeForce RTX 4060 Eagle OC 8GB', 'Gigabyte', 'RTX 4060 Eagle OC', 'Cool and compact graphics card for efficient gaming builds.', 19995.00, 24, 3, 'GPU', 115, '{"gpu_length_mm":272}'::jsonb),

    ('psu', 'Cooler Master MWE 550 Bronze V2', 'Cooler Master', 'MWE 550 Bronze V2', '550W 80+ Bronze power supply for budget and office builds.', 2795.00, 36, 8, 'PSU', 0, '{"max_wattage":550}'::jsonb),
    ('psu', 'Seasonic Focus GX-750 Gold', 'Seasonic', 'Focus GX-750', '750W fully modular 80+ Gold PSU for high-end systems.', 6995.00, 60, 4, 'PSU', 0, '{"max_wattage":750}'::jsonb),
    ('psu', 'Corsair RM850e 850W Gold', 'Corsair', 'RM850e', '850W 80+ Gold PSU for powerful GPU upgrades.', 7995.00, 60, 2, 'PSU', 0, '{"max_wattage":850}'::jsonb),
    ('psu', 'FSP HV Pro 650W Bronze', 'FSP', 'HV Pro 650W', 'Reliable 650W PSU for mainstream gaming systems.', 3295.00, 36, 6, 'PSU', 0, '{"max_wattage":650}'::jsonb),

    ('storage', 'Kingston NV2 500GB NVMe SSD', 'Kingston', 'NV2 500GB', 'Affordable NVMe SSD for fast boot and app loading.', 1895.00, 36, 15, 'Storage', 4, '{"storage_interface":"M.2 NVMe","capacity_gb":500}'::jsonb),
    ('storage', 'Samsung 990 EVO 1TB NVMe SSD', 'Samsung', '990 EVO 1TB', 'Fast and efficient NVMe SSD for gaming and creative work.', 4995.00, 36, 7, 'Storage', 6, '{"storage_interface":"M.2 NVMe","capacity_gb":1000}'::jsonb),
    ('storage', 'Crucial MX500 1TB SATA SSD', 'Crucial', 'MX500 1TB', 'Reliable SATA SSD for upgrades and secondary storage.', 4295.00, 36, 8, 'Storage', 4, '{"storage_interface":"SATA","capacity_gb":1000}'::jsonb),
    ('storage', 'Seagate Barracuda 2TB HDD', 'Seagate', 'Barracuda 2TB', 'High-capacity hard drive for files, games, and backups.', 3295.00, 24, 9, 'Storage', 7, '{"storage_interface":"SATA","capacity_gb":2000}'::jsonb),

    ('case', 'Montech Air 100 ARGB', 'Montech', 'Air 100 ARGB', 'Micro-ATX airflow case with ARGB fans and tempered glass.', 3195.00, 12, 5, 'Case', 0, '{"supported_form_factors":["mATX","Mini-ITX"],"max_gpu_length_mm":330}'::jsonb),
    ('case', 'NZXT H5 Flow', 'NZXT', 'H5 Flow', 'Clean ATX airflow case for modern gaming builds.', 5495.00, 12, 2, 'Case', 0, '{"supported_form_factors":["ATX","mATX","Mini-ITX"],"max_gpu_length_mm":365}'::jsonb),
    ('case', 'Lian Li Lancool 216', 'Lian Li', 'Lancool 216', 'Spacious ATX case with strong airflow and upgrade room.', 5795.00, 12, 3, 'Case', 0, '{"supported_form_factors":["ATX","mATX","Mini-ITX"],"max_gpu_length_mm":392}'::jsonb),
    ('case', 'Tecware Nexus Air M2', 'Tecware', 'Nexus Air M2', 'Compact Micro-ATX case for practical shop builds.', 2195.00, 12, 6, 'Case', 0, '{"supported_form_factors":["mATX","Mini-ITX"],"max_gpu_length_mm":300}'::jsonb),

    ('cpu-cooler', 'Arctic Freezer 36', 'Arctic', 'Freezer 36', 'Quiet tower air cooler with modern socket support.', 1995.00, 12, 8, 'CPU Cooler', 4, '{"supported_sockets":["AM4","AM5","LGA1700","LGA1200"]}'::jsonb),
    ('cpu-cooler', 'ID-Cooling SE-214-XT ARGB', 'ID-Cooling', 'SE-214-XT ARGB', 'Affordable ARGB air cooler for gaming desktops.', 1395.00, 12, 10, 'CPU Cooler', 4, '{"supported_sockets":["AM4","AM5","LGA1700","LGA1200"]}'::jsonb),
    ('cpu-cooler', 'NZXT Kraken 240 RGB', 'NZXT', 'Kraken 240 RGB', '240mm liquid cooler for high-performance processors.', 8995.00, 24, 2, 'CPU Cooler', 6, '{"supported_sockets":["AM4","AM5","LGA1700"]}'::jsonb),

    ('accessories', 'Logitech G102 Lightsync Mouse', 'Logitech', 'G102 Lightsync', 'Wired RGB gaming mouse for casual and esports play.', 995.00, 12, 18, null, 0, '{}'::jsonb),
    ('accessories', 'Redragon K552 Mechanical Keyboard', 'Redragon', 'K552', 'Compact mechanical keyboard with tactile switches.', 1895.00, 12, 9, null, 0, '{}'::jsonb),
    ('accessories', 'AOC 24G2SP 24-inch 165Hz Monitor', 'AOC', '24G2SP', 'Fast IPS gaming monitor with 165Hz refresh rate.', 8995.00, 24, 4, null, 28, '{}'::jsonb),
    ('accessories', 'TP-Link Archer TX20E WiFi 6 Adapter', 'TP-Link', 'Archer TX20E', 'PCIe WiFi 6 and Bluetooth adapter for desktop PCs.', 1895.00, 12, 7, null, 3, '{}'::jsonb)
)
insert into public.products (
  category_id,
  name,
  brand,
  model,
  description,
  price,
  warranty_months,
  stock_quantity,
  part_type,
  power_draw_watts,
  compatibility
)
select
  c.id,
  sp.name,
  sp.brand,
  sp.model,
  sp.description,
  sp.price,
  sp.warranty_months,
  sp.stock_quantity,
  sp.part_type,
  sp.power_draw_watts,
  sp.compatibility
from sample_products sp
join public.categories c on c.slug = sp.category_slug
where not exists (
  select 1 from public.products p where lower(p.name) = lower(sp.name)
);

with product_image_map (product_name, image_url) as (
  values
    ('AMD Ryzen 5 5500', 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=80'),
    ('AMD Ryzen 7 7800X3D', 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=80'),
    ('Intel Core i5-12400F', 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=80'),
    ('Intel Core i7-13700K', 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=80'),
    ('Gigabyte B650M DS3H', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80'),
    ('ASUS Prime B760M-A WiFi D4', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80'),
    ('MSI PRO B650-P WiFi', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80'),
    ('ASRock B550M Steel Legend', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80'),
    ('G.Skill Ripjaws V 16GB DDR4 3200', 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=900&q=80'),
    ('Kingston Fury Beast 32GB DDR4 3600', 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=900&q=80'),
    ('Corsair Vengeance 32GB DDR5 6000', 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=900&q=80'),
    ('TeamGroup T-Force Delta RGB 16GB DDR5', 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=900&q=80'),
    ('MSI GeForce RTX 3050 Ventus 2X 6GB', 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=80'),
    ('Sapphire Pulse Radeon RX 7600 8GB', 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=80'),
    ('ASUS Dual GeForce RTX 4070 SUPER 12GB', 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=80'),
    ('Gigabyte GeForce RTX 4060 Eagle OC 8GB', 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=80'),
    ('Cooler Master MWE 550 Bronze V2', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80'),
    ('Seasonic Focus GX-750 Gold', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80'),
    ('Corsair RM850e 850W Gold', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80'),
    ('FSP HV Pro 650W Bronze', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80'),
    ('Kingston NV2 500GB NVMe SSD', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=900&q=80'),
    ('Samsung 990 EVO 1TB NVMe SSD', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=900&q=80'),
    ('Crucial MX500 1TB SATA SSD', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=900&q=80'),
    ('Seagate Barracuda 2TB HDD', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=900&q=80'),
    ('Montech Air 100 ARGB', 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?auto=format&fit=crop&w=900&q=80'),
    ('NZXT H5 Flow', 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?auto=format&fit=crop&w=900&q=80'),
    ('Lian Li Lancool 216', 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?auto=format&fit=crop&w=900&q=80'),
    ('Tecware Nexus Air M2', 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?auto=format&fit=crop&w=900&q=80'),
    ('Arctic Freezer 36', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80'),
    ('ID-Cooling SE-214-XT ARGB', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80'),
    ('NZXT Kraken 240 RGB', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80'),
    ('Logitech G102 Lightsync Mouse', 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80'),
    ('Redragon K552 Mechanical Keyboard', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80'),
    ('AOC 24G2SP 24-inch 165Hz Monitor', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80'),
    ('TP-Link Archer TX20E WiFi 6 Adapter', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80')
)
insert into public.product_images (product_id, image_url, is_primary, sort_order)
select p.id, pim.image_url, true, 0
from product_image_map pim
join public.products p on lower(p.name) = lower(pim.product_name)
where not exists (
  select 1 from public.product_images pi
  where pi.product_id = p.id and pi.image_url = pim.image_url
);

with sample_services (title, description, price_from, icon, image_url) as (
  values
    ('PC Deep Cleaning', 'Full dust removal, fan cleaning, airflow check, and exterior wipe-down for desktops.', 600.00, 'Sparkles', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80'),
    ('Thermal Paste Replacement', 'CPU or GPU thermal paste refresh to help improve temperatures and stability.', 450.00, 'Thermometer', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80'),
    ('Data Backup and Drive Cloning', 'Backup files or clone an old drive to a new SSD before an upgrade.', 700.00, 'HardDrive', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=900&q=80'),
    ('Virus Removal and Tune-Up', 'Malware cleanup, startup optimization, and basic system health check.', 500.00, 'ShieldCheck', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'),
    ('BIOS Update and Troubleshooting', 'BIOS update, boot troubleshooting, and compatibility checks for upgrades.', 600.00, 'Settings', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80'),
    ('Gaming PC Upgrade Consultation', 'Parts recommendation for GPU, RAM, SSD, PSU, and cooling upgrades.', 300.00, 'Gamepad2', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80'),
    ('Home or Office Network Setup', 'Router, WiFi adapter, printer sharing, and basic LAN setup assistance.', 800.00, 'Wifi', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80'),
    ('Software Installation Package', 'Driver setup, office apps, utilities, and essential software installation.', 400.00, 'Download', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'),
    ('Laptop RAM or SSD Upgrade', 'Laptop memory or SSD installation with boot and health testing.', 650.00, 'Laptop', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&q=80'),
    ('Cable Management Refresh', 'Cleaner internal cable routing for better airflow and easier maintenance.', 500.00, 'Cable', 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?auto=format&fit=crop&w=900&q=80')
)
insert into public.services (title, description, price_from, icon, image_url, is_active)
select title, description, price_from, icon, image_url, true
from sample_services ss
where not exists (
  select 1 from public.services s where lower(s.title) = lower(ss.title)
);

with numbered_profiles as (
  select id, row_number() over (order by created_at, id) as profile_no
  from public.profiles
),
profile_count as (
  select count(*)::integer as total from numbered_profiles
),
sample_reviews (review_no, rating, message, image_url) as (
  values
    (1, 5, 'Smooth transaction and the staff helped confirm compatible parts before I reserved.', 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=900&q=80'),
    (2, 5, 'My PC build was assembled neatly and boot-tested before pickup.', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80'),
    (3, 4, 'Good pricing on RAM and SSD upgrades. The reservation update was easy to track.', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=900&q=80'),
    (4, 5, 'They explained the deposit process clearly and verified my payment proof quickly.', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'),
    (5, 5, 'The laptop cleaning and thermal paste service made a big temperature difference.', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&q=80'),
    (6, 4, 'Helpful shop for budget gaming builds. I liked the pickup reservation flow.', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80'),
    (7, 5, 'Staff checked the PSU wattage and case clearance before approving my parts list.', 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?auto=format&fit=crop&w=900&q=80'),
    (8, 5, 'Fast response on Messenger and the item was ready when I arrived.', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80')
),
reviews_with_users as (
  select
    np.id as user_id,
    sr.rating,
    sr.message,
    sr.image_url
  from sample_reviews sr
  join profile_count pc on pc.total > 0
  join numbered_profiles np on np.profile_no = ((sr.review_no - 1) % pc.total) + 1
)
insert into public.reviews (user_id, rating, message, image_url, status)
select user_id, rating, message, image_url, 'approved'
from reviews_with_users rwu
where not exists (
  select 1 from public.reviews r where r.message = rwu.message
);
