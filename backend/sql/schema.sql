CREATE TABLE IF NOT EXISTS contacts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_type VARCHAR(20) NOT NULL
        CHECK (contact_type IN ('customer', 'vendor', 'both')),
    email VARCHAR(255),
    phone VARCHAR(30),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    profile_image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    login_id VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('admin', 'accountant', 'contact')),
    contact_id BIGINT UNIQUE
        REFERENCES contacts(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (role = 'contact' AND contact_id IS NOT NULL)
        OR
        (role IN ('admin', 'accountant') AND contact_id IS NULL)
    )
);

CREATE TABLE IF NOT EXISTS products (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    product_type VARCHAR(20) NOT NULL
        CHECK (product_type IN ('goods', 'service', 'combo')),
    category VARCHAR(100),
    sales_price NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (sales_price >= 0),
    purchase_price NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (purchase_price >= 0),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_code VARCHAR(30) UNIQUE,
    account_name VARCHAR(150) NOT NULL UNIQUE,
    account_type VARCHAR(20) NOT NULL
        CHECK (
            account_type IN (
                'asset',
                'liability',
                'expense',
                'income',
                'capital'
            )
        ),
    account_subtype VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS taxes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    rate NUMERIC(5,2) NOT NULL
        CHECK (rate >= 0 AND rate <= 100),
    sales_tax_account_id BIGINT NOT NULL
        REFERENCES chart_of_accounts(id),
    purchase_tax_account_id BIGINT NOT NULL
        REFERENCES chart_of_accounts(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journals (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    journal_name VARCHAR(100) NOT NULL UNIQUE,
    journal_type VARCHAR(20) NOT NULL
        CHECK (
            journal_type IN (
                'sales',
                'purchase',
                'bank',
                'cash'
            )
        ),
    default_account_id BIGINT
        REFERENCES chart_of_accounts(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytic_accounts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    analytic_type VARCHAR(20) NOT NULL
        CHECK (analytic_type IN ('income', 'expense')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    budget_name VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    responsible_user_id BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (
            status IN (
                'draft',
                'confirmed',
                'revised',
                'cancelled'
            )
        ),
    revised_from_id BIGINT UNIQUE
        REFERENCES budgets(id)
        ON DELETE SET NULL,
    created_by BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date >= start_date),
    CHECK (
        revised_from_id IS NULL
        OR revised_from_id <> id
    )
);

CREATE TABLE IF NOT EXISTS budget_lines (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    budget_id BIGINT NOT NULL
        REFERENCES budgets(id)
        ON DELETE CASCADE,
    analytic_account_id BIGINT NOT NULL
        REFERENCES analytic_accounts(id),
    planned_amount NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (planned_amount >= 0),
    UNIQUE (budget_id, analytic_account_id)
);

CREATE TABLE IF NOT EXISTS sales_orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    so_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL
        REFERENCES contacts(id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (
            status IN (
                'draft',
                'confirmed',
                'cancelled'
            )
        ),
    notes TEXT,
    created_by BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_order_lines (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sales_order_id BIGINT NOT NULL
        REFERENCES sales_orders(id)
        ON DELETE CASCADE,
    product_id BIGINT NOT NULL
        REFERENCES products(id),
    analytic_account_id BIGINT
        REFERENCES analytic_accounts(id),
    account_id BIGINT
        REFERENCES chart_of_accounts(id),
    tax_id BIGINT
        REFERENCES taxes(id),
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (tax_rate >= 0 AND tax_rate <= 100),
    quantity NUMERIC(14,3) NOT NULL
        CHECK (quantity > 0),
    unit_price NUMERIC(14,2) NOT NULL
        CHECK (unit_price >= 0),
    line_subtotal NUMERIC(14,2)
        GENERATED ALWAYS AS (
            ROUND(quantity * unit_price, 2)
        ) STORED,
    tax_amount NUMERIC(14,2)
        GENERATED ALWAYS AS (
            ROUND(
                quantity * unit_price * tax_rate / 100,
                2
            )
        ) STORED,
    line_total NUMERIC(14,2)
        GENERATED ALWAYS AS (
            ROUND(
                quantity * unit_price
                + quantity * unit_price * tax_rate / 100,
                2
            )
        ) STORED
);

CREATE TABLE IF NOT EXISTS customer_invoices (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    so_id BIGINT UNIQUE
        REFERENCES sales_orders(id),
    customer_id BIGINT NOT NULL
        REFERENCES contacts(id),
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    reference VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (
            status IN (
                'draft',
                'confirmed',
                'paid',
                'cancelled'
            )
        ),
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (subtotal >= 0),
    tax_total NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (tax_total >= 0),
    grand_total NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (grand_total >= 0),
    paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (paid_amount >= 0),
    created_by BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        due_date IS NULL
        OR due_date >= invoice_date
    ),
    CHECK (paid_amount <= grand_total),
    CHECK (grand_total = subtotal + tax_total)
);

CREATE TABLE IF NOT EXISTS customer_invoice_lines (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_id BIGINT NOT NULL
        REFERENCES customer_invoices(id)
        ON DELETE CASCADE,
    sales_order_line_id BIGINT
        REFERENCES sales_order_lines(id),
    product_id BIGINT NOT NULL
        REFERENCES products(id),
    analytic_account_id BIGINT
        REFERENCES analytic_accounts(id),
    account_id BIGINT NOT NULL
        REFERENCES chart_of_accounts(id),
    tax_id BIGINT
        REFERENCES taxes(id),
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (tax_rate >= 0 AND tax_rate <= 100),
    quantity NUMERIC(14,3) NOT NULL
        CHECK (quantity > 0),
    unit_price NUMERIC(14,2) NOT NULL
        CHECK (unit_price >= 0),
    line_subtotal NUMERIC(14,2)
        GENERATED ALWAYS AS (
            ROUND(quantity * unit_price, 2)
        ) STORED,
    tax_amount NUMERIC(14,2)
        GENERATED ALWAYS AS (
            ROUND(
                quantity * unit_price * tax_rate / 100,
                2
            )
        ) STORED,
    line_total NUMERIC(14,2)
        GENERATED ALWAYS AS (
            ROUND(
                quantity * unit_price
                + quantity * unit_price * tax_rate / 100,
                2
            )
        ) STORED
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    po_number VARCHAR(50) NOT NULL UNIQUE,
    vendor_id BIGINT NOT NULL
        REFERENCES contacts(id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (
            status IN (
                'draft',
                'confirmed',
                'cancelled'
            )
        ),
    notes TEXT,
    created_by BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_lines (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL
        REFERENCES purchase_orders(id)
        ON DELETE CASCADE,
    product_id BIGINT NOT NULL
        REFERENCES products(id),
    analytic_account_id BIGINT
        REFERENCES analytic_accounts(id),
    account_id BIGINT
        REFERENCES chart_of_accounts(id),
    tax_id BIGINT
        REFERENCES taxes(id),
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (tax_rate >= 0 AND tax_rate <= 100),
    quantity NUMERIC(14,3) NOT NULL
        CHECK (quantity > 0),
    unit_price NUMERIC(14,2) NOT NULL
        CHECK (unit_price >= 0),
    line_subtotal NUMERIC(14,2)
        GENERATED ALWAYS AS (
            ROUND(quantity * unit_price, 2)
        ) STORED,
    tax_amount NUMERIC(14,2)
        GENERATED ALWAYS AS (
            ROUND(
                quantity * unit_price * tax_rate / 100,
                2
            )
        ) STORED,
    line_total NUMERIC(14,2)
        GENERATED ALWAYS AS (
            ROUND(
                quantity * unit_price
                + quantity * unit_price * tax_rate / 100,
                2
            )
        ) STORED
);

CREATE TABLE IF NOT EXISTS vendor_bills (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    bill_number VARCHAR(50) NOT NULL UNIQUE,
    po_id BIGINT UNIQUE
        REFERENCES purchase_orders(id),
    vendor_id BIGINT NOT NULL
        REFERENCES contacts(id),
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    reference VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (
            status IN (
                'draft',
                'confirmed',
                'paid',
                'cancelled'
            )
        ),
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (subtotal >= 0),
    tax_total NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (tax_total >= 0),
    grand_total NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (grand_total >= 0),
    paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (paid_amount >= 0),
    created_by BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        due_date IS NULL
        OR due_date >= bill_date
    ),
    CHECK (paid_amount <= grand_total),
    CHECK (grand_total = subtotal + tax_total)
);

CREATE TABLE IF NOT EXISTS vendor_bill_lines (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    bill_id BIGINT NOT NULL
        REFERENCES vendor_bills(id)
        ON DELETE CASCADE,
    purchase_order_line_id BIGINT
        REFERENCES purchase_order_lines(id),
    product_id BIGINT NOT NULL
        REFERENCES products(id),
    analytic_account_id BIGINT
        REFERENCES analytic_accounts(id),
    account_id BIGINT NOT NULL
        REFERENCES chart_of_accounts(id),
    tax_id BIGINT
        REFERENCES taxes(id),
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (tax_rate >= 0 AND tax_rate <= 100),
    quantity NUMERIC(14,3) NOT NULL
        CHECK (quantity > 0),
    unit_price NUMERIC(14,2) NOT NULL
        CHECK (unit_price >= 0),
    line_subtotal NUMERIC(14,2)
        GENERATED ALWAYS AS (
            ROUND(quantity * unit_price, 2)
        ) STORED,
    tax_amount NUMERIC(14,2)
        GENERATED ALWAYS AS (
            ROUND(
                quantity * unit_price * tax_rate / 100,
                2
            )
        ) STORED,
    line_total NUMERIC(14,2)
        GENERATED ALWAYS AS (
            ROUND(
                quantity * unit_price
                + quantity * unit_price * tax_rate / 100,
                2
            )
        ) STORED
);

CREATE TABLE IF NOT EXISTS payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payment_number VARCHAR(50) NOT NULL UNIQUE,

    customer_id BIGINT
        REFERENCES contacts(id),

    invoice_id BIGINT
        REFERENCES customer_invoices(id),

    vendor_id BIGINT
        REFERENCES contacts(id),

    bill_id BIGINT
        REFERENCES vendor_bills(id),

    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,

    direction VARCHAR(10) NOT NULL
        CHECK (direction IN ('in', 'out')),

    method VARCHAR(10) NOT NULL
        CHECK (method IN ('cash', 'bank')),

    amount NUMERIC(14,2) NOT NULL
        CHECK (amount > 0),

    reference VARCHAR(100),

    status VARCHAR(20) NOT NULL DEFAULT 'posted'
        CHECK (
            status IN (
                'draft',
                'posted',
                'cancelled'
            )
        ),

    created_by BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
        (invoice_id IS NOT NULL AND bill_id IS NULL)
        OR
        (invoice_id IS NULL AND bill_id IS NOT NULL)
    ),

    CHECK (
        (direction = 'in'
            AND invoice_id IS NOT NULL
            AND bill_id IS NULL
            AND customer_id IS NOT NULL
            AND vendor_id IS NULL)
        OR
        (direction = 'out'
            AND invoice_id IS NULL
            AND bill_id IS NOT NULL
            AND customer_id IS NULL
            AND vendor_id IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    entry_number VARCHAR(50) NOT NULL UNIQUE,

    journal_id BIGINT NOT NULL
        REFERENCES journals(id),

    accounting_date DATE NOT NULL DEFAULT CURRENT_DATE,

    reference VARCHAR(150),

    source_type VARCHAR(20) NOT NULL
        CHECK (
            source_type IN (
                'invoice',
                'bill',
                'payment',
                'manual'
            )
        ),

    source_id BIGINT,

    status VARCHAR(20) NOT NULL DEFAULT 'posted'
        CHECK (
            status IN (
                'draft',
                'posted',
                'cancelled'
            )
        ),

    created_by BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    journal_entry_id BIGINT NOT NULL
        REFERENCES journal_entries(id)
        ON DELETE CASCADE,

    account_id BIGINT NOT NULL
        REFERENCES chart_of_accounts(id),

    partner_id BIGINT
        REFERENCES contacts(id),

    analytic_account_id BIGINT
        REFERENCES analytic_accounts(id),

    description TEXT,

    debit NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (debit >= 0),

    credit NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (credit >= 0),

    CHECK (
        (debit > 0 AND credit = 0)
        OR
        (credit > 0 AND debit = 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_users_contact_id
    ON users(contact_id);

CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id
    ON sales_orders(customer_id);

CREATE INDEX IF NOT EXISTS idx_sales_orders_status
    ON sales_orders(status);

CREATE INDEX IF NOT EXISTS idx_sales_order_lines_order_id
    ON sales_order_lines(sales_order_id);

CREATE INDEX IF NOT EXISTS idx_sales_order_lines_product_id
    ON sales_order_lines(product_id);

CREATE INDEX IF NOT EXISTS idx_sales_order_lines_analytic_id
    ON sales_order_lines(analytic_account_id);

CREATE INDEX IF NOT EXISTS idx_customer_invoices_customer_id
    ON customer_invoices(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_invoices_status
    ON customer_invoices(status);

CREATE INDEX IF NOT EXISTS idx_customer_invoices_date
    ON customer_invoices(invoice_date);

CREATE INDEX IF NOT EXISTS idx_customer_invoice_lines_invoice_id
    ON customer_invoice_lines(invoice_id);

CREATE INDEX IF NOT EXISTS idx_customer_invoice_lines_source_line
    ON customer_invoice_lines(sales_order_line_id);

CREATE INDEX IF NOT EXISTS idx_customer_invoice_lines_analytic_id
    ON customer_invoice_lines(analytic_account_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_id
    ON purchase_orders(vendor_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_status
    ON purchase_orders(status);

CREATE INDEX IF NOT EXISTS idx_purchase_order_lines_order_id
    ON purchase_order_lines(purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_lines_product_id
    ON purchase_order_lines(product_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_lines_analytic_id
    ON purchase_order_lines(analytic_account_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_lines_tax_id
    ON purchase_order_lines(tax_id);

CREATE INDEX IF NOT EXISTS idx_vendor_bills_vendor_id
    ON vendor_bills(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_bills_status
    ON vendor_bills(status);

CREATE INDEX IF NOT EXISTS idx_vendor_bills_date
    ON vendor_bills(bill_date);

CREATE INDEX IF NOT EXISTS idx_vendor_bill_lines_bill_id
    ON vendor_bill_lines(bill_id);

CREATE INDEX IF NOT EXISTS idx_vendor_bill_lines_source_line
    ON vendor_bill_lines(purchase_order_line_id);

CREATE INDEX IF NOT EXISTS idx_vendor_bill_lines_analytic_id
    ON vendor_bill_lines(analytic_account_id);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id
    ON payments(invoice_id);

CREATE INDEX IF NOT EXISTS idx_payments_bill_id
    ON payments(bill_id);

CREATE INDEX IF NOT EXISTS idx_payments_customer_id
    ON payments(customer_id);

CREATE INDEX IF NOT EXISTS idx_payments_vendor_id
    ON payments(vendor_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_date
    ON journal_entries(accounting_date);

CREATE INDEX IF NOT EXISTS idx_journal_entries_source
    ON journal_entries(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry_id
    ON journal_entry_lines(journal_entry_id);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account_id
    ON journal_entry_lines(account_id);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_partner_id
    ON journal_entry_lines(partner_id);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_analytic_id
    ON journal_entry_lines(analytic_account_id);

CREATE INDEX IF NOT EXISTS idx_budget_lines_budget_id
    ON budget_lines(budget_id);

CREATE INDEX IF NOT EXISTS idx_budget_lines_analytic_id
    ON budget_lines(analytic_account_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON contacts;
CREATE TRIGGER trg_contacts_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_chart_of_accounts_updated_at ON chart_of_accounts;
CREATE TRIGGER trg_chart_of_accounts_updated_at
BEFORE UPDATE ON chart_of_accounts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_taxes_updated_at ON taxes;
CREATE TRIGGER trg_taxes_updated_at
BEFORE UPDATE ON taxes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_journals_updated_at ON journals;
CREATE TRIGGER trg_journals_updated_at
BEFORE UPDATE ON journals
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_analytic_accounts_updated_at ON analytic_accounts;
CREATE TRIGGER trg_analytic_accounts_updated_at
BEFORE UPDATE ON analytic_accounts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_budgets_updated_at ON budgets;
CREATE TRIGGER trg_budgets_updated_at
BEFORE UPDATE ON budgets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_sales_orders_updated_at ON sales_orders;
CREATE TRIGGER trg_sales_orders_updated_at
BEFORE UPDATE ON sales_orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_customer_invoices_updated_at ON customer_invoices;
CREATE TRIGGER trg_customer_invoices_updated_at
BEFORE UPDATE ON customer_invoices
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_purchase_orders_updated_at ON purchase_orders;
CREATE TRIGGER trg_purchase_orders_updated_at
BEFORE UPDATE ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_vendor_bills_updated_at ON vendor_bills;
CREATE TRIGGER trg_vendor_bills_updated_at
BEFORE UPDATE ON vendor_bills
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER trg_journal_entries_updated_at
BEFORE UPDATE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION validate_payment_party()
RETURNS TRIGGER AS $$
DECLARE
    document_party_id BIGINT;
BEGIN
    IF NEW.direction = 'in' THEN
        SELECT customer_id INTO document_party_id
        FROM customer_invoices
        WHERE id = NEW.invoice_id;

        IF document_party_id IS NULL OR NEW.customer_id <> document_party_id THEN
            RAISE EXCEPTION 'Payment customer must match the invoice customer';
        END IF;
    ELSE
        SELECT vendor_id INTO document_party_id
        FROM vendor_bills
        WHERE id = NEW.bill_id;

        IF document_party_id IS NULL OR NEW.vendor_id <> document_party_id THEN
            RAISE EXCEPTION 'Payment vendor must match the bill vendor';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_invoice_source()
RETURNS TRIGGER AS $$
DECLARE
    order_customer_id BIGINT;
BEGIN
    IF NEW.so_id IS NOT NULL THEN
        SELECT customer_id INTO order_customer_id
        FROM sales_orders
        WHERE id = NEW.so_id;

        IF order_customer_id IS NULL OR NEW.customer_id <> order_customer_id THEN
            RAISE EXCEPTION 'Invoice customer must match the sales order customer';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_invoice_line_source()
RETURNS TRIGGER AS $$
DECLARE
    invoice_order_id BIGINT;
    source_order_id BIGINT;
BEGIN
    IF NEW.sales_order_line_id IS NOT NULL THEN
        SELECT so_id INTO invoice_order_id
        FROM customer_invoices
        WHERE id = NEW.invoice_id;

        SELECT sales_order_id INTO source_order_id
        FROM sales_order_lines
        WHERE id = NEW.sales_order_line_id;

        IF invoice_order_id IS NULL OR source_order_id <> invoice_order_id THEN
            RAISE EXCEPTION 'Invoice line must belong to the invoice sales order';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_bill_source()
RETURNS TRIGGER AS $$
DECLARE
    order_vendor_id BIGINT;
BEGIN
    IF NEW.po_id IS NOT NULL THEN
        SELECT vendor_id INTO order_vendor_id
        FROM purchase_orders
        WHERE id = NEW.po_id;

        IF order_vendor_id IS NULL OR NEW.vendor_id <> order_vendor_id THEN
            RAISE EXCEPTION 'Bill vendor must match the purchase order vendor';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_bill_line_source()
RETURNS TRIGGER AS $$
DECLARE
    bill_order_id BIGINT;
    source_order_id BIGINT;
BEGIN
    IF NEW.purchase_order_line_id IS NOT NULL THEN
        SELECT po_id INTO bill_order_id
        FROM vendor_bills
        WHERE id = NEW.bill_id;

        SELECT purchase_order_id INTO source_order_id
        FROM purchase_order_lines
        WHERE id = NEW.purchase_order_line_id;

        IF bill_order_id IS NULL OR source_order_id <> bill_order_id THEN
            RAISE EXCEPTION 'Bill line must belong to the bill purchase order';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_posted_journal_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'posted' THEN
        RAISE EXCEPTION 'Posted journal entries are immutable';
    END IF;

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_posted_journal_line_mutation()
RETURNS TRIGGER AS $$
DECLARE
    entry_status VARCHAR(20);
BEGIN
    SELECT status INTO entry_status
    FROM journal_entries
    WHERE id = OLD.journal_entry_id;

    IF entry_status = 'posted' THEN
        RAISE EXCEPTION 'Lines of posted journal entries are immutable';
    END IF;

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payments_party_match ON payments;
CREATE TRIGGER trg_payments_party_match
BEFORE INSERT OR UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION validate_payment_party();

DROP TRIGGER IF EXISTS trg_customer_invoices_source_match ON customer_invoices;
CREATE TRIGGER trg_customer_invoices_source_match
BEFORE INSERT OR UPDATE ON customer_invoices
FOR EACH ROW
EXECUTE FUNCTION validate_invoice_source();

DROP TRIGGER IF EXISTS trg_customer_invoice_lines_source_match ON customer_invoice_lines;
CREATE TRIGGER trg_customer_invoice_lines_source_match
BEFORE INSERT OR UPDATE ON customer_invoice_lines
FOR EACH ROW
EXECUTE FUNCTION validate_invoice_line_source();

DROP TRIGGER IF EXISTS trg_vendor_bills_source_match ON vendor_bills;
CREATE TRIGGER trg_vendor_bills_source_match
BEFORE INSERT OR UPDATE ON vendor_bills
FOR EACH ROW
EXECUTE FUNCTION validate_bill_source();

DROP TRIGGER IF EXISTS trg_vendor_bill_lines_source_match ON vendor_bill_lines;
CREATE TRIGGER trg_vendor_bill_lines_source_match
BEFORE INSERT OR UPDATE ON vendor_bill_lines
FOR EACH ROW
EXECUTE FUNCTION validate_bill_line_source();

DROP TRIGGER IF EXISTS trg_journal_entries_immutable ON journal_entries;
CREATE TRIGGER trg_journal_entries_immutable
BEFORE UPDATE OR DELETE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION prevent_posted_journal_mutation();

DROP TRIGGER IF EXISTS trg_journal_entry_lines_immutable ON journal_entry_lines;
CREATE TRIGGER trg_journal_entry_lines_immutable
BEFORE UPDATE OR DELETE ON journal_entry_lines
FOR EACH ROW
EXECUTE FUNCTION prevent_posted_journal_line_mutation();
