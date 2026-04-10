-- Arena Architect: Material Supply Optimizer
-- Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'procurement' CHECK (role IN ('admin', 'procurement', 'project_manager')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'planning')),
    total_budget DECIMAL(15,2),
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Materials / BOQ Items
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50),
    quantity DECIMAL(15,2),
    estimated_unit_price DECIMAL(15,2),
    required_by DATE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    region VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    reliability_score DECIMAL(5,2) DEFAULT 0,
    total_deliveries INTEGER DEFAULT 0,
    on_time_deliveries INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Supplier Recommendations (from Cortex API)
CREATE TABLE IF NOT EXISTS supplier_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id),
    supplier_name VARCHAR(255),
    unit_price DECIMAL(15,2),
    availability_score DECIMAL(5,2),
    delivery_days INTEGER,
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
    price_trend VARCHAR(20) CHECK (price_trend IN ('rising', 'stable', 'falling')),
    recommended BOOLEAN DEFAULT FALSE,
    cortex_score DECIMAL(5,2),
    fetched_at TIMESTAMP DEFAULT NOW()
);

-- Pricing History
CREATE TABLE IF NOT EXISTS pricing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_name VARCHAR(255),
    category VARCHAR(100),
    region VARCHAR(100),
    unit_price DECIMAL(15,2),
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Risk Alerts
CREATE TABLE IF NOT EXISTS risk_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    material_id UUID REFERENCES materials(id),
    alert_type VARCHAR(50) CHECK (alert_type IN ('price_spike', 'shortage', 'delivery_delay', 'supplier_risk')),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT,
    region VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- File Uploads
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    filename VARCHAR(255),
    file_type VARCHAR(50),
    uploaded_by UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'processing',
    records_parsed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed demo user (password: demo1234)
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User', 'admin@arena.com', '$2b$10$rQZ8K7d1P.Xm2nVfAHbLue6zOjnpqxJqoKYJEWGZ8k0wVbMmKt0Ny', 'admin'),
('Procurement Lead', 'procurement@arena.com', '$2b$10$rQZ8K7d1P.Xm2nVfAHbLue6zOjnpqxJqoKYJEWGZ8k0wVbMmKt0Ny', 'procurement'),
('Project Manager', 'pm@arena.com', '$2b$10$rQZ8K7d1P.Xm2nVfAHbLue6zOjnpqxJqoKYJEWGZ8k0wVbMmKt0Ny', 'project_manager')
ON CONFLICT (email) DO NOTHING;

-- Seed demo suppliers
INSERT INTO suppliers (name, region, reliability_score, total_deliveries, on_time_deliveries) VALUES
('BuildPro Materials', 'South India', 92.5, 450, 416),
('Apex Construction Supplies', 'North India', 87.3, 320, 279),
('Karnataka Steel & Cement', 'Karnataka', 95.1, 670, 637),
('Mumbai Metro Supplies', 'Maharashtra', 81.2, 290, 235),
('Chennai Building Hub', 'Tamil Nadu', 88.7, 380, 337)
ON CONFLICT DO NOTHING;
