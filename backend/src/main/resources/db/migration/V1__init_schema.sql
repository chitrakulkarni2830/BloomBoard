CREATE TABLE products (
    id UUID PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE batches (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id),
    supplier_name VARCHAR(255),
    quantity_initial INT NOT NULL,
    quantity_available INT NOT NULL,
    purchase_price DECIMAL(10, 2) NOT NULL,
    received_date TIMESTAMP NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bouquets (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bouquet_items (
    id UUID PRIMARY KEY,
    bouquet_id UUID NOT NULL REFERENCES bouquets(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity_required INT NOT NULL
);

CREATE TABLE orders (
    id UUID PRIMARY KEY,
    customer_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id),
    bouquet_id UUID REFERENCES bouquets(id),
    product_id UUID REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    CONSTRAINT chk_item_type CHECK (
        (bouquet_id IS NOT NULL AND product_id IS NULL) OR 
        (bouquet_id IS NULL AND product_id IS NOT NULL)
    )
);

CREATE TABLE order_allocations (
    id UUID PRIMARY KEY,
    order_item_id UUID NOT NULL REFERENCES order_items(id),
    batch_id UUID NOT NULL REFERENCES batches(id),
    quantity_allocated INT NOT NULL
);

CREATE INDEX idx_batches_product_expiry ON batches(product_id, expiry_date);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_allocations_item ON order_allocations(order_item_id);
