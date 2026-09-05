BEGIN;

INSERT INTO contacts (
    name,
    contact_type,
    email,
    phone,
    city,
    state,
    pincode,
    profile_image_url
)
SELECT
    'Nimesh Pathak',
    'customer',
    'nimesh@example.com',
    '9876543210',
    'Ahmedabad',
    'Gujarat',
    '380001',
    NULL
WHERE NOT EXISTS (
    SELECT 1
    FROM contacts
    WHERE email = 'nimesh@example.com'
);

INSERT INTO contacts (
    name,
    contact_type,
    email,
    phone,
    city,
    state,
    pincode,
    profile_image_url
)
SELECT
    'Azure Furniture',
    'vendor',
    'azure@example.com',
    '9876543211',
    'Ahmedabad',
    'Gujarat',
    '380002',
    NULL
WHERE NOT EXISTS (
    SELECT 1
    FROM contacts
    WHERE email = 'azure@example.com'
);

INSERT INTO contacts (
    name,
    contact_type,
    email,
    phone,
    city,
    state,
    pincode,
    profile_image_url
)
SELECT
    'ABC Traders',
    'both',
    'abc@example.com',
    '9876543212',
    'Mumbai',
    'Maharashtra',
    '400001',
    NULL
WHERE NOT EXISTS (
    SELECT 1
    FROM contacts
    WHERE email = 'abc@example.com'
);

INSERT INTO products (
    name,
    product_type,
    category,
    sales_price,
    purchase_price,
    image_url
)
SELECT
    'Office Chair',
    'goods',
    'Chairs',
    10000.00,
    7000.00,
    NULL
WHERE NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Office Chair'
);

INSERT INTO products (
    name,
    product_type,
    category,
    sales_price,
    purchase_price,
    image_url
)
SELECT
    'Wooden Table',
    'goods',
    'Tables',
    15000.00,
    10000.00,
    NULL
WHERE NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Wooden Table'
);

INSERT INTO products (
    name,
    product_type,
    category,
    sales_price,
    purchase_price,
    image_url
)
SELECT
    'Sofa',
    'goods',
    'Seating',
    30000.00,
    22000.00,
    NULL
WHERE NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Sofa'
);

INSERT INTO products (
    name,
    product_type,
    category,
    sales_price,
    purchase_price,
    image_url
)
SELECT
    'Dining Table',
    'goods',
    'Tables',
    25000.00,
    18000.00,
    NULL
WHERE NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Dining Table'
);

INSERT INTO products (
    name,
    product_type,
    category,
    sales_price,
    purchase_price,
    image_url
)
SELECT
    'Furniture Consultation',
    'service',
    'Services',
    5000.00,
    0.00,
    NULL
WHERE NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Furniture Consultation'
);

INSERT INTO chart_of_accounts (
    account_code,
    account_name,
    account_type,
    account_subtype
)
VALUES
    ('1000', 'Cash', 'asset', 'cash'),
    ('1010', 'Bank', 'asset', 'bank'),
    ('1100', 'Accounts Receivable', 'asset', 'receivable'),
    ('1200', 'Tax Receivable', 'asset', 'tax_receivable'),
    ('2000', 'Accounts Payable', 'liability', 'payable'),
    ('2100', 'Tax Payable', 'liability', 'tax_payable'),
    ('3000', 'Capital', 'capital', 'capital'),
    ('4000', 'Sales Income', 'income', 'sales'),
    ('5000', 'Purchase Expense', 'expense', 'purchase'),
    ('5100', 'Other Expense', 'expense', 'other')
ON CONFLICT (account_code) DO NOTHING;

INSERT INTO taxes (
    name,
    rate,
    sales_tax_account_id,
    purchase_tax_account_id
)
SELECT
    'GST 18%',
    18.00,
    sales_account.id,
    purchase_account.id
FROM chart_of_accounts sales_account
JOIN chart_of_accounts purchase_account
    ON purchase_account.account_code = '1200'
WHERE sales_account.account_code = '2100'
  AND NOT EXISTS (
      SELECT 1
      FROM taxes
      WHERE name = 'GST 18%'
  );

INSERT INTO journals (
    journal_name,
    journal_type,
    default_account_id
)
SELECT
    'Sales Journal',
    'sales',
    id
FROM chart_of_accounts
WHERE account_code = '1100'
  AND NOT EXISTS (
      SELECT 1
      FROM journals
      WHERE journal_name = 'Sales Journal'
  );

INSERT INTO journals (
    journal_name,
    journal_type,
    default_account_id
)
SELECT
    'Purchase Journal',
    'purchase',
    id
FROM chart_of_accounts
WHERE account_code = '2000'
  AND NOT EXISTS (
      SELECT 1
      FROM journals
      WHERE journal_name = 'Purchase Journal'
  );

INSERT INTO journals (
    journal_name,
    journal_type,
    default_account_id
)
SELECT
    'Bank Journal',
    'bank',
    id
FROM chart_of_accounts
WHERE account_code = '1010'
  AND NOT EXISTS (
      SELECT 1
      FROM journals
      WHERE journal_name = 'Bank Journal'
  );

INSERT INTO journals (
    journal_name,
    journal_type,
    default_account_id
)
SELECT
    'Cash Journal',
    'cash',
    id
FROM chart_of_accounts
WHERE account_code = '1000'
  AND NOT EXISTS (
      SELECT 1
      FROM journals
      WHERE journal_name = 'Cash Journal'
  );

INSERT INTO analytic_accounts (
    name,
    analytic_type
)
SELECT
    'Showroom Operations',
    'expense'
WHERE NOT EXISTS (
    SELECT 1
    FROM analytic_accounts
    WHERE name = 'Showroom Operations'
);

INSERT INTO analytic_accounts (
    name,
    analytic_type
)
SELECT
    'Sales Operations',
    'income'
WHERE NOT EXISTS (
    SELECT 1
    FROM analytic_accounts
    WHERE name = 'Sales Operations'
);

INSERT INTO analytic_accounts (
    name,
    analytic_type
)
SELECT
    'Furniture Projects',
    'expense'
WHERE NOT EXISTS (
    SELECT 1
    FROM analytic_accounts
    WHERE name = 'Furniture Projects'
);

INSERT INTO budgets (
    budget_name,
    start_date,
    end_date,
    responsible_user_id,
    status
)
SELECT
    'FY 2026-27 Furniture Budget',
    DATE '2026-04-01',
    DATE '2027-03-31',
    NULL,
    'draft'
WHERE NOT EXISTS (
    SELECT 1
    FROM budgets
    WHERE budget_name = 'FY 2026-27 Furniture Budget'
);

INSERT INTO budget_lines (
    budget_id,
    analytic_account_id,
    planned_amount
)
SELECT
    b.id,
    a.id,
    500000.00
FROM budgets b
JOIN analytic_accounts a
    ON a.name = 'Showroom Operations'
WHERE b.budget_name = 'FY 2026-27 Furniture Budget'
  AND NOT EXISTS (
      SELECT 1
      FROM budget_lines bl
      WHERE bl.budget_id = b.id
        AND bl.analytic_account_id = a.id
  );

INSERT INTO budget_lines (
    budget_id,
    analytic_account_id,
    planned_amount
)
SELECT
    b.id,
    a.id,
    300000.00
FROM budgets b
JOIN analytic_accounts a
    ON a.name = 'Furniture Projects'
WHERE b.budget_name = 'FY 2026-27 Furniture Budget'
  AND NOT EXISTS (
      SELECT 1
      FROM budget_lines bl
      WHERE bl.budget_id = b.id
        AND bl.analytic_account_id = a.id
  );

INSERT INTO contacts (
    name,
    contact_type,
    email,
    phone,
    city,
    state,
    pincode,
    profile_image_url
)
SELECT
    format('Demo Contact %s', to_char(series.number, 'FM000')),
    CASE series.number % 3
        WHEN 0 THEN 'customer'
        WHEN 1 THEN 'vendor'
        ELSE 'both'
    END,
    format('contact%3$s@example.com', series.number, '', to_char(series.number, 'FM000')),
    '90000' || lpad(series.number::text, 5, '0'),
    'Ahmedabad',
    'Gujarat',
    format('%06s', 380000 + series.number),
    NULL
FROM generate_series(1, 200) AS series(number)
WHERE NOT EXISTS (
    SELECT 1
    FROM contacts c
    WHERE c.email = format('contact%3$s@example.com', series.number, '', to_char(series.number, 'FM000'))
);

INSERT INTO users (
    login_id,
    full_name,
    email,
    password_hash,
    role,
    contact_id
)
SELECT
    format('admin%3$s', series.number, '', to_char(series.number, 'FM000')),
    format('Demo Admin %s', to_char(series.number, 'FM000')),
    format('admin%3$s@urbanfurniture.local', series.number, '', to_char(series.number, 'FM000')),
    '$2b$10$.jycNP.ph3zlWPbOJIL2B.wTjgk7khExOKyeF28lA75g3F1XiYHDa',
    'admin',
    NULL
FROM generate_series(1, 200) AS series(number)
ON CONFLICT (login_id) DO NOTHING;

INSERT INTO users (
    login_id,
    full_name,
    email,
    password_hash,
    role,
    contact_id
)
SELECT
    format('accountant%3$s', series.number, '', to_char(series.number, 'FM000')),
    format('Demo Accountant %s', to_char(series.number, 'FM000')),
    format('accountant%3$s@urbanfurniture.local', series.number, '', to_char(series.number, 'FM000')),
    '$2b$10$.jycNP.ph3zlWPbOJIL2B.wTjgk7khExOKyeF28lA75g3F1XiYHDa',
    'accountant',
    NULL
FROM generate_series(1, 200) AS series(number)
ON CONFLICT (login_id) DO NOTHING;

INSERT INTO users (
    login_id,
    full_name,
    email,
    password_hash,
    role,
    contact_id
)
SELECT
    format('contact%3$s', series.number, '', to_char(series.number, 'FM000')),
    format('Demo Contact %s', to_char(series.number, 'FM000')),
    format('contact%3$s@example.com', series.number, '', to_char(series.number, 'FM000')),
    '$2b$10$.jycNP.ph3zlWPbOJIL2B.wTjgk7khExOKyeF28lA75g3F1XiYHDa',
    'contact',
    c.id
FROM generate_series(1, 200) AS series(number)
JOIN contacts c
    ON c.email = format('contact%3$s@example.com', series.number, '', to_char(series.number, 'FM000'))
ON CONFLICT (login_id) DO NOTHING;

COMMIT;
